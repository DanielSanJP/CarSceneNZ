"use client";

import { useState, useOptimistic, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Car,
  Star,
  Eye,
  ExternalLink,
  Edit,
  Users,
  UserPlus,
} from "lucide-react";
import { FaTiktok, FaFacebookF, FaInstagram } from "react-icons/fa";
import { toast } from "sonner";
import Image from "next/image";
import Link from "next/link";
import type { ProfileData, LeaderClubsData, User } from "@/types/user";
import { InviteToClub } from "@/components/clubs/invite-to-club";

interface UserProfileDisplayProps {
  profileData: ProfileData;
  leaderClubsData?: LeaderClubsData | null;
  currentUser: User | null;
  followUserAction?: (targetUserId: string) => Promise<{
    success: boolean;
    error?: string;
    isFollowing?: boolean;
    followerCount?: number;
  }>;
}

export function UserProfileDisplay({
  profileData,
  leaderClubsData = null,
  currentUser,
  followUserAction,
}: UserProfileDisplayProps) {
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const [followersDialogOpen, setFollowersDialogOpen] = useState(false);
  const [followingDialogOpen, setFollowingDialogOpen] = useState(false);
  const [clubsDialogOpen, setClubsDialogOpen] = useState(false);
  const router = useRouter();

  // Extract data from props
  const {
    profileUser,
    userCars,
    followers,
    following,
    userClubs,
    isFollowing,
  } = profileData;

  // Optimistic state for instant UI updates
  const [optimisticProfile, addOptimisticUpdate] = useOptimistic(
    { isFollowing, followerCount: followers.length },
    (state, newFollowState: boolean) => ({
      isFollowing: newFollowState,
      followerCount: state.followerCount + (newFollowState ? 1 : -1),
    })
  );

  const [, startTransition] = useTransition();

  // Use data directly from props
  const leaderClubs = leaderClubsData?.leaderClubs || [];
  const isOwnProfile = currentUser?.id === profileUser.id;

  const handleImageError = (carId: string) => {
    setFailedImages((prev) => new Set(prev).add(carId));
  };

  const handleFollowToggle = async () => {
    if (!currentUser || !profileData) {
      toast.error("Please log in to follow users");
      return;
    }

    if (!followUserAction) {
      toast.error("Follow action not available");
      return;
    }

    // Run server action in transition with optimistic update
    startTransition(async () => {
      // Optimistic update - instant UI change
      const newFollowState = !optimisticProfile.isFollowing;
      addOptimisticUpdate(newFollowState);

      try {
        const result = await followUserAction(profileData.profileUser.id);

        if (!result.success) {
          // Server action will handle reverting the optimistic update
          toast.error(result.error || "Failed to update follow status");
        }
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        toast.error(`Failed to update follow status: ${errorMessage}`);
      }
    });
  };

  // Add safety check for profileUser
  if (!profileUser) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Profile data incomplete</h2>
          <p className="text-muted-foreground mb-6">
            The profile information is missing or incomplete.
          </p>
        </div>
      </div>
    );
  }

  // DEBUG: Log social media data
  console.log("DEBUG - Social media data:", {
    instagram: profileUser.instagram_url,
    facebook: profileUser.facebook_url,
    tiktok: profileUser.tiktok_url,
    hasAny: !!(
      profileUser.instagram_url ||
      profileUser.facebook_url ||
      profileUser.tiktok_url
    ),
  });

  // API wrapper for club invitations
  const sendClubInvitationAction = async (
    targetUserId: string,
    clubId: string,
    message?: string
  ) => {
    try {
      const response = await fetch("/api/clubs/invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          targetUserId,
          clubId,
          message,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        return {
          success: false,
          error: error.error || "Failed to send club invitation",
        };
      }

      const result = await response.json();
      return {
        success: true,
        ...result,
      };
    } catch (error) {
      console.error("Club invitation error:", error);
      return {
        success: false,
        error: "An unexpected error occurred",
      };
    }
  };

  return (
    <div className="space-y-6">
      {/* Profile Info */}
      <Card>
        <CardHeader>
          {/* Flex Layout with Justify Between */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full gap-4">
            {/* Left Side: Profile Image and Details */}
            <div className="flex items-center gap-4">
              <div className="relative h-20 w-20 sm:h-24 sm:w-24 lg:h-28 lg:w-28 flex-shrink-0 rounded-full overflow-hidden bg-muted">
                {profileUser.profile_image_url ? (
                  <Image
                    src={profileUser.profile_image_url}
                    alt={profileUser.username}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 160px, (max-width: 1024px) 192px, 224px"
                    quality={90}
                    priority={true}
                    unoptimized={false}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-lg font-medium">
                    {profileUser.display_name?.slice(0, 2).toUpperCase() ||
                      profileUser.username.slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="flex flex-col justify-center space-y-1">
                <h2 className="text-xl font-semibold">
                  {profileUser.display_name || profileUser.username}
                </h2>
                <p className="text-muted-foreground">@{profileUser.username}</p>

                {/* Social Media Links */}
                {(profileUser.instagram_url ||
                  profileUser.facebook_url ||
                  profileUser.tiktok_url) && (
                  <div className="flex items-center gap-2 mt-2">
                    {profileUser.instagram_url && (
                      <Link
                        href={profileUser.instagram_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-pink-500 transition-colors"
                      >
                        <FaInstagram className="h-7 w-7" />
                      </Link>
                    )}
                    {profileUser.facebook_url && (
                      <Link
                        href={profileUser.facebook_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-blue-600 transition-colors"
                      >
                        <FaFacebookF className="h-6 w-6" />
                      </Link>
                    )}
                    {profileUser.tiktok_url && (
                      <Link
                        href={profileUser.tiktok_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground transition-colors"
                        style={{ color: "inherit" }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.color = "#FE2F5D")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.color = "inherit")
                        }
                      >
                        <FaTiktok className="h-6 w-6" />
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Action Buttons Section */}
          <div className="flex flex-col sm:flex-row gap-2 sm:justify-start">
            {isOwnProfile ? (
              <>
                <Link href="/profile/edit">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full sm:w-fit"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                </Link>

                <Dialog
                  open={clubsDialogOpen}
                  onOpenChange={setClubsDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full sm:w-fit"
                    >
                      <Users className="h-4 w-4 mr-2" />
                      View Clubs ({userClubs.length})
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>My Clubs ({userClubs.length})</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      {userClubs.length === 0 ? (
                        <div className="text-center py-8">
                          <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                          <p className="text-center text-muted-foreground mb-4">
                            You&apos;re not part of any clubs yet
                          </p>
                          <Link href="/clubs">
                            <Button onClick={() => setClubsDialogOpen(false)}>
                              <Users className="h-4 w-4 mr-2" />
                              Explore Clubs
                            </Button>
                          </Link>
                        </div>
                      ) : (
                        userClubs.map((userClub) => (
                          <Link
                            key={userClub.club.id}
                            href={`/clubs/${userClub.club.id}`}
                            onClick={() => setClubsDialogOpen(false)}
                            className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors border"
                          >
                            <div className="relative h-12 w-12 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
                              {userClub.club.banner_image_url ? (
                                <Image
                                  src={userClub.club.banner_image_url}
                                  alt={userClub.club.name}
                                  fill
                                  className="object-cover"
                                  sizes="128px"
                                  quality={100}
                                  priority={false}
                                  unoptimized={false}
                                />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-primary/30 to-primary/60 flex items-center justify-center">
                                  <span className="text-sm font-bold text-white">
                                    {userClub.club.name.charAt(0)}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium">
                                {userClub.club.name}
                              </p>
                              {userClub.club.description && (
                                <p className="text-sm text-muted-foreground truncate">
                                  {userClub.club.description}
                                </p>
                              )}
                            </div>
                            <ExternalLink className="h-4 w-4 text-muted-foreground" />
                          </Link>
                        ))
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              </>
            ) : (
              <>
                <Button
                  variant={
                    optimisticProfile.isFollowing ? "outline" : "default"
                  }
                  size="sm"
                  onClick={handleFollowToggle}
                  className="w-full sm:w-fit"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  {optimisticProfile.isFollowing ? "Unfollow" : "Follow"}
                </Button>

                <Dialog
                  open={clubsDialogOpen}
                  onOpenChange={setClubsDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full sm:w-fit"
                    >
                      <Users className="h-4 w-4 mr-2" />
                      View Clubs ({userClubs.length})
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>
                        {profileUser.display_name || profileUser.username}
                        &apos;s Clubs ({userClubs.length})
                      </DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      {userClubs.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">
                          Not part of any clubs yet
                        </p>
                      ) : (
                        userClubs.map((userClub) => (
                          <Link
                            key={userClub.club.id}
                            href={`/clubs/${userClub.club.id}`}
                            onClick={() => setClubsDialogOpen(false)}
                            className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors border"
                          >
                            <div className="relative h-12 w-12 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
                              {userClub.club.banner_image_url ? (
                                <Image
                                  src={userClub.club.banner_image_url}
                                  alt={userClub.club.name}
                                  fill
                                  className="object-cover"
                                  sizes="48px"
                                  quality={100}
                                  priority={false}
                                  unoptimized={false}
                                />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-primary/30 to-primary/60 flex items-center justify-center">
                                  <span className="text-sm font-bold text-white">
                                    {userClub.club.name.charAt(0)}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium">
                                {userClub.club.name}
                              </p>
                              {userClub.club.description && (
                                <p className="text-sm text-muted-foreground truncate">
                                  {userClub.club.description}
                                </p>
                              )}
                            </div>
                            <ExternalLink className="h-4 w-4 text-muted-foreground" />
                          </Link>
                        ))
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              </>
            )}

            {!isOwnProfile && currentUser && leaderClubs.length > 0 && (
              <InviteToClub
                targetUserId={profileUser.id}
                targetUsername={profileUser.username}
                leaderClubs={leaderClubs
                  .filter(
                    (club): club is NonNullable<typeof club> => club !== null
                  )
                  .map((club) => ({
                    id: club.id,
                    name: club.name,
                    description: club.description || "",
                    banner_image_url: club.image_url || undefined,
                    created_at: "",
                    updated_at: "",
                    leader_id: currentUser.id,
                    total_likes: 0,
                    memberCount: club.memberCount,
                  }))}
                sendClubInvitationAction={sendClubInvitationAction}
              />
            )}
          </div>
          <div className="space-y-3">
            <div className="flex flex-col gap-4">
              {/* Stats Grid - Mobile: 2x2, Desktop: 1x4 */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
                <Dialog
                  open={followingDialogOpen}
                  onOpenChange={setFollowingDialogOpen}
                >
                  <DialogTrigger asChild>
                    <button className="flex items-center space-x-2 hover:underline cursor-pointer justify-start">
                      <span className="text-sm">Following</span>
                      <span className="font-semibold text-sm">
                        {following.length}
                      </span>
                    </button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Following ({following.length})</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      {following.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">
                          Not following anyone yet
                        </p>
                      ) : (
                        following.map((followedUser) => (
                          <Link
                            key={followedUser.id}
                            href={`/profile/${followedUser.username}`}
                            onClick={() => setFollowingDialogOpen(false)}
                            className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                          >
                            <div className="relative h-10 w-10 flex-shrink-0 rounded-full overflow-hidden bg-muted">
                              {followedUser.profile_image_url ? (
                                <Image
                                  src={followedUser.profile_image_url}
                                  alt={followedUser.username}
                                  fill
                                  className="object-cover"
                                  sizes="40px"
                                  quality={100}
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-sm font-medium">
                                  {followedUser.display_name
                                    ?.slice(0, 2)
                                    .toUpperCase() ||
                                    followedUser.username
                                      .slice(0, 2)
                                      .toUpperCase()}
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium">
                                {followedUser.display_name ||
                                  followedUser.username}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                @{followedUser.username}
                              </p>
                            </div>
                            <ExternalLink className="h-4 w-4 text-muted-foreground" />
                          </Link>
                        ))
                      )}
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog
                  open={followersDialogOpen}
                  onOpenChange={setFollowersDialogOpen}
                >
                  <DialogTrigger asChild>
                    <button className="flex items-center space-x-2 hover:underline cursor-pointer justify-start">
                      <span className="text-sm">Followers</span>
                      <span className="font-semibold text-sm">
                        {optimisticProfile.followerCount}
                      </span>
                    </button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>
                        Followers ({optimisticProfile.followerCount})
                      </DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      {followers.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">
                          No followers yet
                        </p>
                      ) : (
                        followers.map((follower) => (
                          <Link
                            key={follower.id}
                            href={`/profile/${follower.username}`}
                            onClick={() => setFollowersDialogOpen(false)}
                            className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                          >
                            <div className="relative h-10 w-10 flex-shrink-0 rounded-full overflow-hidden bg-muted">
                              {follower.profile_image_url ? (
                                <Image
                                  src={follower.profile_image_url}
                                  alt={follower.username}
                                  fill
                                  className="object-cover"
                                  sizes="40px"
                                  quality={100}
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-sm font-medium">
                                  {follower.display_name
                                    ?.slice(0, 2)
                                    .toUpperCase() ||
                                    follower.username.slice(0, 2).toUpperCase()}
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium">
                                {follower.display_name || follower.username}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                @{follower.username}
                              </p>
                            </div>
                            <ExternalLink className="h-4 w-4 text-muted-foreground" />
                          </Link>
                        ))
                      )}
                    </div>
                  </DialogContent>
                </Dialog>

                <div className="flex items-center space-x-2">
                  <Car className="h-4 w-4 text-primary" />
                  <span className="text-sm">Cars</span>
                  <span className="font-semibold text-sm">
                    {userCars.length}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                  <span className="text-sm">Likes</span>
                  <span className="font-semibold text-sm">
                    {userCars.reduce(
                      (sum: number, car) => sum + (car.total_likes || 0),
                      0
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cars Grid */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5" />
              {isOwnProfile
                ? "My Cars"
                : `${
                    profileUser.display_name || profileUser.username
                  }'s Garage`}
              {isOwnProfile && (
                <Link href="/garage/my-garage">
                  <Button variant="outline" size="sm" className="ml-3">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    My Garage
                  </Button>
                </Link>
              )}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {userCars.length === 0 ? (
            <div className="text-center py-12">
              <Car className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {isOwnProfile
                  ? "No cars in your garage yet"
                  : "No public cars to display"}
              </h3>
              <p className="text-muted-foreground">
                {isOwnProfile
                  ? "Add your first car to get started"
                  : `${
                      profileUser.display_name || profileUser.username
                    } hasn't shared any cars publicly yet`}
              </p>
              {isOwnProfile && (
                <Link href="/garage/create" className="mt-4 inline-block">
                  <Button>Add Your First Car</Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {userCars.map((car) => (
                <Link href={`/garage/${car.id}`} key={car.id}>
                  <Card className="overflow-hidden pt-0">
                    {/* Car Image */}
                    <div className="relative aspect-square overflow-hidden">
                      {failedImages.has(car.id) || !car.image_url ? (
                        <div className="aspect-square bg-muted flex items-center justify-center">
                          <Car className="h-12 w-12 text-muted-foreground" />
                        </div>
                      ) : (
                        <Image
                          src={car.image_url}
                          alt={`${car.brand} ${car.model}`}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          quality={100}
                          priority={true}
                          unoptimized={false}
                          onError={() => handleImageError(car.id)}
                        />
                      )}
                    </div>

                    <CardContent className="p-4 py-0">
                      <h3 className="font-semibold mb-2">
                        {car.year} {car.brand} {car.model}
                      </h3>
                      <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
                        <span className="flex items-center gap-1">
                          <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                          {car.total_likes || 0}
                        </span>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          router.push(`/garage/${car.id}`);
                        }}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
