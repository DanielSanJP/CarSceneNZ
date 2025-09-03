"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createCarWithComponents } from "@/lib/server/car-actions";
import { ArrowLeft, Save } from "lucide-react";

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

  // Engine modifications
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
    camshafts?: string;
    valve_springs?: string;
  };
  fuel_system?: {
    fuel_injectors?: string;
    fuel_pump?: string;
    fuel_rail?: string;
  };

  // Exterior modifications
  paint_finish?: {
    paint_color?: string;
    paint_finish?: string;
    wrap_brand?: string;
    wrap_color?: string;
  };
  lighting_modifications?: {
    headlights?: string;
    taillights?: string;
    underglow?: string;
  };
  bodykit_modifications?: {
    front_bumper?: string;
    rear_bumper?: string;
    side_skirts?: string;
    rear_spoiler?: string;
  };

  // Interior modifications
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

  // Other components
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  wheels?: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  brakes?: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  suspension?: any[];
}

interface CreateCarFormProps {
  user: {
    id: string;
    username: string;
    display_name?: string;
  };
}

export function CreateCarForm({ user }: CreateCarFormProps) {
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
    paint_finish: undefined,
    lighting_modifications: undefined,
    bodykit_modifications: undefined,
    seats: undefined,
    audio_system: undefined,
    steering_wheel: undefined,
    wheels: [],
    brakes: [],
    suspension: [],
  });

  const handleBackClick = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push("/garage");
    }
  };

  const handleSubmit = async () => {
    if (!formData.brand || !formData.model || !formData.year) {
      alert("Please fill in all required fields (Brand, Model, Year)");
      return;
    }

    setIsLoading(true);
    try {
      // Transform form data to match expected structure
      const submitData = {
        owner_id: user.id,
        brand: formData.brand,
        model: formData.model,
        year:
          typeof formData.year === "string"
            ? parseInt(formData.year)
            : formData.year,
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
          wheels: formData.wheels,
          brakes: formData.brakes,
          suspension: formData.suspension,
        },
        exterior: {
          paint_finish: formData.paint_finish,
          lighting_modifications: formData.lighting_modifications,
          bodykit_modifications: formData.bodykit_modifications,
        },
        interior: {
          seats: formData.seats,
          audio_system: formData.audio_system,
          steering_wheel: formData.steering_wheel,
        },
      };

      // Call server function directly
      const result = await createCarWithComponents(submitData);

      if (result) {
        // Success - navigate to the new car page
        router.push(`/garage/${result.id}`);
        router.refresh();
      } else {
        throw new Error("Failed to create car");
      }
    } catch (error) {
      console.error("Error creating car:", error);
      alert("Failed to create car. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={handleBackClick}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Add New Car</h1>
            <p className="text-muted-foreground">Add your car to the garage</p>
          </div>
        </div>

        <Button onClick={handleSubmit} disabled={isLoading}>
          <Save className="h-4 w-4 mr-2" />
          {isLoading ? "Creating..." : "Create Car"}
        </Button>
      </div>

      {/* Form Sections */}
      <div className="space-y-8">
        {/* Basic Car Info */}
        <BasicCarInfo
          data={{
            brand: formData.brand,
            model: formData.model,
            year: formData.year,
          }}
          onChange={(updates) =>
            setFormData((prev) => ({ ...prev, ...updates }))
          }
        />

        {/* Car Images */}
        <CarImageManager
          images={formData.images}
          onChange={(images) => setFormData((prev) => ({ ...prev, images }))}
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
          onChange={(updates) =>
            setFormData((prev) => ({ ...prev, ...updates }))
          }
        />

        {/* Wheels & Tires */}
        <WheelsAndTires
          data={{ wheels: formData.wheels }}
          onChange={(updates) =>
            setFormData((prev) => ({ ...prev, ...updates }))
          }
        />

        {/* Braking System */}
        <BrakingSystem
          data={{ brakes: formData.brakes }}
          onChange={(updates) =>
            setFormData((prev) => ({ ...prev, ...updates }))
          }
        />

        {/* Suspension Details */}
        <SuspensionDetails
          data={{
            suspension: formData.suspension,
          }}
          onChange={(updates) =>
            setFormData((prev) => ({ ...prev, ...updates }))
          }
        />

        {/* Exterior Modifications */}
        <ExteriorMods
          data={{
            paint_finish: formData.paint_finish,
            lighting_modifications: formData.lighting_modifications,
            bodykit_modifications: formData.bodykit_modifications,
          }}
          onChange={(updates) =>
            setFormData((prev) => ({ ...prev, ...updates }))
          }
        />

        {/* Interior Modifications */}
        <InteriorMods
          data={{
            seats: formData.seats,
            audio_system: formData.audio_system,
            steering_wheel: formData.steering_wheel,
          }}
          onChange={(updates) =>
            setFormData((prev) => ({ ...prev, ...updates }))
          }
        />
      </div>

      {/* Bottom Create Button */}
      <div className="mt-12 text-center">
        <Button onClick={handleSubmit} disabled={isLoading} size="lg">
          <Save className="h-4 w-4 mr-2" />
          {isLoading ? "Creating..." : "Create Car"}
        </Button>
      </div>
    </>
  );
}
