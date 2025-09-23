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
import type { Car, CarDetailData } from "@/types/car";
import { getEngineData } from "@/lib/utils/car-helpers";

interface CarDetailViewProps {
  user?: User | null;
  carDetailData: CarDetailData | null;
  likeCarAction?: (carId: string) => Promise<{
    success: boolean;
    error?: string;
    likeCount?: number;
    isLiked?: boolean;
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
    if (!carDetailData || !carDetailData.car) return null;

    const {
      car,
      engine,
      wheels,
      suspension,
      brakes,
      exterior,
      interior,
      gauges,
    } = carDetailData;

    // DEBUG: Log the actual structure to understand what we're getting
    console.log("🔍 CarDetailData Structure:", {
      brakes: brakes,
      suspension: suspension,
      wheels: wheels,
      gauges: gauges,
      brakesType: Array.isArray(brakes) ? "array" : typeof brakes,
      suspensionType: Array.isArray(suspension) ? "array" : typeof suspension,
      wheelsType: Array.isArray(wheels) ? "array" : typeof wheels,
      gaugesType: Array.isArray(gauges) ? "array" : typeof gauges,
    });

    // Check if the data is already in JSONB format (direct from database)
    // vs array format (from RPC conversion)
    const brakesIsJsonb =
      brakes && !Array.isArray(brakes) && typeof brakes === "object";
    const suspensionIsJsonb =
      suspension &&
      !Array.isArray(suspension) &&
      typeof suspension === "object";
    const wheelsIsJsonb =
      wheels && !Array.isArray(wheels) && typeof wheels === "object";

    // If data is already JSONB format, use it directly
    if (brakesIsJsonb && suspensionIsJsonb && wheelsIsJsonb) {
      console.log("✅ Using direct JSONB format");
      return {
        ...car,
        ...engine,
        ...exterior,
        ...interior,
        brakes: brakes as Car["brakes"],
        suspension: suspension as Car["suspension"],
        wheels: wheels as Car["wheels"],
        gauges: gauges as Car["gauges"],
      };
    }

    console.log("🔄 Converting from array format");
    // Note: This code path is mostly for fallback compatibility
    // The main path now uses JSONB data directly above

    return {
      ...car,
      // Flatten engine data
      ...engine,
      // Flatten exterior data
      ...exterior,
      // Flatten interior data
      ...interior,
      // Use JSONB data directly - suspension works, others need RPC fix
      brakes:
        brakes && !Array.isArray(brakes)
          ? (brakes as Car["brakes"])
          : undefined,
      suspension:
        suspension && !Array.isArray(suspension)
          ? (suspension as Car["suspension"])
          : undefined,
      wheels:
        wheels && !Array.isArray(wheels)
          ? (wheels as Car["wheels"])
          : undefined,
      gauges:
        Array.isArray(gauges) && gauges.length > 0
          ? (gauges as Car["gauges"])
          : undefined,
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
      <div className="flex items-center justify-center min-h-[400px]">
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

  // Optimized like/unlike handlers using Server Actions
  const handleLike = async (carId: string) => {
    try {
      if (!likeCarAction) {
        console.error("likeCarAction not provided");
        return { success: false, error: "Like action not available" };
      }

      const result = await likeCarAction(carId);
      if (result.success && result.likeCount !== undefined) {
        setLikeCount(result.likeCount);
      }
      return result;
    } catch (error) {
      console.error("Failed to like car:", error);
      return { success: false, error: "Failed to like car" };
    }
  };

  const handleUnlike = async (carId: string) => {
    try {
      if (!likeCarAction) {
        console.error("likeCarAction not provided");
        return { success: false, error: "Unlike action not available" };
      }

      const result = await likeCarAction(carId);
      if (result.success && result.likeCount !== undefined) {
        setLikeCount(result.likeCount);
      }
      return result;
    } catch (error) {
      console.error("Failed to unlike car:", error);
      return { success: false, error: "Failed to unlike car" };
    }
  };

  return (
    <div>
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
        <div className="space-y-4 w-full">
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
  );
});
