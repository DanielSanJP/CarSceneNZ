"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Edit, Users, UserPlus, ExternalLink } from "lucide-react";
import { FaTiktok, FaFacebookF, FaInstagram } from "react-icons/fa";
import Image from "next/image";
import Link from "next/link";
import type { ProfileData, LeaderClubsData, User } from "@/types/user";
import { InviteToClub } from "@/components/clubs/invite-to-club";

interface ProfileHeaderProps {
  profileData: ProfileData;
  leaderClubsData?: LeaderClubsData | null;
  currentUser?: User | null;
  optimisticProfile: {
    isFollowing: boolean;
    followerCount: number;
  };
  onFollowToggle: () => void;
  sendClubInvitationAction: (
    targetUserId: string,
    clubId: string,
    message?: string
  ) => Promise<{ success: boolean; error?: string }>;
}

export function ProfileHeader({
  profileData,
  leaderClubsData = null,
  currentUser,
  optimisticProfile,
  onFollowToggle,
  sendClubInvitationAction,
}: ProfileHeaderProps) {
  const [clubsDialogOpen, setClubsDialogOpen] = useState(false);

  const { profileUser, userClubs } = profileData;
  const leaderClubs = leaderClubsData?.leaderClubs || [];
  const isOwnProfile = currentUser?.id === profileUser.id;

  return (
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

      {/* Right Side: Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-2 sm:justify-start">
        {isOwnProfile ? (
          <>
            <Link href="/profile/edit">
              <Button variant="outline" size="sm" className="w-full sm:w-fit">
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            </Link>

            <Dialog open={clubsDialogOpen} onOpenChange={setClubsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="w-full sm:w-fit">
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
                          <p className="font-medium">{userClub.club.name}</p>
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
              variant={optimisticProfile.isFollowing ? "outline" : "default"}
              size="sm"
              onClick={onFollowToggle}
              className="w-full sm:w-fit"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              {optimisticProfile.isFollowing ? "Unfollow" : "Follow"}
            </Button>

            <Dialog open={clubsDialogOpen} onOpenChange={setClubsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="w-full sm:w-fit">
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
                          <p className="font-medium">{userClub.club.name}</p>
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
              .filter((club): club is NonNullable<typeof club> => club !== null)
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
  );
}
