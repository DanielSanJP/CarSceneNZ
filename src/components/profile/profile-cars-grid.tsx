"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Car, Star, Eye, ExternalLink } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { ProfileData, User } from "@/types/user";

interface ProfileCarsGridProps {
  profileData: ProfileData;
  currentUser?: User | null;
}

export function ProfileCarsGrid({
  profileData,
  currentUser,
}: ProfileCarsGridProps) {
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const router = useRouter();

  const { profileUser, userCars } = profileData;
  const isOwnProfile = currentUser?.id === profileUser.id;

  const handleImageError = (carId: string) => {
    setFailedImages((prev) => new Set(prev).add(carId));
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <CardTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            {isOwnProfile
              ? "My Cars"
              : `${profileUser.display_name || profileUser.username}'s Garage`}
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
                        router.push(`/garage/${car.id}`);
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
  );
}
