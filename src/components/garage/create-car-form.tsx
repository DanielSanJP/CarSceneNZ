"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
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
  InformationModal,
} from "@/components/garage";

// Complete form data structure - aligned with flattened Car type
interface CreateCarFormData {
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

interface CreateCarFormProps {
  action: (formData: FormData) => Promise<void>;
}

export function CreateCarForm({ action }: CreateCarFormProps) {
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState<CreateCarFormData>({
    brand: "",
    model: "",
    year: "",
    images: [],

    // All optional flattened fields start as undefined
    engine_code: undefined,
    displacement: undefined,
    aspiration: undefined,
    power_hp: undefined,
    torque_nm: undefined,
    ecu: undefined,
    tuned_by: undefined,
    pistons: undefined,
    connecting_rods: undefined,
    valves: undefined,
    valve_springs: undefined,
    camshafts: undefined,
    header: undefined,
    exhaust: undefined,
    intake: undefined,
    turbo: undefined,
    intercooler: undefined,
    fuel_injectors: undefined,
    fuel_pump: undefined,
    fuel_rail: undefined,
    head_unit: undefined,
    speakers: undefined,
    subwoofer: undefined,
    amplifier: undefined,
    front_bumper: undefined,
    front_lip: undefined,
    rear_bumper: undefined,
    rear_lip: undefined,
    side_skirts: undefined,
    rear_spoiler: undefined,
    diffuser: undefined,
    fender_flares: undefined,
    hood: undefined,
    paint_color: undefined,
    paint_finish: undefined,
    wrap_brand: undefined,
    wrap_color: undefined,
    front_seats: undefined,
    rear_seats: undefined,
    steering_wheel: undefined,
    headlights: undefined,
    taillights: undefined,
    fog_lights: undefined,
    underglow: undefined,
    interior_lighting: undefined,

    // JSON structured fields
    brakes: undefined,
    suspension: undefined,
    wheels: undefined,
    gauges: undefined,
  });

  const handleBackClick = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = "/garage";
    }
  };

  const handleSubmit = async () => {
    if (!formData.brand || !formData.model || !formData.year) {
      alert("Please fill in all required fields (Brand, Model, Year)");
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
      const value = formData[field as keyof CreateCarFormData];
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
    await action(formDataObj);
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

        <div className="flex items-center gap-2">
          <Button onClick={handleSubmit} disabled={isLoading}>
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? "Creating..." : "Create Car"}
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
              camshafts: formData.camshafts,
              valve_springs: formData.valve_springs,
            },
            fuel_system: {
              fuel_injectors: formData.fuel_injectors,
              fuel_pump: formData.fuel_pump,
              fuel_rail: formData.fuel_rail,
            },
          }}
          onChange={(updates) => {
            const flattenedUpdates: Partial<CreateCarFormData> = {};

            if (updates.engine) {
              if (updates.engine.engine_code !== undefined)
                flattenedUpdates.engine_code = updates.engine.engine_code;
              if (updates.engine.displacement !== undefined)
                flattenedUpdates.displacement = updates.engine.displacement;
              if (updates.engine.aspiration !== undefined)
                flattenedUpdates.aspiration = updates.engine.aspiration;
              if (updates.engine.power_hp !== undefined)
                flattenedUpdates.power_hp = updates.engine.power_hp;
              if (updates.engine.torque_nm !== undefined)
                flattenedUpdates.torque_nm = updates.engine.torque_nm;
            }

            if (updates.turbo_system) {
              if (updates.turbo_system.turbo !== undefined)
                flattenedUpdates.turbo = updates.turbo_system.turbo;
              if (updates.turbo_system.intercooler !== undefined)
                flattenedUpdates.intercooler = updates.turbo_system.intercooler;
            }

            if (updates.exhaust_system) {
              if (updates.exhaust_system.intake !== undefined)
                flattenedUpdates.intake = updates.exhaust_system.intake;
              if (updates.exhaust_system.header !== undefined)
                flattenedUpdates.header = updates.exhaust_system.header;
              if (updates.exhaust_system.exhaust !== undefined)
                flattenedUpdates.exhaust = updates.exhaust_system.exhaust;
            }

            if (updates.engine_management) {
              if (updates.engine_management.ecu !== undefined)
                flattenedUpdates.ecu = updates.engine_management.ecu;
              if (updates.engine_management.tuned_by !== undefined)
                flattenedUpdates.tuned_by = updates.engine_management.tuned_by;
            }

            if (updates.internal_components) {
              if (updates.internal_components.pistons !== undefined)
                flattenedUpdates.pistons = updates.internal_components.pistons;
              if (updates.internal_components.connecting_rods !== undefined)
                flattenedUpdates.connecting_rods =
                  updates.internal_components.connecting_rods;
              if (updates.internal_components.valves !== undefined)
                flattenedUpdates.valves = updates.internal_components.valves;
              if (updates.internal_components.camshafts !== undefined)
                flattenedUpdates.camshafts =
                  updates.internal_components.camshafts;
              if (updates.internal_components.valve_springs !== undefined)
                flattenedUpdates.valve_springs =
                  updates.internal_components.valve_springs;
            }

            if (updates.fuel_system) {
              if (updates.fuel_system.fuel_injectors !== undefined)
                flattenedUpdates.fuel_injectors =
                  updates.fuel_system.fuel_injectors;
              if (updates.fuel_system.fuel_pump !== undefined)
                flattenedUpdates.fuel_pump = updates.fuel_system.fuel_pump;
              if (updates.fuel_system.fuel_rail !== undefined)
                flattenedUpdates.fuel_rail = updates.fuel_system.fuel_rail;
            }

            setFormData((prev) => ({ ...prev, ...flattenedUpdates }));
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
                          wheel: formData.wheels.front.wheel,
                          wheel_size: formData.wheels.front.wheel_size,
                          wheel_offset: formData.wheels.front.wheel_offset,
                          tyre: formData.wheels.front.tyre,
                          tyre_size: formData.wheels.front.tyre_size,
                        },
                      ]
                    : []),
                  ...(formData.wheels.rear
                    ? [
                        {
                          position: "rear" as const,
                          wheel: formData.wheels.rear.wheel,
                          wheel_size: formData.wheels.rear.wheel_size,
                          wheel_offset: formData.wheels.rear.wheel_offset,
                          tyre: formData.wheels.rear.tyre,
                          tyre_size: formData.wheels.rear.tyre_size,
                        },
                      ]
                    : []),
                ]
              : undefined,
          }}
          onChange={(updates) => {
            if (updates.wheels) {
              const frontWheel = updates.wheels.find(
                (w) => w.position === "front"
              );
              const rearWheel = updates.wheels.find(
                (w) => w.position === "rear"
              );

              setFormData((prev) => ({
                ...prev,
                wheels: {
                  ...(frontWheel
                    ? {
                        front: {
                          wheel: frontWheel.wheel,
                          wheel_size: frontWheel.wheel_size,
                          wheel_offset: frontWheel.wheel_offset,
                          tyre: frontWheel.tyre,
                          tyre_size: frontWheel.tyre_size,
                        },
                      }
                    : {}),
                  ...(rearWheel
                    ? {
                        rear: {
                          wheel: rearWheel.wheel,
                          wheel_size: rearWheel.wheel_size,
                          wheel_offset: rearWheel.wheel_offset,
                          tyre: rearWheel.tyre,
                          tyre_size: rearWheel.tyre_size,
                        },
                      }
                    : {}),
                },
              }));
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
                          suspension: formData.suspension.front.suspension,
                          spring_rate: formData.suspension.front.spring_rate,
                          strut_brace: formData.suspension.front.strut_brace,
                          anti_roll_bar:
                            formData.suspension.front.anti_roll_bar,
                          camber_degrees:
                            formData.suspension.front.camber_degrees,
                          caster_degrees:
                            formData.suspension.front.caster_degrees,
                          toe_degrees: formData.suspension.front.toe_degrees,
                        },
                      ]
                    : []),
                  ...(formData.suspension.rear
                    ? [
                        {
                          position: "rear" as const,
                          suspension: formData.suspension.rear.suspension,
                          spring_rate: formData.suspension.rear.spring_rate,
                          strut_brace: formData.suspension.rear.strut_brace,
                          anti_roll_bar: formData.suspension.rear.anti_roll_bar,
                          camber_degrees:
                            formData.suspension.rear.camber_degrees,
                          caster_degrees:
                            formData.suspension.rear.caster_degrees,
                          toe_degrees: formData.suspension.rear.toe_degrees,
                        },
                      ]
                    : []),
                ]
              : undefined,
          }}
          onChange={(updates) => {
            if (updates.suspension) {
              const frontSuspension = updates.suspension.find(
                (s) => s.position === "front"
              );
              const rearSuspension = updates.suspension.find(
                (s) => s.position === "rear"
              );

              setFormData((prev) => ({
                ...prev,
                suspension: {
                  ...(frontSuspension
                    ? {
                        front: {
                          suspension: frontSuspension.suspension,
                          spring_rate: frontSuspension.spring_rate,
                          strut_brace: frontSuspension.strut_brace,
                          anti_roll_bar: frontSuspension.anti_roll_bar,
                          camber_degrees: frontSuspension.camber_degrees,
                          caster_degrees: frontSuspension.caster_degrees,
                          toe_degrees: frontSuspension.toe_degrees,
                        },
                      }
                    : {}),
                  ...(rearSuspension
                    ? {
                        rear: {
                          suspension: rearSuspension.suspension,
                          spring_rate: rearSuspension.spring_rate,
                          strut_brace: rearSuspension.strut_brace,
                          anti_roll_bar: rearSuspension.anti_roll_bar,
                          camber_degrees: rearSuspension.camber_degrees,
                          caster_degrees: rearSuspension.caster_degrees,
                          toe_degrees: rearSuspension.toe_degrees,
                        },
                      }
                    : {}),
                },
              }));
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
                          caliper: formData.brakes.front.caliper,
                          pads: formData.brakes.front.pads,
                          disc_size: formData.brakes.front.disc_size,
                          disc_type: formData.brakes.front.disc_type,
                        },
                      ]
                    : []),
                  ...(formData.brakes.rear
                    ? [
                        {
                          position: "rear" as const,
                          caliper: formData.brakes.rear.caliper,
                          pads: formData.brakes.rear.pads,
                          disc_size: formData.brakes.rear.disc_size,
                          disc_type: formData.brakes.rear.disc_type,
                        },
                      ]
                    : []),
                ]
              : undefined,
          }}
          onChange={(updates) => {
            if (updates.brakes) {
              const frontBrake = updates.brakes.find(
                (b) => b.position === "front"
              );
              const rearBrake = updates.brakes.find(
                (b) => b.position === "rear"
              );

              setFormData((prev) => ({
                ...prev,
                brakes: {
                  ...(frontBrake
                    ? {
                        front: {
                          caliper: frontBrake.caliper,
                          pads: frontBrake.pads,
                          disc_size: frontBrake.disc_size,
                          disc_type: frontBrake.disc_type,
                        },
                      }
                    : {}),
                  ...(rearBrake
                    ? {
                        rear: {
                          caliper: rearBrake.caliper,
                          pads: rearBrake.pads,
                          disc_size: rearBrake.disc_size,
                          disc_type: rearBrake.disc_type,
                        },
                      }
                    : {}),
                },
              }));
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
            const flattenedUpdates: Partial<CreateCarFormData> = {};

            if (updates.paint_finish) {
              if (updates.paint_finish.paint_color !== undefined)
                flattenedUpdates.paint_color = updates.paint_finish.paint_color;
              if (updates.paint_finish.paint_finish !== undefined)
                flattenedUpdates.paint_finish =
                  updates.paint_finish.paint_finish;
              if (updates.paint_finish.wrap_brand !== undefined)
                flattenedUpdates.wrap_brand = updates.paint_finish.wrap_brand;
              if (updates.paint_finish.wrap_color !== undefined)
                flattenedUpdates.wrap_color = updates.paint_finish.wrap_color;
            }

            if (updates.lighting_modifications) {
              if (updates.lighting_modifications.headlights !== undefined)
                flattenedUpdates.headlights =
                  updates.lighting_modifications.headlights;
              if (updates.lighting_modifications.taillights !== undefined)
                flattenedUpdates.taillights =
                  updates.lighting_modifications.taillights;
              if (updates.lighting_modifications.fog_lights !== undefined)
                flattenedUpdates.fog_lights =
                  updates.lighting_modifications.fog_lights;
              if (updates.lighting_modifications.underglow !== undefined)
                flattenedUpdates.underglow =
                  updates.lighting_modifications.underglow;
              if (
                updates.lighting_modifications.interior_lighting !== undefined
              )
                flattenedUpdates.interior_lighting =
                  updates.lighting_modifications.interior_lighting;
            }

            if (updates.bodykit_modifications) {
              if (updates.bodykit_modifications.front_bumper !== undefined)
                flattenedUpdates.front_bumper =
                  updates.bodykit_modifications.front_bumper;
              if (updates.bodykit_modifications.front_lip !== undefined)
                flattenedUpdates.front_lip =
                  updates.bodykit_modifications.front_lip;
              if (updates.bodykit_modifications.rear_bumper !== undefined)
                flattenedUpdates.rear_bumper =
                  updates.bodykit_modifications.rear_bumper;
              if (updates.bodykit_modifications.rear_lip !== undefined)
                flattenedUpdates.rear_lip =
                  updates.bodykit_modifications.rear_lip;
              if (updates.bodykit_modifications.side_skirts !== undefined)
                flattenedUpdates.side_skirts =
                  updates.bodykit_modifications.side_skirts;
              if (updates.bodykit_modifications.rear_spoiler !== undefined)
                flattenedUpdates.rear_spoiler =
                  updates.bodykit_modifications.rear_spoiler;
              if (updates.bodykit_modifications.diffuser !== undefined)
                flattenedUpdates.diffuser =
                  updates.bodykit_modifications.diffuser;
              if (updates.bodykit_modifications.fender_flares !== undefined)
                flattenedUpdates.fender_flares =
                  updates.bodykit_modifications.fender_flares;
              if (updates.bodykit_modifications.hood !== undefined)
                flattenedUpdates.hood = updates.bodykit_modifications.hood;
            }

            setFormData((prev) => ({ ...prev, ...flattenedUpdates }));
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
            const flattenedUpdates: Partial<CreateCarFormData> = {};

            if (updates.seats) {
              if (updates.seats.front_seats !== undefined)
                flattenedUpdates.front_seats = updates.seats.front_seats;
              if (updates.seats.rear_seats !== undefined)
                flattenedUpdates.rear_seats = updates.seats.rear_seats;
            }

            if (updates.audio_system) {
              if (updates.audio_system.head_unit !== undefined)
                flattenedUpdates.head_unit = updates.audio_system.head_unit;
              if (updates.audio_system.speakers !== undefined)
                flattenedUpdates.speakers = updates.audio_system.speakers;
              if (updates.audio_system.subwoofer !== undefined)
                flattenedUpdates.subwoofer = updates.audio_system.subwoofer;
              if (updates.audio_system.amplifier !== undefined)
                flattenedUpdates.amplifier = updates.audio_system.amplifier;
            }

            if (updates.steering_wheel) {
              if (updates.steering_wheel.steering_wheel !== undefined)
                flattenedUpdates.steering_wheel =
                  updates.steering_wheel.steering_wheel;
            }

            setFormData((prev) => ({ ...prev, ...flattenedUpdates }));
          }}
        />
      </div>

      {/* Bottom Create Button */}
      <div className="mt-12 text-center">
        <div className="flex items-center justify-center gap-2">
          <Button onClick={handleSubmit} disabled={isLoading} size="lg">
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? "Creating..." : "Create Car"}
          </Button>
          <InformationModal />
        </div>
      </div>
    </>
  );
}
