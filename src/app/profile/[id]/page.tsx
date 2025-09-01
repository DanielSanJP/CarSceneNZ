"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Navigation } from "@/components/nav";
import { useAuth } from "@/lib/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { getUserFollowers, getUserFollowing, getUserById } from "@/data";
import {
  Calendar,
  Mail,
  User as UserIcon,
  Car,
  Star,
  Eye,
  Settings,
  ExternalLink,
  Users,
  UserPlus,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import type { User } from "@/types/user";
import type { Car as CarType } from "@/types/car";

export default function UserProfilePage() {
  const { user: currentUser } = useAuth();
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [userCars, setUserCars] = useState<CarType[]>([]);
  const [followers, setFollowers] = useState<User[]>([]);
  const [following, setFollowing] = useState<User[]>([]);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const [followersDialogOpen, setFollowersDialogOpen] = useState(false);
  const [followingDialogOpen, setFollowingDialogOpen] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Get user profile
        const user = await getUserById(userId);
        if (!user) {
          return;
        }
        setProfileUser(user);

        // Get user's cars (you'll need to import getCarsByOwner from cars.ts)
        // For now, we'll leave this empty
        setUserCars([]);

        // Get followers and following
        const [followersData, followingData] = await Promise.all([
          getUserFollowers(user.id),
          getUserFollowing(user.id),
        ]);

        setFollowers(followersData);
        setFollowing(followingData);
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    if (userId) {
      fetchUserData();
    }
  }, [userId]);

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

  if (!profileUser) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
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
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="space-y-6">
            {/* Profile Info */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <UserIcon className="h-5 w-5" />
                    Profile Information
                  </CardTitle>
                  {isOwnProfile && (
                    <Button variant="outline" size="sm">
                      <Settings className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage
                      src={profileUser.profile_image_url}
                      alt={profileUser.display_name}
                    />
                    <AvatarFallback className="text-lg">
                      {profileUser.display_name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="text-xl font-semibold">
                      {profileUser.display_name}
                    </h2>
                    <p className="text-muted-foreground">
                      @{profileUser.username}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center space-x-3">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        Joined{" "}
                        {new Date(profileUser.created_at).toLocaleDateString(
                          "en-NZ",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }
                        )}
                      </span>
                    </div>
                    <div className="flex items-center space-x-6">
                      <Dialog
                        open={followersDialogOpen}
                        onOpenChange={setFollowersDialogOpen}
                      >
                        <DialogTrigger asChild>
                          <button className="flex items-center space-x-2 hover:bg-muted/50 px-2 py-1 rounded-md transition-colors">
                            <Users className="h-4 w-4 text-blue-500" />
                            <span className="text-sm">Followers</span>
                            <Badge variant="secondary">
                              {followers.length}
                            </Badge>
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
                                  href={`/profile/${follower.id}`}
                                  onClick={() => setFollowersDialogOpen(false)}
                                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                                >
                                  <Avatar className="h-10 w-10">
                                    <AvatarImage
                                      src={follower.profile_image_url}
                                      alt={follower.display_name}
                                    />
                                    <AvatarFallback>
                                      {follower.display_name
                                        .split(" ")
                                        .map((n: string) => n[0])
                                        .join("")}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1">
                                    <p className="font-medium">
                                      {follower.display_name}
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

                      <Dialog
                        open={followingDialogOpen}
                        onOpenChange={setFollowingDialogOpen}
                      >
                        <DialogTrigger asChild>
                          <button className="flex items-center space-x-2 hover:bg-muted/50 px-2 py-1 rounded-md transition-colors">
                            <UserPlus className="h-4 w-4 text-green-500" />
                            <span className="text-sm">Following</span>
                            <Badge variant="secondary">
                              {following.length}
                            </Badge>
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
                                  href={`/profile/${followedUser.id}`}
                                  onClick={() => setFollowingDialogOpen(false)}
                                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                                >
                                  <Avatar className="h-10 w-10">
                                    <AvatarImage
                                      src={followedUser.profile_image_url}
                                      alt={followedUser.display_name}
                                    />
                                    <AvatarFallback>
                                      {followedUser.display_name
                                        .split(" ")
                                        .map((n: string) => n[0])
                                        .join("")}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1">
                                    <p className="font-medium">
                                      {followedUser.display_name}
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

                      <div className="flex items-center space-x-2">
                        <Car className="h-4 w-4 text-primary" />
                        <span className="text-sm">Public Cars</span>
                        <Badge variant="secondary">{userCars.length}</Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        <span className="text-sm">Total Likes</span>
                        <Badge variant="secondary">
                          {userCars.reduce(
                            (sum, car) => sum + car.total_likes,
                            0
                          )}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  {isOwnProfile && (
                    <div className="flex items-center space-x-3">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{profileUser.email}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Cars Grid */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Car className="h-5 w-5" />
                    {isOwnProfile
                      ? "My Cars"
                      : `${profileUser.display_name}'s Garage`}
                  </CardTitle>
                  {isOwnProfile && (
                    <Link href="/garage">
                      <Button variant="outline" size="sm">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Go to Garage
                      </Button>
                    </Link>
                  )}
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
                                onError={() => handleImageError(car.id)}
                              />
                            )}
                          </div>

                          <CardContent className="p-4 py-0">
                            <h3 className="font-semibold mb-2">
                              {car.year} {car.brand} {car.model}
                            </h3>
                            <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
                              <span className="capitalize">
                                {car.suspension_type}
                              </span>
                              <span className="flex items-center gap-1">
                                <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                                {car.total_likes}
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
