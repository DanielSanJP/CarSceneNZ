"use client";

import { useAuth } from "@/lib/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  getCarsByOwner,
  getUserFollowers,
  getUserFollowing,
  getUserById,
} from "@/lib/data";
import {
  Calendar,
  Edit,
  Car,
  Star,
  Eye,
  ExternalLink,
  Users,
  UserPlus,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import type { Car as CarType } from "@/types/car";
import type { User } from "@/types/user";
import { useEffect, useState } from "react";

export default function ProfilePage() {
  const { user: authUser, isAuthenticated, loading } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [userCars, setUserCars] = useState<CarType[]>([]);
  const [followers, setFollowers] = useState<User[]>([]);
  const [following, setFollowing] = useState<User[]>([]);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      redirect("/login");
      return;
    }

    if (!authUser) return;

    const fetchProfileData = async () => {
      try {
        // Get full user profile from database
        const profileUser = await getUserById(authUser.id);
        if (profileUser) {
          // Merge auth data with profile data
          const fullUser = {
            ...profileUser,
            email: authUser.email || profileUser.email,
            display_name:
              authUser.user_metadata?.display_name ||
              authUser.user_metadata?.full_name ||
              profileUser.username,
          };
          setUser(fullUser);
        } else {
          // Fallback to auth user data
          const fallbackUser = {
            id: authUser.id,
            username: authUser.email?.split("@")[0] || "user",
            display_name:
              authUser.user_metadata?.display_name ||
              authUser.user_metadata?.full_name ||
              authUser.email?.split("@")[0] ||
              "User",
            email: authUser.email || "",
            profile_image_url: authUser.user_metadata?.avatar_url,
            created_at: authUser.created_at || new Date().toISOString(),
            updated_at: authUser.updated_at || new Date().toISOString(),
          };
          setUser(fallbackUser);
        }

        // Fetch data with error handling
        const [carsResult, followersResult, followingResult] =
          await Promise.allSettled([
            getCarsByOwner(authUser.id),
            getUserFollowers(authUser.id),
            getUserFollowing(authUser.id),
          ]);

        setUserCars(carsResult.status === "fulfilled" ? carsResult.value : []);
        setFollowers(
          followersResult.status === "fulfilled" ? followersResult.value : []
        );
        setFollowing(
          followingResult.status === "fulfilled" ? followingResult.value : []
        );

        // Log errors
        if (carsResult.status === "rejected") {
          console.error("Error fetching user cars:", carsResult.reason);
        }
        if (followersResult.status === "rejected") {
          console.error("Error fetching followers:", followersResult.reason);
        }
        if (followingResult.status === "rejected") {
          console.error("Error fetching following:", followingResult.reason);
        }
      } catch (error) {
        console.error("Error fetching profile data:", error);
      } finally {
        setProfileLoading(false);
      }
    };

    fetchProfileData();
  }, [authUser, isAuthenticated, loading]);

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center">
              <p>Loading profile...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    redirect("/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Profile</h1>

          <div className="space-y-6">
            {/* Profile Info Card */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage
                        src={user.profile_image_url}
                        alt={user.username}
                        className="object-cover"
                      />
                      <AvatarFallback className="text-lg">
                        {user.username
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h2 className="text-xl font-semibold">
                        {user.display_name}
                      </h2>
                      <p className="text-muted-foreground">@{user.username}</p>
                    </div>
                  </div>
                  <Link href="/profile/edit">
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      Joined{" "}
                      {new Date(user.created_at).toLocaleDateString("en-NZ", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="flex items-center space-x-6">
                    <button className="flex items-center space-x-2 hover:bg-muted/50 px-2 py-1 rounded-md transition-colors">
                      <Users className="h-4 w-4 text-blue-500" />
                      <span className="text-sm">Followers</span>
                      <Badge variant="secondary">{followers.length}</Badge>
                    </button>

                    <button className="flex items-center space-x-2 hover:bg-muted/50 px-2 py-1 rounded-md transition-colors">
                      <UserPlus className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Following</span>
                      <Badge variant="secondary">{following.length}</Badge>
                    </button>

                    <div className="flex items-center space-x-2">
                      <Car className="h-4 w-4 text-primary" />
                      <span className="text-sm">Total Cars</span>
                      <Badge variant="secondary">{userCars.length}</Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      <span className="text-sm">Total Likes</span>
                      <Badge variant="secondary">
                        {userCars.reduce(
                          (sum, car) => sum + (car.total_likes || 0),
                          0
                        )}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cars Grid */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Car className="h-5 w-5" />
                    My Garage
                  </CardTitle>
                  <Link href="/garage">
                    <Button variant="outline" size="sm">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Go to Garage
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {userCars.length === 0 ? (
                  <div className="text-center py-12">
                    <Car className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">
                      No cars in your garage yet
                    </h3>
                    <p className="text-muted-foreground">
                      Add your first car to get started
                    </p>
                    <Link href="/garage/create" className="mt-4 inline-block">
                      <Button>Add Your First Car</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {userCars.map((car) => (
                      <Link href={`/garage/${car.id}`} key={car.id}>
                        <Card className="overflow-hidden pt-0">
                          {/* Car Image */}
                          <div className="relative aspect-square overflow-hidden">
                            {!car.images || !car.images[0] ? (
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
