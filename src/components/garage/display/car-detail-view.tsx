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
import type { User } from "@/types/user";
import type { CarDetailData } from "@/types/car";
import { getEngineData } from "@/lib/utils/car-helpers";

interface CarDetailViewProps {
  user?: User | null;
  carDetailData: CarDetailData | null;
  likeCarAction?: (carId: string) => Promise<{
    success: boolean;
    error?: string;
    newLikeCount?: number;
    isLiked?: boolean;
    action?: string;
  }>;
}

export const CarDetailView = React.memo(function CarDetailView({
  user,
  carDetailData,
  likeCarAction,
}: CarDetailViewProps) {
  const router = useRouter();
  const [likeCount, setLikeCount] = useState(0);

  // Memoize car formatted data to prevent unnecessary recalculations
  const carFormatted = useMemo(() => {
    if (!carDetailData) return null;

    const { car, engine, wheels, suspension, brakes, exterior, interior } =
      carDetailData;

    // Convert API array formats to Car type object formats
    const convertedBrakes = brakes?.length
      ? {
          front: brakes.find((b) => b.position === "front")
            ? {
                caliper: brakes.find((b) => b.position === "front")
                  ?.caliper_brand,
                pads: brakes.find((b) => b.position === "front")?.pad_brand,
                disc_size: brakes.find((b) => b.position === "front")
                  ?.rotor_size,
                disc_type: brakes.find((b) => b.position === "front")
                  ?.rotor_model,
              }
            : undefined,
          rear: brakes.find((b) => b.position === "rear")
            ? {
                caliper: brakes.find((b) => b.position === "rear")
                  ?.caliper_brand,
                pads: brakes.find((b) => b.position === "rear")?.pad_brand,
                disc_size: brakes.find((b) => b.position === "rear")
                  ?.rotor_size,
                disc_type: brakes.find((b) => b.position === "rear")
                  ?.rotor_model,
              }
            : undefined,
        }
      : undefined;

    const convertedSuspension = suspension?.length
      ? {
          front: suspension.find((s) => s.position === "front")
            ? {
                suspension: suspension.find((s) => s.position === "front")
                  ?.brand,
                spring_rate: suspension.find((s) => s.position === "front")
                  ?.spring_rate,
                strut_brace: suspension.find((s) => s.position === "front")
                  ?.strut_brace,
                anti_roll_bar: suspension.find((s) => s.position === "front")
                  ?.anti_roll_bar,
              }
            : undefined,
          rear: suspension.find((s) => s.position === "rear")
            ? {
                suspension: suspension.find((s) => s.position === "rear")
                  ?.brand,
                spring_rate: suspension.find((s) => s.position === "rear")
                  ?.spring_rate,
                strut_brace: suspension.find((s) => s.position === "rear")
                  ?.strut_brace,
                anti_roll_bar: suspension.find((s) => s.position === "rear")
                  ?.anti_roll_bar,
              }
            : undefined,
        }
      : undefined;

    const convertedWheels = wheels?.length
      ? {
          front: wheels.find((w) => w.position === "front")
            ? {
                wheel: wheels.find((w) => w.position === "front")?.brand,
                wheel_size: wheels.find((w) => w.position === "front")?.size,
                wheel_offset: wheels
                  .find((w) => w.position === "front")
                  ?.offset?.toString(),
                tyre: wheels.find((w) => w.position === "front")?.tire_brand,
                tyre_size: wheels.find((w) => w.position === "front")
                  ?.tire_size,
              }
            : undefined,
          rear: wheels.find((w) => w.position === "rear")
            ? {
                wheel: wheels.find((w) => w.position === "rear")?.brand,
                wheel_size: wheels.find((w) => w.position === "rear")?.size,
                wheel_offset: wheels
                  .find((w) => w.position === "rear")
                  ?.offset?.toString(),
                tyre: wheels.find((w) => w.position === "rear")?.tire_brand,
                tyre_size: wheels.find((w) => w.position === "rear")?.tire_size,
              }
            : undefined,
        }
      : undefined;

    return {
      ...car,
      // Flatten engine data
      ...engine,
      // Flatten exterior data
      ...exterior,
      // Flatten interior data
      ...interior,
      // Convert structured data to Car type format
      brakes: convertedBrakes,
      suspension: convertedSuspension,
      wheels: convertedWheels,
    };
  }, [carDetailData]);

  // Memoize the engine data to avoid recalculation on each render
  const engineData = useMemo(() => {
    if (!carFormatted) return null;
    return getEngineData(carFormatted);
  }, [carFormatted]);

  // Update like count when data loads
  React.useEffect(() => {
    if (carDetailData?.car?.total_likes !== undefined) {
      setLikeCount(carDetailData.car.total_likes);
    }
  }, [carDetailData?.car?.total_likes]);

  // Handle error or missing data - simple error fallback
  if (!carDetailData || !carFormatted || !engineData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">
            Failed to load car details
          </h2>
          <p className="text-muted-foreground mb-6">
            There was an error loading the car information.
          </p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </div>
    );
  }

  const { car } = carDetailData;

  // Check if user owns this car
  const isOwner = user && car.owner_id === user.id;
  const owner = car.owner;

  const handleBackClick = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push("/garage");
    }
  };

  // Optimized like/unlike handlers using server action
  const handleLike = async (carId: string) => {
    if (!likeCarAction) {
      return { success: false, error: "Like action not available" };
    }

    try {
      const result = await likeCarAction(carId);
      if (result.success && result.newLikeCount !== undefined) {
        setLikeCount(result.newLikeCount);
      }
      return result;
    } catch (error) {
      console.error("Failed to like car:", error);
      return { success: false, error: "Failed to like car" };
    }
  };

  const handleUnlike = async (carId: string) => {
    if (!likeCarAction) {
      return { success: false, error: "Unlike action not available" };
    }

    try {
      const result = await likeCarAction(carId);
      if (result.success && result.newLikeCount !== undefined) {
        setLikeCount(result.newLikeCount);
      }
      return result;
    } catch (error) {
      console.error("Failed to unlike car:", error);
      return { success: false, error: "Failed to unlike car" };
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
                onLike={handleLike}
                onUnlike={handleUnlike}
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
              <CarImageGallery car={carFormatted} />

              {/* Owner Details */}
              {owner && <OwnerDetails owner={owner} />}
            </div>

            {/* Car Details */}
            <div className="space-y-6">
              {/* Basic Info */}
              <BasicCarInfo car={carFormatted} />

              {/* Engine Details */}
              <EngineDetails engine={engineData} />

              {/* Engine Modifications */}
              <EngineModifications car={carFormatted} />

              {/* Wheels & Tires */}
              <WheelsTires car={carFormatted} />

              {/* Suspension */}
              <SuspensionDetails car={carFormatted} />

              {/* Brakes */}
              <BrakingSystem car={carFormatted} />

              {/* Exterior Modifications */}
              <ExteriorModifications car={carFormatted} />

              {/* Interior Modifications */}
              <InteriorModifications car={carFormatted} />

              {/* Like Section */}
              <CarStats car={carFormatted} likeCount={likeCount} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
