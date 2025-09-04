"use client";

import { useState } from "react";
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
import { Car, Star, Eye, ExternalLink, Edit } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import type { User } from "@/types/user";
import type { Car as CarType } from "@/types/car";

interface UserProfileClientProps {
  profileUser: User | null;
  currentUser: User | null;
  userCars: CarType[];
  followers: User[];
  following: User[];
}

export function UserProfileClient({
  profileUser,
  currentUser,
  userCars,
  followers,
  following,
}: UserProfileClientProps) {
  const router = useRouter();
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const [followersDialogOpen, setFollowersDialogOpen] = useState(false);
  const [followingDialogOpen, setFollowingDialogOpen] = useState(false);

  const handleBackClick = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push("/search");
    }
  };

  const handleImageError = (carId: string) => {
    setFailedImages((prev) => new Set(prev).add(carId));
  };

  // User not found
  if (!profileUser) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold">User Not Found</h1>
            <p className="text-muted-foreground mt-2">
              The user you&apos;re looking for doesn&apos;t exist.
            </p>
            <Button onClick={handleBackClick} className="mt-4">
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Check if viewing own profile
  const isOwnProfile = currentUser?.id === profileUser.id;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="space-y-6">
            {/* Profile Info */}
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center space-x-4">
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
                          {profileUser.display_name
                            ?.slice(0, 2)
                            .toUpperCase() ||
                            profileUser.username.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
                        <div>
                          <h2 className="text-xl font-semibold">
                            {profileUser.display_name || profileUser.username}
                          </h2>
                          <p className="text-muted-foreground">
                            @{profileUser.username}
                          </p>
                        </div>
                        {isOwnProfile && (
                          <Link href="/profile/edit">
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-fit"
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Profile
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
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
                            <DialogTitle>
                              Following ({following.length})
                            </DialogTitle>
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
                            <DialogTitle>
                              {profileUser.display_name}&apos;s Followers (
                              {followers.length})
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
                                          follower.username
                                            .slice(0, 2)
                                            .toUpperCase()}
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex-1">
                                    <p className="font-medium">
                                      {follower.display_name ||
                                        follower.username}
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
                        <span className="text-sm">Total Likes</span>
                        <span className="font-semibold text-sm">
                          {userCars.reduce(
                            (sum, car) => sum + (car.total_likes || 0),
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
                      : `${profileUser.display_name}'s Garage`}
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
                        : `${profileUser.display_name} hasn't shared any cars publicly yet`}
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
                            {failedImages.has(car.id) ||
                            !car.images ||
                            !car.images[0] ? (
                              <div className="aspect-square bg-muted flex items-center justify-center">
                                <Car className="h-12 w-12 text-muted-foreground" />
                              </div>
                            ) : (
                              <Image
                                src={car.images[0]}
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
        </div>
      </div>
    </div>
  );
}
