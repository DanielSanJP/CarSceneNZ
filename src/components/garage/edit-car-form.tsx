"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save } from "lucide-react";
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

// Complete form data structure
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

interface EditCarFormProps {
  car: Car;
  action: (formData: FormData) => Promise<void>;
}

export function EditCarForm({ car, action }: EditCarFormProps) {
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState<CompleteEditCarFormData>({
    brand: car.brand || "",
    model: car.model || "",
    year: car.year || "",
    images: car.images || [],
    engine: car.engine || undefined,
    turbo_system: car.turbo_system || undefined,
    exhaust_system: car.exhaust_system || undefined,
    engine_management: car.engine_management || undefined,
    internal_components: car.internal_components || undefined,
    fuel_system: car.fuel_system || undefined,
    paint_finish: car.paint_finish || undefined,
    lighting_modifications: car.lighting_modifications || undefined,
    bodykit_modifications: car.bodykit_modifications || undefined,
    seats: car.seats || undefined,
    audio_system: car.audio_system || undefined,
    steering_wheel: car.steering_wheel || undefined,
    wheels: car.wheels || [],
    brakes: car.brakes || [],
    suspension: car.suspension || [],
  });

  const handleBackClick = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = `/garage/${car.id}`;
    }
  };

  const handleSubmit = async () => {
    if (!formData.brand || !formData.model || !formData.year) {
      alert("Please fill in all required fields (Brand, Model, Year)");
      return;
    }

    setIsLoading(true);
    try {
      // Create FormData object for server action
      const formDataObj = new FormData();

      // Add basic car info
      formDataObj.append("brand", formData.brand);
      formDataObj.append("model", formData.model);
      formDataObj.append("year", formData.year.toString());
      formDataObj.append("images", JSON.stringify(formData.images));

      // Add component data as JSON strings
      if (
        formData.engine ||
        formData.turbo_system ||
        formData.exhaust_system ||
        formData.engine_management ||
        formData.internal_components ||
        formData.fuel_system
      ) {
        formDataObj.append(
          "engine",
          JSON.stringify({
            engine: formData.engine,
            turbo_system: formData.turbo_system,
            exhaust_system: formData.exhaust_system,
            engine_management: formData.engine_management,
            internal_components: formData.internal_components,
            fuel_system: formData.fuel_system,
          })
        );
      }

      if (formData.wheels || formData.brakes || formData.suspension) {
        formDataObj.append(
          "chassis",
          JSON.stringify({
            wheels: formData.wheels,
            brakes: formData.brakes,
            suspension: formData.suspension,
          })
        );
      }

      if (
        formData.paint_finish ||
        formData.lighting_modifications ||
        formData.bodykit_modifications
      ) {
        formDataObj.append(
          "exterior",
          JSON.stringify({
            paint_finish: formData.paint_finish,
            lighting_modifications: formData.lighting_modifications,
            bodykit_modifications: formData.bodykit_modifications,
          })
        );
      }

      if (formData.seats || formData.audio_system || formData.steering_wheel) {
        formDataObj.append(
          "interior",
          JSON.stringify({
            seats: formData.seats,
            audio_system: formData.audio_system,
            steering_wheel: formData.steering_wheel,
          })
        );
      }

      // Call the server action
      await action(formDataObj);
    } catch (error) {
      console.error("Error updating car:", error);
      alert("Failed to update car. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="icon" onClick={handleBackClick}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">Edit Car</h1>
                <p className="text-muted-foreground">
                  Update your {car.brand} {car.model}
                </p>
              </div>
            </div>

            <Button onClick={handleSubmit} disabled={isLoading}>
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? "Saving..." : "Save Changes"}
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
              onChange={(images) =>
                setFormData((prev) => ({ ...prev, images }))
              }
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

          {/* Bottom Save Button */}
          <div className="mt-12 text-center">
            <Button onClick={handleSubmit} disabled={isLoading} size="lg">
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
