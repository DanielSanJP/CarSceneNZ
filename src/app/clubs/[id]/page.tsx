import { Suspense } from "react";
import { getUserOptional } from "@/lib/auth";
import { ClubDetailView } from "@/components/clubs/display/club-detail-view";
import type { ClubMailData } from "@/types/inbox";
import { createClient } from "@/lib/utils/supabase/server";
import { getUser } from "@/lib/auth";
import { Club } from "@/types";

interface ClubDetailPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string; tab?: string }>;
}

// Inline server functions from clubs.ts (minimal implementations for this page)
async function joinClub(
  clubId: string,
  userId: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const supabase = await createClient();

    // Check if already a member
    const { data: existingMember, error: checkError } = await supabase
      .from("club_members")
      .select("id")
      .eq("club_id", clubId)
      .eq("user_id", userId)
      .single();

    if (checkError && checkError.code !== "PGRST116") {
      console.error("Error checking existing membership:", checkError);
      return { success: false, message: "Failed to check membership status" };
    }

    if (existingMember) {
      return { success: false, message: "Already a member of this club" };
    }

    // Add user to club
    const { error: insertError } = await supabase.from("club_members").insert({
      club_id: clubId,
      user_id: userId,
      role: "member",
    });

    if (insertError) {
      console.error("Error joining club:", insertError);
      return { success: false, message: "Failed to join club" };
    }

    return { success: true };
  } catch (error) {
    console.error("Error in joinClub:", error);
    return { success: false, message: "Failed to join club" };
  }
}

async function leaveClub(
  clubId: string,
  userId: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const supabase = await createClient();

    // Don't allow leader to leave without transferring leadership
    const { data: club } = await supabase
      .from("clubs")
      .select("leader_id")
      .eq("id", clubId)
      .single();

    if (club?.leader_id === userId) {
      return {
        success: false,
        message: "Club leader must transfer leadership before leaving",
      };
    }

    // Remove user from club
    const { error } = await supabase
      .from("club_members")
      .delete()
      .eq("club_id", clubId)
      .eq("user_id", userId);

    if (error) {
      console.error("Error leaving club:", error);
      return { success: false, message: "Failed to leave club" };
    }

    return { success: true };
  } catch (error) {
    console.error("Error in leaveClub:", error);
    return { success: false, message: "Failed to leave club" };
  }
}

// Server action wrapper for sending club mail
async function sendClubMailAction(
  mailData: ClubMailData
): Promise<{ success: boolean; error?: string }> {
  "use server";

  try {
    const user = await getUser();
    if (!user) {
      return { success: false, error: "You must be logged in" };
    }

    const supabase = await createClient();

    // Verify user is club leader or admin
    const { data: membership, error: membershipError } = await supabase
      .from("club_members")
      .select("role, club:clubs(name)")
      .eq("club_id", mailData.club_id)
      .eq("user_id", user.id)
      .single();

    if (
      membershipError ||
      !membership ||
      !["leader", "admin"].includes(membership.role)
    ) {
      return {
        success: false,
        error: "You are not authorized to send club mail",
      };
    }

    // Get all club members
    const { data: members, error: membersError } = await supabase
      .from("club_members")
      .select("user_id")
      .eq("club_id", mailData.club_id)
      .neq("user_id", user.id); // Exclude sender

    if (membersError) {
      return { success: false, error: "Failed to get club members" };
    }

    if (!members || members.length === 0) {
      return { success: false, error: "No members to send mail to" };
    }

    // Send message to all members
    const clubName =
      (membership as { club?: { name?: string } }).club?.name || "Club";
    const messages = members.map((member) => ({
      receiver_id: member.user_id,
      sender_id: user.id,
      subject: `[${clubName}] ${mailData.subject}`,
      message: mailData.message,
      message_type: "club_mail",
      created_at: new Date().toISOString(),
    }));

    const { error: mailError } = await supabase
      .from("messages")
      .insert(messages);

    if (mailError) {
      return { success: false, error: "Failed to send club mail" };
    }

    return { success: true };
  } catch (error) {
    console.error("Error sending club mail:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

// Server action wrapper for joining a club
async function joinClubAction(
  clubId: string,
  userId: string
): Promise<{ success: boolean; message?: string }> {
  "use server";
  return await joinClub(clubId, userId);
}

// Server action wrapper for leaving a club
async function leaveClubAction(
  clubId: string,
  userId: string
): Promise<{ success: boolean; message?: string }> {
  "use server";
  return await leaveClub(clubId, userId);
}

// Server action wrapper for sending club join request
async function sendClubJoinRequestAction(
  clubId: string,
  message?: string
): Promise<{ success: boolean; error?: string }> {
  "use server";

  try {
    const user = await getUser();
    if (!user) {
      return {
        success: false,
        error: "You must be logged in to send a join request",
      };
    }

    const supabase = await createClient();

    // Check if club exists
    const { data: club, error: clubError } = await supabase
      .from("clubs")
      .select("id, name, leader_id")
      .eq("id", clubId)
      .single();

    if (clubError || !club) {
      return { success: false, error: "Club not found" };
    }

    // Check if user is already a member
    const { data: existingMember } = await supabase
      .from("club_members")
      .select("id")
      .eq("club_id", clubId)
      .eq("user_id", user.id)
      .single();

    if (existingMember) {
      return { success: false, error: "You are already a member of this club" };
    }

    // Check if request already exists
    const { data: existingRequest } = await supabase
      .from("messages")
      .select("id")
      .eq("receiver_id", club.leader_id)
      .eq("sender_id", user.id)
      .eq("message_type", "club_join_request")
      .single();

    if (existingRequest) {
      return {
        success: false,
        error: "You have already sent a join request to this club",
      };
    }

    // Send join request message
    const { error: messageError } = await supabase.from("messages").insert({
      receiver_id: club.leader_id,
      sender_id: user.id,
      subject: `Join Request for ${club.name}`,
      message:
        message || `${user.username} wants to join your club "${club.name}"`,
      message_type: "club_join_request",
      created_at: new Date().toISOString(),
    });

    if (messageError) {
      console.error("Error sending join request:", messageError);
      return { success: false, error: "Failed to send join request" };
    }

    return { success: true };
  } catch (error) {
    console.error("Error sending club join request:", error);
    return { success: false, error: "Failed to send join request" };
  }
}

export default async function ClubDetailPage({
  params,
  searchParams,
}: ClubDetailPageProps) {
  const { id } = await params;
  const { from = "join", tab = "clubs" } = await searchParams;

  // Get current user (optional)
  const currentUser = await getUserOptional();

  // Let the client component handle all data fetching through React Query + RPC
  // This follows the same pattern as other pages in the app
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background">
          <div className="container mx-auto px-4 py-8">
            <div className="text-center">
              <h1 className="text-2xl font-bold">Loading...</h1>
            </div>
          </div>
        </div>
      }
    >
      <ClubDetailView
        club={{ id } as Club} // Placeholder - component should be updated to use React Query
        members={[]}
        memberCount={0}
        currentUser={
          currentUser
            ? {
                ...currentUser,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              }
            : null
        }
        isUserMember={false}
        userRole={undefined}
        fromTab={from}
        leaderboardTab={tab}
        sendClubMailAction={sendClubMailAction}
        joinClubAction={joinClubAction}
        leaveClubAction={leaveClubAction}
        sendClubJoinRequestAction={sendClubJoinRequestAction}
      />
    </Suspense>
  );
}
