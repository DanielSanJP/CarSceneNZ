"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getCarById, updateCarWithComponents } from "@/lib/data/cars";
import { ArrowLeft, Save, Trash2 } from "lucide-react";
import Link from "next/link";
import type { Car } from "@/types";

// Import all garage components
import {
  BasicCarInfo,
  CarImageManager,
  EngineDetails,
  WheelsAndTires,
  BrakingSystem,
  SuspensionDetails,
  ExteriorMods,
  InteriorMods,
  PerformanceMods,
} from "@/components/garage";

// Complete form data structure for all components
interface CompleteEditCarFormData {
  // Basic car info
  brand: string;
  model: string;
  year: number | "";
  images: string[];

  // Engine data
  engine?: {
    engine_code?: string;
    displacement?: string;
    aspiration?: string;
    power_hp?: number;
    torque_nm?: number;
  };

  // Engine modifications
  engine_modifications?: {
    component: string;
    subcomponent?: string;
    brand?: string;
    model?: string;
    description?: string;
    is_custom?: boolean;
    tuned_by?: string;
  }[];

  // Wheels data
  wheels?: {
    position: "front" | "rear";
    wheel_brand?: string;
    wheel_size?: string;
    wheel_offset?: string;
    tire_size?: string;
    camber_degrees?: number;
  }[];

  // Braking system
  brakes?: {
    position: "front" | "rear";
    caliper?: string;
    disc_size?: string;
    disc_type?: string;
    pads?: string;
  }[];

  brake_accessories?: {
    component: string;
    brand?: string;
    model?: string;
    description?: string;
  }[];

  // Suspension
  suspension?: {
    position?: "front" | "rear";
    suspension_type?: string;
    brand?: string;
    model?: string;
    spring_rate?: string;
    camber_degrees?: number;
    toe_degrees?: string;
    caster_degrees?: string;
  }[];

  suspension_accessories?: {
    accessory_type: string;
    position?: string;
    brand?: string;
    model?: string;
    size?: string;
    description?: string;
  }[];

  // Exterior modifications
  exterior?: {
    category: string;
    component?: string;
    brand?: string;
    model?: string;
    color?: string;
    type?: string;
    finish?: string;
    description?: string;
  }[];

  // Interior modifications
  interior?: {
    category: string;
    position?: string;
    brand?: string;
    model?: string;
    size?: string;
    description?: string;
  }[];

  // Performance modifications
  performance_mods?: {
    category: string;
    modification: string;
    brand?: string;
    model?: string;
    description?: string;
  }[];
}

