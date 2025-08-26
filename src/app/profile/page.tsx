"use client";

import { useState } from "react";
import { Navigation } from "@/components/nav";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cars } from "@/data";
import { Calendar, Edit, Car, Star, Eye, ExternalLink } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface Car {
  id: string;
  owner_id: string;
  brand: string;
  model: string;
  year: number;
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

export default function ProfilePage() {
  const { user, isAuthenticated } = useAuth();
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  // Get user's cars
  const userCars = user
    ? (cars as Car[]).filter((car) => car.owner_id === user.id)
    : [];

  const handleImageError = (carId: string) => {
    setFailedImages((prev) => new Set(prev).add(carId));
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Access Denied</h1>
            <p className="text-muted-foreground mt-2">
              Please log in to view this page.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
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
                        alt={user.display_name}
                      />
                      <AvatarFallback className="text-lg">
                        {user.display_name
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
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
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
                          (sum, car) => sum + car.total_likes,
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
                            {failedImages.has(car.id) || !car.images[0] ? (
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
