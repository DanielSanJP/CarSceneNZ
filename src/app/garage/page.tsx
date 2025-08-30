"use client";

import { Navigation } from "@/components/nav";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cars } from "@/data";
import { Plus, Car, Edit3, Eye, Star } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

interface Car {
  id: string;
  owner_id: string;
  brand: string;
  model: string;
  year: number;
  suspension_type: string;
  wheel_specs?: {
    front?: {
      brand: string;
      size: string;
      offset: string;
      camber?: number;
    };
    rear?: {
      brand: string;
      size: string;
      offset: string;
      camber?: number;
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

export default function GaragePage() {
  const { user, isAuthenticated } = useAuth();
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Access Denied</h1>
            <p className="text-muted-foreground mt-2">
              Please log in to view your garage.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Get user's cars
  const userCars = (cars as Car[]).filter((car) => car.owner_id === user.id);

  const handleImageError = (carId: string) => {
    setFailedImages((prev) => new Set(prev).add(carId));
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold">My Garage</h1>
              <p className="text-muted-foreground mt-2">
                Manage your car collection and showcase your builds
              </p>
            </div>
            <Link href="/garage/create">
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Car
              </Button>
            </Link>
          </div>

          {/* Cars Grid */}
          {userCars.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Car className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  No cars in your garage yet
                </h3>
                <p className="text-muted-foreground mb-6">
                  Start building your collection by adding your first car
                </p>
                <Link href="/garage/create">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Car
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {userCars.map((car) => (
                <Link href={`/garage/${car.id}`} key={car.id} className="group">
                  <Card className="overflow-hidden pt-0 ">
                    {/* Car Image */}
                    <div className="relative aspect-square overflow-hidden">
                      {failedImages.has(car.id) || !car.images[0] ? (
                        <div className="aspect-square bg-muted flex items-center justify-center">
                          <Car className="h-16 w-16 text-muted-foreground" />
                        </div>
                      ) : (
                        <Image
                          src={car.images[0]}
                          alt={`${car.brand} ${car.model}`}
                          fill
                          quality={100}
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          onError={() => handleImageError(car.id)}
                        />
                      )}
                    </div>

                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">
                        {car.year} {car.brand} {car.model}
                      </CardTitle>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Star className="h-3 w-3" />
                          {car.total_likes}
                        </span>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {/* Action Buttons */}
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            window.location.href = `/garage/${car.id}`;
                          }}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            window.location.href = `/garage/edit/${car.id}`;
                          }}
                        >
                          <Edit3 className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
