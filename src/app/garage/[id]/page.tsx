"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Navigation } from "@/components/nav";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cars } from "@/data";
import { ArrowLeft, Edit3, Heart, Eye, Car as CarIcon } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

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

export default function CarDetailPage() {
  const { user, isAuthenticated } = useAuth();
  const params = useParams();
  const carId = params.id as string;
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const car = (cars as Car[]).find((c) => c.id === carId);

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Access Denied</h1>
            <p className="text-muted-foreground mt-2">
              Please log in to view car details.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!car) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Car Not Found</h1>
            <p className="text-muted-foreground mt-2">
              The car you&apos;re looking for doesn&apos;t exist.
            </p>
            <Link href="/garage" className="mt-4 inline-block">
              <Button>Back to Garage</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Check if user owns this car
  const isOwner = car.owner_id === user.id;

  if (!isOwner && !car.is_public) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Private Car</h1>
            <p className="text-muted-foreground mt-2">
              This car is set to private and you don&apos;t have permission to
              view it.
            </p>
            <Link href="/garage" className="mt-4 inline-block">
              <Button>Back to Garage</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleImageError = (imageIndex: number) => {
    setFailedImages((prev) => new Set(prev).add(`${carId}-${imageIndex}`));
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Link href="/garage">
                <Button variant="outline" size="icon">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold">
                  {car.year} {car.brand} {car.model}
                </h1>
                <div className="flex items-center gap-2 mt-2">
                  {car.is_main_car && <Badge>Main Car</Badge>}
                  <Badge variant={car.is_public ? "default" : "secondary"}>
                    {car.is_public ? "Public" : "Private"}
                  </Badge>
                  <Badge variant="outline" className="capitalize">
                    {car.suspension_type}
                  </Badge>
                </div>
              </div>
            </div>

            {isOwner && (
              <Link href={`/garage/edit/${car.id}`}>
                <Button>
                  <Edit3 className="h-4 w-4 mr-2" />
                  Edit Car
                </Button>
              </Link>
            )}
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            {/* Images */}
            <div className="space-y-4">
              <Card>
                <CardContent className="p-0">
                  <div className="relative aspect-square overflow-hidden rounded-lg">
                    {failedImages.has(`${carId}-${currentImageIndex}`) ||
                    !car.images[currentImageIndex] ? (
                      <div className="aspect-square bg-muted flex items-center justify-center">
                        <CarIcon className="h-16 w-16 text-muted-foreground" />
                      </div>
                    ) : (
                      <Image
                        src={car.images[currentImageIndex]}
                        alt={`${car.brand} ${car.model} - Image ${
                          currentImageIndex + 1
                        }`}
                        fill
                        quality={100}
                        className="object-cover"
                        sizes="(max-width: 1024px) 100vw, 50vw"
                        onError={() => handleImageError(currentImageIndex)}
                      />
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Image thumbnails */}
              {car.images.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {car.images.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`relative aspect-square overflow-hidden rounded border-2 transition-colors ${
                        currentImageIndex === index
                          ? "border-primary"
                          : "border-transparent hover:border-muted-foreground"
                      }`}
                    >
                      {failedImages.has(`${carId}-${index}`) ||
                      !car.images[index] ? (
                        <div className="aspect-square bg-muted flex items-center justify-center">
                          <CarIcon className="h-4 w-4 text-muted-foreground" />
                        </div>
                      ) : (
                        <Image
                          src={car.images[index]}
                          alt={`Thumbnail ${index + 1}`}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 25vw, 12.5vw"
                          onError={() => handleImageError(index)}
                        />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Car Details */}
            <div className="space-y-6">
              {/* Basic Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CarIcon className="h-5 w-5" />
                    Car Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Brand</p>
                      <p className="font-medium">{car.brand}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Model</p>
                      <p className="font-medium">{car.model}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Year</p>
                      <p className="font-medium">{car.year}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Suspension</p>
                      <p className="font-medium capitalize">
                        {car.suspension_type}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Wheel Specs */}
              {car.wheel_specs &&
                (car.wheel_specs.front || car.wheel_specs.rear) && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Wheel Specifications</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {car.wheel_specs.front && (
                        <div>
                          <h4 className="font-medium mb-2">Front Wheels</h4>
                          <div className="grid grid-cols-3 gap-2 text-sm">
                            <div>
                              <p className="text-muted-foreground">Brand</p>
                              <p>{car.wheel_specs.front.brand}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Size</p>
                              <p>{car.wheel_specs.front.size}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Offset</p>
                              <p>{car.wheel_specs.front.offset}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {car.wheel_specs.rear && (
                        <div>
                          <h4 className="font-medium mb-2">Rear Wheels</h4>
                          <div className="grid grid-cols-3 gap-2 text-sm">
                            <div>
                              <p className="text-muted-foreground">Brand</p>
                              <p>{car.wheel_specs.rear.brand}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Size</p>
                              <p>{car.wheel_specs.rear.size}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Offset</p>
                              <p>{car.wheel_specs.rear.offset}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

              {/* Tire Specs */}
              {car.tire_specs &&
                (car.tire_specs.front || car.tire_specs.rear) && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Tire Specifications</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        {car.tire_specs.front && (
                          <div>
                            <p className="text-muted-foreground">Front Tires</p>
                            <p className="font-medium">
                              {car.tire_specs.front}
                            </p>
                          </div>
                        )}
                        {car.tire_specs.rear && (
                          <div>
                            <p className="text-muted-foreground">Rear Tires</p>
                            <p className="font-medium">{car.tire_specs.rear}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

              {/* Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Heart className="h-4 w-4 text-red-500" />
                      <span>{car.total_likes} likes</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-blue-500" />
                      <span>0 views</span>
                    </div>
                  </div>
                  <div className="mt-4 text-xs text-muted-foreground">
                    Added{" "}
                    {new Date(car.created_at).toLocaleDateString("en-NZ", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
