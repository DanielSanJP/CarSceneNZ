import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getUserOptional } from "@/lib/auth";
import {
  getClubById,
  getClubMembersWithStats,
  isClubMember,
  updateClubTotalLikes,
  joinClub,
  leaveClub,
} from "@/lib/server/clubs";
import { sendClubMail, sendClubJoinRequest } from "@/lib/server/inbox";
import { ClubDetailView } from "@/components/clubs/display/club-detail-view";
import type { ClubMailData } from "@/types/inbox";

interface ClubDetailPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string; tab?: string }>;
}

// Server action wrapper for sending club mail
async function sendClubMailAction(
  mailData: ClubMailData
): Promise<{ success: boolean; error?: string }> {
  "use server";
  return await sendClubMail(mailData);
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
  return await sendClubJoinRequest(clubId, message);
}

export default async function ClubDetailPage({
  params,
  searchParams,
}: ClubDetailPageProps) {
  const { id } = await params;
  const { from = "join", tab = "clubs" } = await searchParams;

  const [currentUser, club] = await Promise.all([
    getUserOptional(),
    getClubById(id),
  ]);

  if (!club) {
    notFound();
  }

  const [members, isUserMember] = await Promise.all([
    getClubMembersWithStats(club.id),
    currentUser
      ? isClubMember(club.id, currentUser.id)
      : Promise.resolve(false),
  ]);

  // Update club total likes (this will be automatic with triggers, but we can call it manually if needed)
  await updateClubTotalLikes(club.id);

  const memberCount = members.length;

  // Find user's role in the club
  const userMembership = currentUser
    ? members.find((member) => member.user_id === currentUser.id)
    : null;
  const userRole = userMembership?.role;

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
        club={club}
        members={members}
        memberCount={memberCount}
        currentUser={
          currentUser
            ? {
                ...currentUser,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              }
            : null
        }
        isUserMember={isUserMember}
        userRole={userRole}
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
