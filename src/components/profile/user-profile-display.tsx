"use client";

import { useOptimistic, useTransition } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { toast } from "sonner";
import type { ProfileData, LeaderClubsData, User } from "@/types/user";
import { ProfileHeader } from "./profile-header";
import { ProfileStats } from "./profile-stats";
import { ProfileCarsGrid } from "./profile-cars-grid";

interface UserProfileDisplayProps {
  profileData: ProfileData;
  leaderClubsData?: LeaderClubsData | null;
  currentUser?: User | null;
  followUserAction?: (userId: string) => Promise<{
    success: boolean;
    error?: string;
  }>;
}

export function UserProfileDisplay({
  profileData,
  leaderClubsData = null,
  currentUser,
  followUserAction,
}: UserProfileDisplayProps) {
  // Extract data from props
  const { profileUser, isFollowing } = profileData;

  // Optimistic state for instant UI updates
  const [optimisticProfile, addOptimisticUpdate] = useOptimistic(
    { isFollowing, followerCount: profileUser.followersCount },
    (state, newFollowState: boolean) => ({
      isFollowing: newFollowState,
      followerCount: state.followerCount + (newFollowState ? 1 : -1),
    })
  );

  const [, startTransition] = useTransition();

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
          <ProfileHeader
            profileData={profileData}
            leaderClubsData={leaderClubsData}
            currentUser={currentUser}
            optimisticProfile={optimisticProfile}
            onFollowToggle={handleFollowToggle}
            sendClubInvitationAction={sendClubInvitationAction}
          />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="flex flex-col gap-4">
              {/* Stats Grid - Mobile: 2x2, Desktop: 1x4 */}
              <ProfileStats
                profileData={profileData}
                optimisticProfile={optimisticProfile}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cars Grid */}
      <ProfileCarsGrid profileData={profileData} currentUser={currentUser} />
    </div>
  );
}