export default function CompleteEditCarPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const params = useParams();
  const carId = params.id as string;
  const [isLoading, setIsLoading] = useState(false);
  const [car, setCar] = useState<Car | null>(null);

  const [formData, setFormData] = useState<CompleteEditCarFormData>({
    brand: "",
    model: "",
    year: "",
    images: [],
    engine: undefined,
    engine_modifications: [],
    wheels: [],
    brakes: [],
    brake_accessories: [],
    suspension: [],
    suspension_accessories: [],
    exterior: [],
    interior: [],
    performance_mods: [],
  });

  useEffect(() => {
    const loadCar = async () => {
      try {
        const foundCar = await getCarById(carId);
        if (foundCar) {
          setCar(foundCar);
          setFormData({
            brand: foundCar.brand,
            model: foundCar.model,
            year: foundCar.year,
            images: foundCar.images || [],
            engine: foundCar.engine,
            engine_modifications: foundCar.engine_modifications || [],
            wheels: foundCar.wheels || [],
            brakes: foundCar.brakes || [],
            brake_accessories: foundCar.brake_accessories || [],
            suspension: foundCar.suspension || [],
            suspension_accessories: foundCar.suspension_accessories || [],
            exterior: foundCar.exterior || [],
            interior: foundCar.interior || [],
            performance_mods: foundCar.performance_mods || [],
          });
        }
      } catch (error) {
        console.error("Error loading car:", error);
      }
    };
    loadCar();
  }, [carId]);

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Access Denied</h1>
            <p className="text-muted-foreground mt-2">
              Please log in to edit cars.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!car) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Car Not Found</h1>
            <p className="text-muted-foreground mt-2">
              The car you&apos;re trying to edit doesn&apos;t exist.
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
  if (car.owner_id !== user.id) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Access Denied</h1>
            <p className="text-muted-foreground mt-2">
              You don&apos;t have permission to edit this car.
            </p>
            <Link href="/garage" className="mt-4 inline-block">
              <Button>Back to Garage</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Generic handler for form data updates
  const handleFormDataChange = (updates: Partial<CompleteEditCarFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const handleBackClick = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.replace("/garage");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Prepare data for the normalized database structure
      const updateData: Parameters<typeof updateCarWithComponents>[1] = {
        brand: formData.brand,
        model: formData.model,
        year:
          typeof formData.year === "number"
            ? formData.year
            : parseInt(formData.year as string),
        images: formData.images,
        engine: formData.engine,
        engine_modifications: formData.engine_modifications?.filter(
          (mod) => mod.component
        ) as {
          component: string;
          subcomponent?: string;
          brand?: string;
          model?: string;
          description?: string;
          is_custom?: boolean;
          tuned_by?: string;
        }[],
        wheels: formData.wheels,
        brakes: formData.brakes,
        suspension: formData.suspension,
        exterior: formData.exterior,
        interior: formData.interior,
        performance_mods: formData.performance_mods,
      };

      const updatedCar = await updateCarWithComponents(carId, updateData);

      if (updatedCar) {
        router.replace(`/garage/${carId}`);
      } else {
        throw new Error("Failed to update car");
      }
    } catch (error) {
      console.error("Error updating car:", error);
      alert("Failed to update car. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (
      window.confirm(
        "Are you sure you want to delete this car? This action cannot be undone."
      )
    ) {
      setIsLoading(true);
      try {
        // TODO: Implement deleteCar function
        console.log("Deleting car:", carId);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        router.push("/garage");
      } catch (error) {
        console.error("Error deleting car:", error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button variant="outline" size="icon" onClick={handleBackClick}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Edit Car</h1>
              <p className="text-muted-foreground">
                Update your {car.year} {car.brand} {car.model}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Car Images */}
            <CarImageManager
              images={formData.images}
              onChange={(images) => handleFormDataChange({ images })}
              isLoading={isLoading}
            />

            {/* Basic Information */}
            <BasicCarInfo
              data={{
                brand: formData.brand,
                model: formData.model,
                year: formData.year,
              }}
              onChange={(updates) => handleFormDataChange(updates)}
              isLoading={isLoading}
            />

            {/* Engine Details */}
            <EngineDetails
              data={{
                engine: formData.engine,
                engine_modifications: formData.engine_modifications,
              }}
              onChange={(updates) => handleFormDataChange(updates)}
              isLoading={isLoading}
            />

            {/* Wheels & Tires */}
            <WheelsAndTires
              data={{ wheels: formData.wheels }}
              onChange={(updates) => handleFormDataChange(updates)}
              isLoading={isLoading}
            />

            {/* Braking System */}
            <BrakingSystem
              data={{
                brakes: formData.brakes,
                brake_accessories: formData.brake_accessories,
              }}
              onChange={(updates) => handleFormDataChange(updates)}
              isLoading={isLoading}
            />

            {/* Suspension Details */}
            <SuspensionDetails
              data={{
                suspension: formData.suspension,
                suspension_accessories: formData.suspension_accessories,
              }}
              onChange={(updates) => handleFormDataChange(updates)}
              isLoading={isLoading}
            />

            {/* Exterior Modifications */}
            <ExteriorMods
              data={{ exterior: formData.exterior }}
              onChange={(updates) => handleFormDataChange(updates)}
              isLoading={isLoading}
            />

            {/* Interior Modifications */}
            <InteriorMods
              data={{ interior: formData.interior }}
              onChange={(updates) => handleFormDataChange(updates)}
              isLoading={isLoading}
            />

            {/* Performance Modifications */}
            <PerformanceMods
              data={{ performance_mods: formData.performance_mods }}
              onChange={(updates) => handleFormDataChange(updates)}
              isLoading={isLoading}
            />

            {/* Submit Buttons */}
            <div className="flex justify-between">
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={isLoading}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Car
              </Button>

              <div className="flex space-x-4">
                <Link href={`/garage/${carId}`}>
                  <Button variant="outline" type="button">
                    Cancel
                  </Button>
                </Link>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>Saving...</>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
