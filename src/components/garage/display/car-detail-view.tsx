"use client";

import { Button } from "@/components/ui/button";
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
}

export function CarDetailView({ car, user }: CarDetailViewProps) {
  const router = useRouter();

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

            {isOwner && (
              <Link href={`/garage/edit/${car.id}`}>
                <Button className="md:px-4">
                  <Edit3 className="h-4 w-4 md:mr-2" />
                  <span className="hidden md:inline">Edit Car</span>
                </Button>
              </Link>
            )}
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
              <EngineDetails engine={getEngineData(car)} />

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
              <CarStats car={car} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
