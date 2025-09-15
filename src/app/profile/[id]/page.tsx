import { UserProfileDisplay } from "@/components/profile/user-profile-display";
import { getUserOptional } from "@/lib/auth";
import { createClient } from "@/lib/utils/supabase/server";
import type { ProfileData, LeaderClubsData } from "@/types/user";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getBaseUrl } from "@/lib/utils";

interface UserProfilePageProps {
  params: Promise<{ id: string }>;
}

// Force dynamic rendering - don't try to build these pages statically
export const dynamic = "force-dynamic";

// Server action for following/unfollowing users
async function followUserAction(
  targetUserId: string,
  action: "follow" | "unfollow"
) {
  "use server";

  const user = await getUserOptional();
  if (!user) {
    redirect("/login");
  }

  const supabase = await createClient();

  try {
    console.log(
      `🔄 Server Action: ${action} user ${targetUserId}, current user ${user.id}`
    );

    // Use our simplified API route instead of RPC
    const response = await fetch(`${getBaseUrl()}/api/profile/follow`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        targetUserId: targetUserId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("❌ Follow/Unfollow API Error:", errorData);
      return {
        success: false,
        error: errorData.error || "Failed to update follow status",
      };
    }

    const data = await response.json();
    console.log(`✅ ${action} Success:`, data);

    // Revalidate relevant pages
    revalidatePath(`/profile/${targetUserId}`);
    revalidatePath("/"); // Homepage might show followed users' content

    // Also try to get the username for revalidation
    const { data: targetUser } = await supabase
      .from("users")
      .select("username")
      .eq("id", targetUserId)
      .single();

    if (targetUser?.username) {
      revalidatePath(`/profile/${targetUser.username}`);
    }

    return {
      success: true,
      action: data.action,
      isFollowing: data.isFollowing,
      newFollowersCount: data.newFollowersCount,
    };
  } catch (error) {
    console.error("❌ Follow/Unfollow Server Action Exception:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : `Failed to ${action} user`,
    };
  }
}

// Server-side leader clubs data fetching using cached API route
async function getLeaderClubsDataSSR(
  userId: string
): Promise<LeaderClubsData | null> {
  const startTime = Date.now();

  try {
    console.log(
      `🚀 SSR CACHE: Fetching leader clubs for user ${userId} via cached API route...`
    );

    const response = await fetch(`${getBaseUrl()}/api/profile/leader-clubs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: userId,
      }),
      // Leverage the API route's caching
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      console.error(
        `❌ Leader clubs API route failed: ${response.status} ${response.statusText}`
      );
      return null; // Don't fail the whole page, just don't show invite buttons
    }

    const leaderClubsData = await response.json();

    console.log(
      `✅ SSR CACHE: Leader clubs for user ${userId} fetched via API route in ${
        Date.now() - startTime
      }ms - ${leaderClubsData.leaderClubs?.length || 0} clubs`
    );

    return leaderClubsData as LeaderClubsData;
  } catch (error) {
    console.error("Error fetching leader clubs data:", error);
    return null; // Don't fail the whole page, just don't show invite buttons
  }
}

// Server-side profile data fetching using cached API route
async function getProfileDataSSR(
  usernameOrId: string,
  currentUserId?: string
): Promise<ProfileData> {
  const startTime = Date.now();

  try {
    console.log(
      `🚀 SSR CACHE: Fetching profile ${usernameOrId} via cached API route...`
    );

    const response = await fetch(
      `${
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      }/api/profile/${usernameOrId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentUserId: currentUserId || null,
        }),
        // Leverage the API route's caching
        next: { revalidate: 300 },
      }
    );

    if (!response.ok) {
      console.error(
        `❌ Profile API route failed: ${response.status} ${response.statusText}`
      );
      throw new Error("User not found");
    }

    const responseData = await response.json();
    const profileData = responseData.profileData;

    console.log(`🔍 DEBUG: SSR Response structure:`, {
      hasResponseData: !!responseData,
      hasProfileData: !!profileData,
      hasProfileUser: !!profileData?.profileUser,
      profileUserKeys: profileData?.profileUser
        ? Object.keys(profileData.profileUser)
        : "none",
    });

    console.log(
      `✅ SSR CACHE: Profile ${usernameOrId} data fetched via API route in ${
        Date.now() - startTime
      }ms`
    );

    return profileData as ProfileData;
  } catch (error) {
    console.error("Error fetching profile data:", error);
    throw new Error("Failed to fetch profile data");
  }
}

export default async function UserProfilePage({
  params,
}: UserProfilePageProps) {
  const { id: usernameOrId } = await params;

  // Get current user (optional)
  const currentUser = await getUserOptional();

  // Fetch profile data using cached API route
  let profileData: ProfileData | null = null;

  try {
    profileData = await getProfileDataSSR(usernameOrId, currentUser?.id);
  } catch (error) {
    console.error("Failed to fetch profile data on server:", error);
    // Return error state
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Failed to load profile</h2>
          <p className="text-muted-foreground mb-6">
            There was an error loading the profile information.
          </p>
        </div>
      </div>
    );
  }

  // Fetch leader clubs data if current user is viewing someone else's profile
  let leaderClubsData: LeaderClubsData | null = null;
  const isOwnProfile = currentUser?.id === profileData?.profileUser?.id;

  if (currentUser && !isOwnProfile) {
    leaderClubsData = await getLeaderClubsDataSSR(currentUser.id);
  }

  return (
    <UserProfileDisplay
      profileData={profileData}
      leaderClubsData={leaderClubsData}
      currentUser={currentUser}
      followUserAction={followUserAction}
    />
  );
}

export const revalidate = 300; // 5 minutes
