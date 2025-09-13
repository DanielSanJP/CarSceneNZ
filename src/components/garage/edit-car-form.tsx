"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog";
import { ArrowLeft, Save, Trash2 } from "lucide-react";
import type { Car } from "@/types/car";
import { toast } from "sonner";

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
  InformationModal,
} from "@/components/garage";

// Complete form data structure - aligned with flattened Car type
interface CompleteEditCarFormData {
  // Basic car info
  brand: string;
  model: string;
  year: number | "";
  images: string[];

  // Flattened engine data
  engine_code?: string;
  displacement?: string;
  aspiration?: string;
  power_hp?: number;
  torque_nm?: number;

  // Engine management
  ecu?: string;
  tuned_by?: string;

  // Internal engine components
  pistons?: string;
  connecting_rods?: string;
  valves?: string;
  valve_springs?: string;
  camshafts?: string;

  // Exhaust & intake
  header?: string;
  exhaust?: string;
  intake?: string;

  // Turbo system
  turbo?: string;
  intercooler?: string;

  // Fuel system
  fuel_injectors?: string;
  fuel_pump?: string;
  fuel_rail?: string;

  // Audio system
  head_unit?: string;
  speakers?: string;
  subwoofer?: string;
  amplifier?: string;

  // Exterior modifications
  front_bumper?: string;
  front_lip?: string;
  rear_bumper?: string;
  rear_lip?: string;
  side_skirts?: string;
  rear_spoiler?: string;
  diffuser?: string;
  fender_flares?: string;
  hood?: string;

  // Paint & finish
  paint_color?: string;
  paint_finish?: string;
  wrap_brand?: string;
  wrap_color?: string;

  // Interior
  front_seats?: string;
  rear_seats?: string;
  steering_wheel?: string;

  // Lighting
  headlights?: string;
  taillights?: string;
  fog_lights?: string;
  underglow?: string;
  interior_lighting?: string;

  // JSON structured fields
  brakes?: {
    front?: {
      caliper?: string;
      pads?: string;
      disc_size?: string;
      disc_type?: string;
    };
    rear?: {
      caliper?: string;
      pads?: string;
      disc_size?: string;
      disc_type?: string;
    };
  };

  suspension?: {
    front?: {
      suspension?: string;
      spring_rate?: string;
      strut_brace?: string;
      anti_roll_bar?: string;
      camber_degrees?: number;
      caster_degrees?: string;
      toe_degrees?: string;
    };
    rear?: {
      suspension?: string;
      spring_rate?: string;
      strut_brace?: string;
      anti_roll_bar?: string;
      camber_degrees?: number;
      caster_degrees?: string;
      toe_degrees?: string;
    };
  };

  wheels?: {
    front?: {
      wheel?: string;
      wheel_size?: string;
      wheel_offset?: string;
      tyre?: string;
      tyre_size?: string;
    };
    rear?: {
      wheel?: string;
      wheel_size?: string;
      wheel_offset?: string;
      tyre?: string;
      tyre_size?: string;
    };
  };

  gauges?: Array<{
    id?: string;
    gauge_type?: string;
    brand?: string;
  }>;
}

interface EditCarFormProps {
  car: Car;
  action: (formData: FormData) => Promise<void>;
  onDelete?: () => Promise<void>;
  uploadAction: (
    formData: FormData
  ) => Promise<{ urls: string[]; error: string | null }>;
}

