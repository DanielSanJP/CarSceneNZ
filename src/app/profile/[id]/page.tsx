import {
  getUserFollowers,
  getUserFollowing,
  getUserProfile,
  getUserProfileByUsername,
} from "@/lib/server/profile";
import { getCarsByOwner } from "@/lib/server/cars";
import { getUser } from "@/lib/auth";
import { UserProfileClient } from "@/components/profile/user-profile-client";

interface UserProfilePageProps {
  params: Promise<{ id: string }>;
}

export default async function UserProfilePage({
  params,
}: UserProfilePageProps) {
  const { id: userId } = await params;

  // Get current user for authentication/following status
  const currentUser = await getUser();

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
      />
    );
  }

  // Fetch user data in parallel
  const [userCars, followers, following] = await Promise.allSettled([
    getCarsByOwner(profileUser.id),
    getUserFollowers(profileUser.id),
    getUserFollowing(profileUser.id),
  ]);

  // Extract data or use empty arrays on error
  const carsData = userCars.status === "fulfilled" ? userCars.value : [];
  const followersData = followers.status === "fulfilled" ? followers.value : [];
  const followingData = following.status === "fulfilled" ? following.value : [];

  return (
    <UserProfileClient
      profileUser={profileUser}
      currentUser={currentUser}
      userCars={carsData}
      followers={followersData}
      following={followingData}
    />
  );
}
