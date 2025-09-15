"use client";

import { useState } from "react";
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
import { toast } from "sonner";
import Image from "next/image";
import Link from "next/link";
import type { ProfileData, LeaderClubsData, User } from "@/types/user";
import { InviteToClub } from "@/components/clubs/invite-to-club";

interface UserProfileDisplayProps {
  profileData: ProfileData;
  leaderClubsData?: LeaderClubsData | null;
  currentUser: User | null;
  followUserAction?: (
    targetUserId: string,
    action: "follow" | "unfollow"
  ) => Promise<{
    success: boolean;
    error?: string;
    action?: string;
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
  const [isFollowLoading, setIsFollowLoading] = useState(false);

  // Use data directly from props (no React Query)
  const leaderClubs = leaderClubsData?.leaderClubs || [];

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

    const action = profileData.isFollowing ? "unfollow" : "follow";

    setIsFollowLoading(true);
    try {
      const result = await followUserAction(profileData.profileUser.id, action);

      if (!result.success) {
        throw new Error(result.error || `Failed to ${action} user`);
      }

      // Success - no toast needed, button state change is sufficient UX
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      toast.error(`Failed to ${action}: ${errorMessage}`);
    } finally {
      setIsFollowLoading(false);
    }
  };

  // Extract data from props
  const {
    profileUser,
    userCars,
    followers,
    following,
    userClubs,
    isFollowing,
  } = profileData;

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

  const isOwnProfile = currentUser?.id === profileUser.id;

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
          {/* Three Column Layout */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-center justify-items-center">
            {/* Column 1: Profile Image, Display Name, Username, Edit Button */}
            <div className="flex items-start gap-4 w-full">
              <div className="relative h-24 w-24 sm:h-32 sm:w-32 lg:h-48 lg:w-48 flex-shrink-0 rounded-full overflow-hidden bg-muted">
                {profileUser.profile_image_url ? (
                  <Image
                    src={profileUser.profile_image_url}
                    alt={profileUser.username}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    quality={100}
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
              <div className="flex flex-col justify-center space-y-2 min-h-[96px] sm:min-h-[128px] lg:min-h-[192px]">
                <h2 className="text-xl font-semibold">
                  {profileUser.display_name || profileUser.username}
                </h2>
                <p className="text-muted-foreground">@{profileUser.username}</p>
                {isOwnProfile ? (
                  <Link href="/profile/edit">
                    <Button variant="outline" size="sm" className="w-fit">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>
                  </Link>
                ) : (
                  <Button
                    variant={isFollowing ? "outline" : "default"}
                    size="sm"
                    onClick={handleFollowToggle}
                    disabled={isFollowLoading}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    {isFollowLoading
                      ? "Loading..."
                      : isFollowing
                      ? "Unfollow"
                      : "Follow"}
                  </Button>
                )}
                {!isOwnProfile && currentUser && leaderClubs.length > 0 && (
                  <InviteToClub
                    targetUserId={profileUser.id}
                    targetUsername={profileUser.username}
                    leaderClubs={leaderClubs
                      .filter(
                        (club): club is NonNullable<typeof club> =>
                          club !== null
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
            </div>

            {/* Column 2: Club Name and Image */}
            <div className="flex flex-col items-center text-center space-y-3">
              {userClubs.length > 0 ? (
                <>
                  {/* Club Name Title */}
                  <Link
                    href={`/clubs/${userClubs[0].club.id}`}
                    className="text-lg font-bold text-center hover:text-primary transition-colors"
                  >
                    {userClubs[0].club.name}
                    {userClubs.length > 1 && (
                      <span className="text-sm text-muted-foreground ml-1">
                        +{userClubs.length - 1}
                      </span>
                    )}
                  </Link>

                  {/* Club Image/Badge */}
                  <Link
                    href={`/clubs/${userClubs[0].club.id}`}
                    className="relative h-24 w-24 sm:h-32 sm:w-32 lg:h-48 lg:w-48 flex-shrink-0 rounded-lg overflow-hidden bg-muted hover:scale-105 transition-transform"
                  >
                    {userClubs[0].club.banner_image_url ? (
                      <Image
                        src={userClubs[0].club.banner_image_url}
                        alt={userClubs[0].club.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 96px, (max-width: 1024px) 128px, 192px"
                        quality={100}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/30 to-primary/60 flex items-center justify-center">
                        <span className="text-lg sm:text-xl lg:text-3xl font-bold text-white">
                          {userClubs[0].club.name.charAt(0)}
                        </span>
                      </div>
                    )}
                  </Link>

                  {/* View Club Button */}
                  <Link href={`/clubs/${userClubs[0].club.id}`}>
                    <Button variant="outline" size="sm">
                      <Users className="h-4 w-4 mr-2" />
                      View Club
                    </Button>
                  </Link>
                </>
              ) : (
                <div className="flex flex-col items-center space-y-3">
                  <div className="text-muted-foreground">
                    {isOwnProfile ? "No club yet" : "Not in a club"}
                  </div>
                  {isOwnProfile && (
                    <Link href="/clubs">
                      <Button variant="outline" size="sm">
                        <Users className="h-4 w-4 mr-2" />
                        Join a club
                      </Button>
                    </Link>
                  )}
                </div>
              )}
            </div>

            {/* Column 3: Total Likes */}
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="text-lg font-semibold text-muted-foreground">
                Total Likes
              </div>
              <div className="flex items-center justify-center gap-2">
                <Star className="h-8 w-8 text-yellow-500 fill-yellow-500" />
                <span className="text-3xl font-bold text-primary">
                  {userCars.reduce(
                    (sum: number, car) => sum + (car.total_likes || 0),
                    0
                  )}
                </span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="flex flex-col gap-4">
              {/* Stats Grid - Mobile: 2x2, Desktop: 1x3 */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
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
                        {followers.length}
                      </span>
                    </button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Followers ({followers.length})</DialogTitle>
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
                          window.location.href = `/garage/${car.id}`;
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
