"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Navigation } from "@/components/nav";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { users, cars } from "@/data";
import {
  Calendar,
  Mail,
  User as UserIcon,
  Car,
  Heart,
  Eye,
  Settings,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface User {
  id: string;
  username: string;
  display_name: string;
  email: string;
  profile_image_url: string;
  created_at: string;
  updated_at: string;
}

interface Car {
  id: string;
  owner_id: string;
  brand: string;
  model: string;
  year: number;
  is_main_car: boolean;
  is_public: boolean;
  suspension_type: string;
  wheel_specs?: {
    front?: {
      brand: string;
      size: string;
      offset: string;
    };
    rear?: {
      brand: string;
      size: string;
      offset: string;
    };
  };
  tire_specs?: {
    front?: string;
    rear?: string;
  };
  images: string[];
  total_likes: number;
  created_at: string;
}

export default function UserProfilePage() {
  const { user: currentUser } = useAuth();
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  // Find the user by ID or username
  const profileUser = (users as User[]).find(
    (u) => u.id === userId || u.username === userId
  );

  // Get user's public cars
  const userCars = (cars as Car[]).filter(
    (car) => car.owner_id === profileUser?.id && car.is_public
  );

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
                      <div className="flex items-center space-x-2">
                        <Car className="h-4 w-4 text-primary" />
                        <span className="text-sm">Public Cars</span>
                        <Badge variant="secondary">{userCars.length}</Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Heart className="h-4 w-4 text-red-500" />
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
                      <Card
                        key={car.id}
                        className="overflow-hidden hover:shadow-md transition-shadow pt-0"
                      >
                        {/* Car Image */}
                        <div className="relative aspect-square overflow-hidden">
                          {failedImages.has(car.id) || !car.images[0] ? (
                            <div className="aspect-square bg-muted flex items-center justify-center">
                              <Car className="h-12 w-12 text-muted-foreground" />
                            </div>
                          ) : (
                            <Image
                              src={car.images[0]}
                              alt={`${car.brand} ${car.model}`}
                              fill
                              className="object-cover transition-transform hover:scale-105"
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                              onError={() => handleImageError(car.id)}
                            />
                          )}
                          {car.is_main_car && (
                            <Badge className="absolute top-2 left-2">
                              Main Car
                            </Badge>
                          )}
                        </div>

                        <CardContent className="p-4">
                          <h3 className="font-semibold mb-2">
                            {car.year} {car.brand} {car.model}
                          </h3>
                          <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
                            <span className="capitalize">
                              {car.suspension_type}
                            </span>
                            <span className="flex items-center gap-1">
                              <Heart className="h-3 w-3" />
                              {car.total_likes}
                            </span>
                          </div>

                          <Link href={`/garage/${car.id}`}>
                            <Button size="sm" className="w-full">
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </Button>
                          </Link>
                        </CardContent>
                      </Card>
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
