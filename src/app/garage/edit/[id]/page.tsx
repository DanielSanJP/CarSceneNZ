"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { getCarById, updateCarWithComponents } from "@/lib/data/cars";
import { ArrowLeft, Save, Trash2 } from "lucide-react";
import Link from "next/link";
import type { Car } from "@/types/car";

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
} from "@/components/garage";

// Complete form data structure - using direct database types
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

  // Engine modifications (direct database structure)
  turbo_system?: {
    turbo?: string;
    intercooler?: string;
  };
  exhaust_system?: {
    intake?: string;
    header?: string;
    exhaust?: string;
  };
  engine_management?: {
    ecu?: string;
    tuned_by?: string;
  };
  internal_components?: {
    pistons?: string;
    connecting_rods?: string;
    valves?: string;
    valve_springs?: string;
    camshafts?: string;
  };
  fuel_system?: {
    fuel_injectors?: string;
    fuel_pump?: string;
    fuel_rail?: string;
  };

  // Exterior modifications (direct database structure)
  paint_finish?: {
    paint_color?: string;
    paint_finish?: string;
    wrap_brand?: string;
    wrap_color?: string;
  };
  lighting_modifications?: {
    headlights?: string;
    taillights?: string;
    fog_lights?: string;
    underglow?: string;
    interior_lighting?: string;
  };
  bodykit_modifications?: {
    front_bumper?: string;
    front_lip?: string;
    rear_bumper?: string;
    rear_lip?: string;
    side_skirts?: string;
    rear_spoiler?: string;
    diffuser?: string;
    fender_flares?: string;
    hood?: string;
  };

  // Interior modifications (direct database structure)
  seats?: {
    front_seats?: string;
    rear_seats?: string;
  };
  audio_system?: {
    head_unit?: string;
    speakers?: string;
    amplifier?: string;
    subwoofer?: string;
  };
  steering_wheel?: {
    steering_wheel?: string;
  };

  // Other component data - arrays for components not yet converted
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  wheels?: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  brakes?: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  suspension?: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  suspension_accessories?: any[];
}

export default function CompleteEditCarPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const params = useParams();
  const carId = params.id as string;
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCar, setIsLoadingCar] = useState(true);
  const [car, setCar] = useState<Car | null>(null);

  const [formData, setFormData] = useState<CompleteEditCarFormData>({
    brand: "",
    model: "",
    year: "",
    images: [],
    engine: undefined,
    turbo_system: undefined,
    exhaust_system: undefined,
    engine_management: undefined,
    internal_components: undefined,
    fuel_system: undefined,
    paint_finish: undefined,
    lighting_modifications: undefined,
    bodykit_modifications: undefined,
    seats: undefined,
    audio_system: undefined,
    steering_wheel: undefined,
    wheels: [],
    brakes: [],
    suspension: [],
    suspension_accessories: [],
  });

  useEffect(() => {
    const loadCar = async () => {
      try {
        setIsLoadingCar(true);
        const foundCar = await getCarById(carId);
        if (foundCar) {
          setCar(foundCar);

          // Convert new normalized format to direct format for the form components
          setFormData({
            brand: foundCar.brand,
            model: foundCar.model,
            year: foundCar.year,
            images: foundCar.images || [],
            engine: foundCar.engine,
            turbo_system: foundCar.turbo_system,
            exhaust_system: foundCar.exhaust_system,
            engine_management: foundCar.engine_management,
            internal_components: foundCar.internal_components,
            fuel_system: foundCar.fuel_system,
            paint_finish: foundCar.paint_finish,
            lighting_modifications: foundCar.lighting_modifications,
            bodykit_modifications: foundCar.bodykit_modifications,
            seats: foundCar.seats,
            audio_system: foundCar.audio_system,
            steering_wheel: foundCar.steering_wheel,
            wheels: foundCar.wheels || [],
            brakes: foundCar.brakes || [],
            suspension: foundCar.suspension || [],
            suspension_accessories: [], // TODO: Convert from new structure
          });
        }
      } catch (error) {
        console.error("Error loading car:", error);
      } finally {
        setIsLoadingCar(false);
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

  // Show loading state while fetching car data
  if (isLoadingCar) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Loading Car...</h1>
            <p className="text-muted-foreground mt-2">
              Please wait while we load your car details.
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
      // Data is already in the correct normalized format
      const updateData: Parameters<typeof updateCarWithComponents>[1] = {
        brand: formData.brand,
        model: formData.model,
        year:
          typeof formData.year === "number"
            ? formData.year
            : parseInt(formData.year as string),
        images: formData.images,
        engine: {
          engine: formData.engine,
          turbo_system: formData.turbo_system,
          exhaust_system: formData.exhaust_system,
          engine_management: formData.engine_management,
          internal_components: formData.internal_components,
          fuel_system: formData.fuel_system,
        },
        chassis: {
          wheels: formData.wheels || [],
          brakes: formData.brakes || [],
          suspension: formData.suspension || [],
        },
        exterior: {
          paint_finish: formData.paint_finish,
          lighting_modifications: formData.lighting_modifications,
          bodykit_modifications: formData.bodykit_modifications,
        },
        interior: {
          seats: formData.seats,
          steering_wheel: formData.steering_wheel,
          audio_system: formData.audio_system,
          gauges: [], // TODO: Handle gauges if needed
        },
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
                turbo_system: formData.turbo_system,
                exhaust_system: formData.exhaust_system,
                engine_management: formData.engine_management,
                internal_components: formData.internal_components,
                fuel_system: formData.fuel_system,
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
              }}
              onChange={(updates) => handleFormDataChange(updates)}
              isLoading={isLoading}
            />

            {/* Suspension Details */}
            <SuspensionDetails
              data={{
                suspension: formData.suspension,
              }}
              onChange={(updates) => handleFormDataChange(updates)}
              isLoading={isLoading}
            />

            {/* Exterior Modifications */}
            <ExteriorMods
              data={{
                paint_finish: formData.paint_finish,
                lighting_modifications: formData.lighting_modifications,
                bodykit_modifications: formData.bodykit_modifications,
              }}
              onChange={(updates) => handleFormDataChange(updates)}
              isLoading={isLoading}
            />

            {/* Interior Modifications */}
            <InteriorMods
              data={{
                seats: formData.seats,
                audio_system: formData.audio_system,
                steering_wheel: formData.steering_wheel,
              }}
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
