"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { createCarWithComponents } from "@/lib/data/cars";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";

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

// Complete form data structure for all components
interface CreateCarFormData {
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

  // Wheels data
  wheels?: {
    position: "front" | "rear";
    wheel?: string;
    wheel_size?: string;
    wheel_offset?: string;
    tyre?: string;
    tyre_size?: string;
  }[];

  // Braking system
  brakes?: {
    position: "front" | "rear";
    caliper?: string;
    disc_size?: string;
    disc_type?: string;
    pads?: string;
  }[];

  // Suspension
  suspension?: {
    position?: "front" | "rear";
    suspension_type?: string;
    suspension?: string;
    spring_rate?: string;
    camber_degrees?: number;
    toe_degrees?: string;
    caster_degrees?: string;
    anti_roll_bar?: string;
    strut_brace?: string;
  }[];

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
    material?: string;
    color?: string;
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
}

export default function CreateCarPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState<CreateCarFormData>({
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
    wheels: [],
    brakes: [],
    suspension: [],
    paint_finish: undefined,
    lighting_modifications: undefined,
    bodykit_modifications: undefined,
    seats: undefined,
    audio_system: undefined,
    steering_wheel: undefined,
  });

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Access Denied</h1>
            <p className="text-muted-foreground mt-2">
              Please log in to add cars to your garage.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Generic handler for form data updates
  const handleFormDataChange = (updates: Partial<CreateCarFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!user) {
        console.error("User not authenticated");
        return;
      }

      // Validate required fields
      if (!formData.brand || !formData.model || !formData.year) {
        alert("Please fill in at least the brand, model, and year.");
        return;
      }

      console.log("Creating car:", formData);

      // For now, create car without images - images will be handled by the CarImageManager component
      // The images in formData.images are already URLs (either uploaded or preview URLs)

      // Prepare data for the normalized database structure
      const createData: Parameters<typeof createCarWithComponents>[0] = {
        owner_id: user.id,
        brand: formData.brand,
        model: formData.model,
        year:
          typeof formData.year === "number"
            ? formData.year
            : parseInt(formData.year as string),
        images: formData.images, // Use images from form data
        engine: formData.engine
          ? {
              engine: formData.engine,
              turbo_system: formData.turbo_system,
              exhaust_system: formData.exhaust_system,
              engine_management: formData.engine_management,
              internal_components: formData.internal_components,
              fuel_system: formData.fuel_system,
            }
          : undefined,
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

      console.log("Creating car with components:", createData);

      // Create the car
      const newCar = await createCarWithComponents(createData);

      if (!newCar) {
        console.error("Failed to create car");
        alert("Failed to create car. Please try again.");
        return;
      }

      console.log("Car created successfully:", newCar);

      // Redirect to the new car's detail page
      router.push(`/garage/${newCar.id}`);
    } catch (error) {
      console.error("Error creating car:", error);
      alert("An error occurred while creating the car. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Link href="/garage">
              <Button variant="outline" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Add New Car</h1>
              <p className="text-muted-foreground">
                Add a new car to your garage and share your build
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
            <div className="flex justify-end space-x-4">
              <Link href="/garage">
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
                    Add Car
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
