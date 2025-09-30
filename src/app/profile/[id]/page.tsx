import { UserProfileDisplay } from "@/components/profile/user-profile-display";
import { getAuthUser, getUserProfile } from "@/lib/auth";
import {
  toggleFollowUserAction,
  getProfileData,
  getLeaderClubsData,
} from "@/lib/actions";
import type { ProfileData, LeaderClubsData } from "@/types/user";
import { revalidatePath } from "next/cache";

interface UserProfilePageProps {
  params: Promise<{ id: string }>;
}

// Force dynamic rendering - don't try to build these pages statically
export const dynamic = "force-dynamic";
// Cache this page for 5 minutes, then revalidate in the background
export const revalidate = 300; // 5 minutes

// Server action for following/unfollowing users
async function followUserAction(targetUserId: string) {
  "use server";

  // Use the existing server action directly
  const result = await toggleFollowUserAction(targetUserId);

  if (!result.success) {
    return {
      success: false,
      error: result.error || "Failed to update follow status",
    };
  }

  // Single targeted cache invalidation
  revalidatePath(`/profile/[id]`, "page");

  return {
    success: true,
    isFollowing: result.isFollowing,
    followerCount: result.followerCount,
  };
}

export default async function UserProfilePage({
  params,
}: UserProfilePageProps) {
  const { id: usernameOrId } = await params;

  // Get current user (optional)
  const authUser = await getAuthUser();
  const currentUser = authUser ? await getUserProfile(authUser.id) : null;

  // Fetch profile data using server actions
  let profileData: ProfileData | null = null;

  try {
    profileData = await getProfileData(usernameOrId, currentUser?.id);
    // Set currentUser in the profile data
    profileData.currentUser = currentUser;
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
    leaderClubsData = await getLeaderClubsData(currentUser.id);
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
