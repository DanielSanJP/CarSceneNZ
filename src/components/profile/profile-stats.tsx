"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Car, Star, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import Link from "next/link";
import type { ProfileData } from "@/types/user";
import {
  getFollowersData,
  getFollowingData,
} from "@/lib/actions/profile-actions";

// Simple interface for follower/following data from lazy loading
interface FollowUserData {
  id: string;
  username: string;
  profile_image_url?: string;
  display_name?: string;
}

interface ProfileStatsProps {
  profileData: ProfileData;
  optimisticProfile: {
    isFollowing: boolean;
    followerCount: number;
  };
}

export function ProfileStats({
  profileData,
  optimisticProfile,
}: ProfileStatsProps) {
  const [followersDialogOpen, setFollowersDialogOpen] = useState(false);
  const [followingDialogOpen, setFollowingDialogOpen] = useState(false);
  const [followers, setFollowers] = useState<FollowUserData[]>([]);
  const [following, setFollowing] = useState<FollowUserData[]>([]);
  const [followersLoading, setFollowersLoading] = useState(false);
  const [followingLoading, setFollowingLoading] = useState(false);

  const { profileUser, userCars } = profileData;

  // Lazy loading handlers for followers/following dialogs
  const handleFollowersDialogOpen = async () => {
    if (followers.length === 0 && profileUser.followersCount > 0) {
      setFollowersLoading(true);
      try {
        const data = await getFollowersData(profileUser.id);
        setFollowers(data as unknown as FollowUserData[]);
      } catch (error) {
        console.error("Error loading followers:", error);
        toast.error("Failed to load followers");
      } finally {
        setFollowersLoading(false);
      }
    }
    setFollowersDialogOpen(true);
  };

  const handleFollowingDialogOpen = async () => {
    console.log("🚀 handleFollowingDialogOpen triggered");
    console.log("📊 Current state:", {
      followingLength: following.length,
      followingCount: profileUser.followingCount,
      shouldFetch: following.length === 0 && profileUser.followingCount > 0,
    });

    if (following.length === 0 && profileUser.followingCount > 0) {
      console.log("🔄 Starting to fetch following data...");
      setFollowingLoading(true);
      try {
        const data = await getFollowingData(profileUser.id);
        console.log("✅ Following data received:", data);
        setFollowing(data as unknown as FollowUserData[]);
      } catch (error) {
        console.error("❌ Error loading following:", error);
        toast.error("Failed to load following");
      } finally {
        setFollowingLoading(false);
      }
    } else {
      console.log("⚡ Using cached data or no data to fetch");
    }
    setFollowingDialogOpen(true);
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
      {/* Following Dialog */}
      <Dialog open={followingDialogOpen} onOpenChange={setFollowingDialogOpen}>
        <DialogTrigger asChild>
          <button
            className="flex items-center space-x-2 hover:underline cursor-pointer justify-start"
            onClick={handleFollowingDialogOpen}
          >
            <span className="text-sm">Following</span>
            <span className="font-semibold text-sm">
              {profileUser.followingCount}
            </span>
          </button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Following ({profileUser.followingCount})</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {followingLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-muted-foreground">Loading following...</p>
              </div>
            ) : profileUser.followingCount === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Not following anyone yet
              </p>
            ) : (
              following.map((followedUser) => {
                console.log("🎯 Rendering following user:", followedUser);
                return (
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
                            followedUser.username.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">
                        {followedUser.display_name || followedUser.username}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        @{followedUser.username}
                      </p>
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  </Link>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Followers Dialog */}
      <Dialog open={followersDialogOpen} onOpenChange={setFollowersDialogOpen}>
        <DialogTrigger asChild>
          <button
            className="flex items-center space-x-2 hover:underline cursor-pointer justify-start"
            onClick={handleFollowersDialogOpen}
          >
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
            {followersLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-muted-foreground">Loading followers...</p>
              </div>
            ) : profileUser.followersCount === 0 ? (
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
                        {follower.display_name?.slice(0, 2).toUpperCase() ||
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

      {/* Cars Count */}
      <div className="flex items-center space-x-2">
        <Car className="h-4 w-4 text-primary" />
        <span className="text-sm">Cars</span>
        <span className="font-semibold text-sm">{userCars.length}</span>
      </div>

      {/* Likes Count */}
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
  );
}