export function EditCarForm({
  car,
  action,
  onDelete,
  uploadAction,
}: EditCarFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const [formData, setFormData] = useState<CompleteEditCarFormData>({
    brand: car.brand || "",
    model: car.model || "",
    year: car.year || "",
    images: car.images || [],

    // Flattened engine data
    engine_code: car.engine_code || "",
    displacement: car.displacement || "",
    aspiration: car.aspiration || "",
    power_hp: car.power_hp || undefined,
    torque_nm: car.torque_nm || undefined,

    // Engine management
    ecu: car.ecu || "",
    tuned_by: car.tuned_by || "",

    // Internal engine components
    pistons: car.pistons || "",
    connecting_rods: car.connecting_rods || "",
    valves: car.valves || "",
    valve_springs: car.valve_springs || "",
    camshafts: car.camshafts || "",

    // Exhaust & intake
    header: car.header || "",
    exhaust: car.exhaust || "",
    intake: car.intake || "",

    // Turbo system
    turbo: car.turbo || "",
    intercooler: car.intercooler || "",

    // Fuel system
    fuel_injectors: car.fuel_injectors || "",
    fuel_pump: car.fuel_pump || "",
    fuel_rail: car.fuel_rail || "",

    // Audio system
    head_unit: car.head_unit || "",
    speakers: car.speakers || "",
    subwoofer: car.subwoofer || "",
    amplifier: car.amplifier || "",

    // Exterior modifications
    front_bumper: car.front_bumper || "",
    front_lip: car.front_lip || "",
    rear_bumper: car.rear_bumper || "",
    rear_lip: car.rear_lip || "",
    side_skirts: car.side_skirts || "",
    rear_spoiler: car.rear_spoiler || "",
    diffuser: car.diffuser || "",
    fender_flares: car.fender_flares || "",
    hood: car.hood || "",

    // Paint & finish
    paint_color: car.paint_color || "",
    paint_finish: car.paint_finish || "",
    wrap_brand: car.wrap_brand || "",
    wrap_color: car.wrap_color || "",

    // Interior
    front_seats: car.front_seats || "",
    rear_seats: car.rear_seats || "",
    steering_wheel: car.steering_wheel || "",

    // Lighting
    headlights: car.headlights || "",
    taillights: car.taillights || "",
    fog_lights: car.fog_lights || "",
    underglow: car.underglow || "",
    interior_lighting: car.interior_lighting || "",

    // JSON structured fields
    brakes: car.brakes || undefined,
    suspension: car.suspension || undefined,
    wheels: car.wheels || undefined,
    gauges: car.gauges || undefined,
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
      toast.error("Please fill in all required fields (Brand, Model, Year)");
      return;
    }

    setIsLoading(true);

    // Create FormData object for server action
    const formDataObj = new FormData();

    // Add basic car info
    formDataObj.append("brand", formData.brand);
    formDataObj.append("model", formData.model);
    formDataObj.append("year", formData.year.toString());

    // Only send image URLs, not the full image data
    if (formData.images && formData.images.length > 0) {
      formDataObj.append("images", JSON.stringify(formData.images));
    }

    // Add flattened fields individually (more efficient than nested objects)
    const fieldsToAdd = [
      "engine_code",
      "displacement",
      "aspiration",
      "power_hp",
      "torque_nm",
      "ecu",
      "tuned_by",
      "pistons",
      "connecting_rods",
      "valves",
      "valve_springs",
      "camshafts",
      "header",
      "exhaust",
      "intake",
      "turbo",
      "intercooler",
      "fuel_injectors",
      "fuel_pump",
      "fuel_rail",
      "head_unit",
      "speakers",
      "subwoofer",
      "amplifier",
      "front_bumper",
      "front_lip",
      "rear_bumper",
      "rear_lip",
      "side_skirts",
      "rear_spoiler",
      "diffuser",
      "fender_flares",
      "hood",
      "paint_color",
      "paint_finish",
      "wrap_brand",
      "wrap_color",
      "front_seats",
      "rear_seats",
      "steering_wheel",
      "headlights",
      "taillights",
      "fog_lights",
      "underglow",
      "interior_lighting",
    ];

    fieldsToAdd.forEach((field) => {
      const value = formData[field as keyof CompleteEditCarFormData];
      if (value !== undefined && value !== "" && value !== null) {
        formDataObj.append(field, String(value));
      }
    });

    // Add JSON structured fields only if they have data
    if (formData.brakes && Object.keys(formData.brakes).length > 0) {
      formDataObj.append("brakes", JSON.stringify(formData.brakes));
    }

    if (formData.suspension && Object.keys(formData.suspension).length > 0) {
      formDataObj.append("suspension", JSON.stringify(formData.suspension));
    }

    if (formData.wheels && Object.keys(formData.wheels).length > 0) {
      formDataObj.append("wheels", JSON.stringify(formData.wheels));
    }

    if (formData.gauges && formData.gauges.length > 0) {
      formDataObj.append("gauges", JSON.stringify(formData.gauges));
    }

    // Call the server action - let it handle redirects naturally
    try {
      await action(formDataObj);
    } catch (error) {
      // Check if this is a Next.js redirect (expected behavior)
      if (
        error &&
        typeof error === "object" &&
        ("digest" in error || error.constructor.name === "RedirectError")
      ) {
        // This is a redirect, which is expected - don't show error
        return;
      }

      toast.error("Failed to update car. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  const handleDelete = async () => {
    if (!onDelete) {
      toast.error("Delete function not available");
      return;
    }

    setIsDeleting(true);
    try {
      await onDelete();
    } catch {
      toast.error("Failed to delete car. Please try again.");
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleCancel = () => {
    const hasUnsavedChanges = window.confirm(
      "Are you sure you want to cancel? Any unsaved changes will be lost."
    );

    if (hasUnsavedChanges) {
      handleBackClick();
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
            <h1 className="text-2xl md:text-3xl font-bold">Edit Car</h1>
            <p className="text-muted-foreground">
              Update your {car.brand} {car.model}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
          <InformationModal />
        </div>
      </div>

      {/* Form Sections */}
      <div className="space-y-8">
        {/* Car Images */}
        <CarImageManager
          images={formData.images}
          onChange={(images) => setFormData((prev) => ({ ...prev, images }))}
          carId={car.id}
          uploadAction={uploadAction}
        />

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

        {/* Engine Details */}
        <EngineDetails
          data={{
            engine: {
              engine_code: formData.engine_code,
              displacement: formData.displacement,
              aspiration: formData.aspiration,
              power_hp: formData.power_hp,
              torque_nm: formData.torque_nm,
            },
            turbo_system: {
              turbo: formData.turbo,
              intercooler: formData.intercooler,
            },
            exhaust_system: {
              intake: formData.intake,
              header: formData.header,
              exhaust: formData.exhaust,
            },
            engine_management: {
              ecu: formData.ecu,
              tuned_by: formData.tuned_by,
            },
            internal_components: {
              pistons: formData.pistons,
              connecting_rods: formData.connecting_rods,
              valves: formData.valves,
              valve_springs: formData.valve_springs,
              camshafts: formData.camshafts,
            },
            fuel_system: {
              fuel_injectors: formData.fuel_injectors,
              fuel_pump: formData.fuel_pump,
              fuel_rail: formData.fuel_rail,
            },
          }}
          onChange={(updates) => {
            const flatUpdates: Partial<CompleteEditCarFormData> = {};

            if (updates.engine) {
              if (updates.engine.engine_code !== undefined)
                flatUpdates.engine_code = updates.engine.engine_code;
              if (updates.engine.displacement !== undefined)
                flatUpdates.displacement = updates.engine.displacement;
              if (updates.engine.aspiration !== undefined)
                flatUpdates.aspiration = updates.engine.aspiration;
              if (updates.engine.power_hp !== undefined)
                flatUpdates.power_hp = updates.engine.power_hp;
              if (updates.engine.torque_nm !== undefined)
                flatUpdates.torque_nm = updates.engine.torque_nm;
            }

            if (updates.turbo_system) {
              if (updates.turbo_system.turbo !== undefined)
                flatUpdates.turbo = updates.turbo_system.turbo;
              if (updates.turbo_system.intercooler !== undefined)
                flatUpdates.intercooler = updates.turbo_system.intercooler;
            }

            if (updates.exhaust_system) {
              if (updates.exhaust_system.intake !== undefined)
                flatUpdates.intake = updates.exhaust_system.intake;
              if (updates.exhaust_system.header !== undefined)
                flatUpdates.header = updates.exhaust_system.header;
              if (updates.exhaust_system.exhaust !== undefined)
                flatUpdates.exhaust = updates.exhaust_system.exhaust;
            }

            if (updates.engine_management) {
              if (updates.engine_management.ecu !== undefined)
                flatUpdates.ecu = updates.engine_management.ecu;
              if (updates.engine_management.tuned_by !== undefined)
                flatUpdates.tuned_by = updates.engine_management.tuned_by;
            }

            if (updates.internal_components) {
              if (updates.internal_components.pistons !== undefined)
                flatUpdates.pistons = updates.internal_components.pistons;
              if (updates.internal_components.connecting_rods !== undefined)
                flatUpdates.connecting_rods =
                  updates.internal_components.connecting_rods;
              if (updates.internal_components.valves !== undefined)
                flatUpdates.valves = updates.internal_components.valves;
              if (updates.internal_components.valve_springs !== undefined)
                flatUpdates.valve_springs =
                  updates.internal_components.valve_springs;
              if (updates.internal_components.camshafts !== undefined)
                flatUpdates.camshafts = updates.internal_components.camshafts;
            }

            if (updates.fuel_system) {
              if (updates.fuel_system.fuel_injectors !== undefined)
                flatUpdates.fuel_injectors = updates.fuel_system.fuel_injectors;
              if (updates.fuel_system.fuel_pump !== undefined)
                flatUpdates.fuel_pump = updates.fuel_system.fuel_pump;
              if (updates.fuel_system.fuel_rail !== undefined)
                flatUpdates.fuel_rail = updates.fuel_system.fuel_rail;
            }

            setFormData((prev) => ({ ...prev, ...flatUpdates }));
          }}
        />

        {/* Wheels & Tires */}
        <WheelsAndTires
          data={{
            wheels: formData.wheels
              ? [
                  ...(formData.wheels.front
                    ? [
                        {
                          position: "front" as const,
                          ...formData.wheels.front,
                        },
                      ]
                    : []),
                  ...(formData.wheels.rear
                    ? [
                        {
                          position: "rear" as const,
                          ...formData.wheels.rear,
                        },
                      ]
                    : []),
                ]
              : [],
          }}
          onChange={(updates) => {
            if (updates.wheels) {
              const wheels = {
                front: updates.wheels.find(
                  (w: { position: string }) => w.position === "front"
                ),
                rear: updates.wheels.find(
                  (w: { position: string }) => w.position === "rear"
                ),
              };
              setFormData((prev) => ({ ...prev, wheels }));
            }
          }}
        />

        {/* Suspension Details */}
        <SuspensionDetails
          data={{
            suspension: formData.suspension
              ? [
                  ...(formData.suspension.front
                    ? [
                        {
                          position: "front" as const,
                          ...formData.suspension.front,
                        },
                      ]
                    : []),
                  ...(formData.suspension.rear
                    ? [
                        {
                          position: "rear" as const,
                          ...formData.suspension.rear,
                        },
                      ]
                    : []),
                ]
              : [],
          }}
          onChange={(updates) => {
            if (updates.suspension) {
              const suspension = {
                front: updates.suspension.find((s) => s.position === "front"),
                rear: updates.suspension.find((s) => s.position === "rear"),
              };
              setFormData((prev) => ({ ...prev, suspension }));
            }
          }}
        />

        {/* Braking System */}
        <BrakingSystem
          data={{
            brakes: formData.brakes
              ? [
                  ...(formData.brakes.front
                    ? [
                        {
                          position: "front" as const,
                          ...formData.brakes.front,
                        },
                      ]
                    : []),
                  ...(formData.brakes.rear
                    ? [
                        {
                          position: "rear" as const,
                          ...formData.brakes.rear,
                        },
                      ]
                    : []),
                ]
              : [],
          }}
          onChange={(updates) => {
            if (updates.brakes) {
              const brakes = {
                front: updates.brakes.find(
                  (b: { position: string }) => b.position === "front"
                ),
                rear: updates.brakes.find(
                  (b: { position: string }) => b.position === "rear"
                ),
              };
              setFormData((prev) => ({ ...prev, brakes }));
            }
          }}
        />

        {/* Exterior Modifications */}
        <ExteriorMods
          data={{
            paint_finish: {
              paint_color: formData.paint_color,
              paint_finish: formData.paint_finish,
              wrap_brand: formData.wrap_brand,
              wrap_color: formData.wrap_color,
            },
            lighting_modifications: {
              headlights: formData.headlights,
              taillights: formData.taillights,
              fog_lights: formData.fog_lights,
              underglow: formData.underglow,
              interior_lighting: formData.interior_lighting,
            },
            bodykit_modifications: {
              front_bumper: formData.front_bumper,
              front_lip: formData.front_lip,
              rear_bumper: formData.rear_bumper,
              rear_lip: formData.rear_lip,
              side_skirts: formData.side_skirts,
              rear_spoiler: formData.rear_spoiler,
              diffuser: formData.diffuser,
              fender_flares: formData.fender_flares,
              hood: formData.hood,
            },
          }}
          onChange={(updates) => {
            const flatUpdates: Partial<CompleteEditCarFormData> = {};

            if (updates.paint_finish) {
              if (updates.paint_finish.paint_color !== undefined)
                flatUpdates.paint_color = updates.paint_finish.paint_color;
              if (updates.paint_finish.paint_finish !== undefined)
                flatUpdates.paint_finish = updates.paint_finish.paint_finish;
              if (updates.paint_finish.wrap_brand !== undefined)
                flatUpdates.wrap_brand = updates.paint_finish.wrap_brand;
              if (updates.paint_finish.wrap_color !== undefined)
                flatUpdates.wrap_color = updates.paint_finish.wrap_color;
            }

            if (updates.lighting_modifications) {
              if (updates.lighting_modifications.headlights !== undefined)
                flatUpdates.headlights =
                  updates.lighting_modifications.headlights;
              if (updates.lighting_modifications.taillights !== undefined)
                flatUpdates.taillights =
                  updates.lighting_modifications.taillights;
              if (updates.lighting_modifications.fog_lights !== undefined)
                flatUpdates.fog_lights =
                  updates.lighting_modifications.fog_lights;
              if (updates.lighting_modifications.underglow !== undefined)
                flatUpdates.underglow =
                  updates.lighting_modifications.underglow;
              if (
                updates.lighting_modifications.interior_lighting !== undefined
              )
                flatUpdates.interior_lighting =
                  updates.lighting_modifications.interior_lighting;
            }

            if (updates.bodykit_modifications) {
              if (updates.bodykit_modifications.front_bumper !== undefined)
                flatUpdates.front_bumper =
                  updates.bodykit_modifications.front_bumper;
              if (updates.bodykit_modifications.front_lip !== undefined)
                flatUpdates.front_lip = updates.bodykit_modifications.front_lip;
              if (updates.bodykit_modifications.rear_bumper !== undefined)
                flatUpdates.rear_bumper =
                  updates.bodykit_modifications.rear_bumper;
              if (updates.bodykit_modifications.rear_lip !== undefined)
                flatUpdates.rear_lip = updates.bodykit_modifications.rear_lip;
              if (updates.bodykit_modifications.side_skirts !== undefined)
                flatUpdates.side_skirts =
                  updates.bodykit_modifications.side_skirts;
              if (updates.bodykit_modifications.rear_spoiler !== undefined)
                flatUpdates.rear_spoiler =
                  updates.bodykit_modifications.rear_spoiler;
              if (updates.bodykit_modifications.diffuser !== undefined)
                flatUpdates.diffuser = updates.bodykit_modifications.diffuser;
              if (updates.bodykit_modifications.fender_flares !== undefined)
                flatUpdates.fender_flares =
                  updates.bodykit_modifications.fender_flares;
              if (updates.bodykit_modifications.hood !== undefined)
                flatUpdates.hood = updates.bodykit_modifications.hood;
            }

            setFormData((prev) => ({ ...prev, ...flatUpdates }));
          }}
        />

        {/* Interior Modifications */}
        <InteriorMods
          data={{
            seats: {
              front_seats: formData.front_seats,
              rear_seats: formData.rear_seats,
            },
            audio_system: {
              head_unit: formData.head_unit,
              speakers: formData.speakers,
              subwoofer: formData.subwoofer,
              amplifier: formData.amplifier,
            },
            steering_wheel: {
              steering_wheel: formData.steering_wheel,
            },
          }}
          onChange={(updates) => {
            const flatUpdates: Partial<CompleteEditCarFormData> = {};

            if (updates.seats) {
              if (updates.seats.front_seats !== undefined)
                flatUpdates.front_seats = updates.seats.front_seats;
              if (updates.seats.rear_seats !== undefined)
                flatUpdates.rear_seats = updates.seats.rear_seats;
            }

            if (updates.audio_system) {
              if (updates.audio_system.head_unit !== undefined)
                flatUpdates.head_unit = updates.audio_system.head_unit;
              if (updates.audio_system.speakers !== undefined)
                flatUpdates.speakers = updates.audio_system.speakers;
              if (updates.audio_system.subwoofer !== undefined)
                flatUpdates.subwoofer = updates.audio_system.subwoofer;
              if (updates.audio_system.amplifier !== undefined)
                flatUpdates.amplifier = updates.audio_system.amplifier;
            }

            if (updates.steering_wheel) {
              if (updates.steering_wheel.steering_wheel !== undefined)
                flatUpdates.steering_wheel =
                  updates.steering_wheel.steering_wheel;
            }

            setFormData((prev) => ({ ...prev, ...flatUpdates }));
          }}
        />
      </div>

      {/* Bottom Save Button */}
      <div className="mt-6 text-center">
        <div className="flex items-center justify-between gap-2">
          <Button
            variant="destructive"
            onClick={() => setShowDeleteDialog(true)}
            disabled={isDeleting || isLoading}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {isDeleting ? "Deleting..." : "Delete Car"}
          </Button>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading || isDeleting}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isLoading || isDeleting}>
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </div>

      <DeleteConfirmationDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDelete}
        title="Delete Car"
        description="Are you sure you want to delete this car? This action cannot be undone."
        itemName={`${car.brand} ${car.model} (${car.year})`}
        isLoading={isDeleting}
      />
    </>
  );
}
