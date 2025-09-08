"use client";

import { useState, useMemo } from "react";
import React from "react";
import { Button } from "@/components/ui/button";
import { LikeButton } from "@/components/ui/like-button";
import { ArrowLeft, Edit3 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CarImageGallery,
  OwnerDetails,
  BasicCarInfo,
  EngineDetails,
  EngineModifications,
  WheelsTires,
  SuspensionDetails,
  BrakingSystem,
  ExteriorModifications,
  InteriorModifications,
  CarStats,
} from "./car-detail-cards";
import type { Car } from "@/types/car";
import { getEngineData } from "@/lib/utils/car-helpers";

interface CarDetailViewProps {
  car: Car;
  user?: {
    id: string;
    username: string;
    display_name?: string;
  } | null;
  onLike?: (
    carId: string,
    userId: string
  ) => Promise<{ success: boolean; newLikeCount?: number; error?: string }>;
  onUnlike?: (
    carId: string,
    userId: string
  ) => Promise<{ success: boolean; newLikeCount?: number; error?: string }>;
}

export const CarDetailView = React.memo(function CarDetailView({
  car,
  user,
  onLike,
  onUnlike,
}: CarDetailViewProps) {
  const router = useRouter();
  const [likeCount, setLikeCount] = useState(car.total_likes);

  // Check if user owns this car
  const isOwner = user && car.owner_id === user.id;
  const owner = car.owner;

  // Memoize the engine data to avoid recalculation on each render
  const engineData = useMemo(() => getEngineData(car), [car]);

  const handleBackClick = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push("/garage");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="icon" onClick={handleBackClick}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">
                  {car.year} {car.brand} {car.model}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <LikeButton
                carId={car.id}
                initialIsLiked={car.is_liked || false}
                size="default"
                user={user}
                onLike={onLike}
                onUnlike={onUnlike}
                onLikeCountChange={setLikeCount}
              />
              {isOwner && (
                <Link href={`/garage/edit/${car.id}`}>
                  <Button className="md:px-4">
                    <Edit3 className="h-4 w-4 md:mr-2" />
                    <span className="hidden md:inline">Edit Car</span>
                  </Button>
                </Link>
              )}
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            {/* Images */}
            <div className="space-y-4">
              <CarImageGallery car={car} />

              {/* Owner Details */}
              {owner && <OwnerDetails owner={owner} />}
            </div>

            {/* Car Details */}
            <div className="space-y-6">
              {/* Basic Info */}
              <BasicCarInfo car={car} />

              {/* Engine Details */}
              <EngineDetails engine={engineData} />

              {/* Engine Modifications */}
              <EngineModifications car={car} />

              {/* Wheels & Tires */}
              <WheelsTires car={car} />

              {/* Suspension */}
              <SuspensionDetails car={car} />

              {/* Brakes */}
              <BrakingSystem car={car} />

              {/* Exterior Modifications */}
              <ExteriorModifications car={car} />

              {/* Interior Modifications */}
              <InteriorModifications car={car} />

              {/* Like Section */}
              <CarStats car={car} likeCount={likeCount} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
