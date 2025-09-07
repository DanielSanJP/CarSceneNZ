import {
  getUserFollowers,
  getUserFollowing,
  getUserProfile,
  getUserProfileByUsername,
} from "@/lib/server/profile";
import { getUserClubMemberships } from "@/lib/server/clubs";
import { getUserOptional } from "@/lib/auth";
import { getUserLeaderClubs, sendClubInvitation } from "@/lib/server/inbox";
import { UserProfileClient } from "@/components/profile/user-profile-client";
import { createClient } from "@/lib/utils/supabase/server";
import { revalidatePath } from "next/cache";
import type { Car } from "@/types/car";

const getCarsByOwner = async (ownerId: string): Promise<Car[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cars")
    .select("*")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching cars by owner:", error);
    return [];
  }

  return data as Car[];
};

interface UserProfilePageProps {
  params: Promise<{ id: string }>;
}

// Server action for sending club invitation
async function sendClubInvitationAction(
  targetUserId: string,
  clubId: string,
  message?: string
) {
  "use server";

  const result = await sendClubInvitation(targetUserId, clubId, message);

  // Force revalidation of the profile page
  revalidatePath(`/profile/${targetUserId}`);

  return result;
}

export default async function UserProfilePage({
  params,
}: UserProfilePageProps) {
  const { id: userId } = await params;

  // Get current user for authentication/following status (optional - allows public access)
  const currentUser = await getUserOptional();

  // Try to get user profile - first by ID, then by username
  let profileUser = await getUserProfile(userId);

  // If not found by ID and userId doesn't look like a UUID, try username lookup
  if (
    !profileUser &&
    !userId.match(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    )
  ) {
    profileUser = await getUserProfileByUsername(userId);
  }

  // If user not found, pass null and let client handle the error state
  if (!profileUser) {
    return (
      <UserProfileClient
        profileUser={null}
        currentUser={currentUser}
        userCars={[]}
        followers={[]}
        following={[]}
        userClubs={[]}
        leaderClubs={[]}
        sendClubInvitationAction={sendClubInvitationAction}
      />
    );
  }

  // Get leader clubs for current user (for invitation functionality)
  const leaderClubsRaw = currentUser
    ? await getUserLeaderClubs(currentUser.id)
    : [];
  console.log("Leader clubs raw:", leaderClubsRaw);
  const leaderClubs = leaderClubsRaw.map((club) =>
    club
      ? {
          id: club.id,
          name: club.name,
          description: club.description || "",
          image_url: club.banner_image_url || null,
          memberCount: club.memberCount,
        }
      : null
  );

  // Fetch user data in parallel
  const [userCars, followers, following, userClubs] = await Promise.allSettled([
    getCarsByOwner(profileUser.id),
    getUserFollowers(profileUser.id),
    getUserFollowing(profileUser.id),
    getUserClubMemberships(profileUser.id),
  ]);

  // Extract data or use empty arrays on error
  const carsData = userCars.status === "fulfilled" ? userCars.value : [];
  const followersData = followers.status === "fulfilled" ? followers.value : [];
  const followingData = following.status === "fulfilled" ? following.value : [];
  const clubsData = userClubs.status === "fulfilled" ? userClubs.value : [];

  return (
    <UserProfileClient
      profileUser={profileUser}
      currentUser={currentUser}
      userCars={carsData}
      followers={followersData}
      following={followingData}
      userClubs={clubsData}
      leaderClubs={leaderClubs}
      sendClubInvitationAction={sendClubInvitationAction}
    />
  );
}
