"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
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
  PerformanceMods,
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
