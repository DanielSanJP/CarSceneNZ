"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { CarSeats, CarAudioSystem, CarSteeringWheel } from "@/types/car";

// Component-specific data interfaces (without database metadata)
type SeatsData = Omit<CarSeats, "id" | "car_id" | "created_at" | "updated_at">;
type AudioSystemData = Omit<
  CarAudioSystem,
  "id" | "car_id" | "created_at" | "updated_at"
>;
type SteeringWheelData = Omit<
  CarSteeringWheel,
  "id" | "car_id" | "created_at" | "updated_at"
>;

interface InteriorModsData {
  seats?: SeatsData;
  audio_system?: AudioSystemData;
  steering_wheel?: SteeringWheelData;
}

interface InteriorModsProps {
  data: InteriorModsData;
  onChange: (updates: Partial<InteriorModsData>) => void;
  isLoading?: boolean;
}

export default function InteriorMods({
  data,
  onChange,
  isLoading,
}: InteriorModsProps) {
  const handleSeatsChange = (field: keyof SeatsData, value: string) => {
    const updatedSeats = {
      ...data.seats,
      [field]: value,
    } as SeatsData;
    onChange({ seats: updatedSeats });
  };

  const handleAudioSystemChange = (
    field: keyof AudioSystemData,
    value: string
  ) => {
    const updatedAudioSystem = {
      ...data.audio_system,
      [field]: value,
    } as AudioSystemData;
    onChange({ audio_system: updatedAudioSystem });
  };

  const handleSteeringWheelChange = (
    field: keyof SteeringWheelData,
    value: string
  ) => {
    const updatedSteeringWheel = {
      ...data.steering_wheel,
      [field]: value,
    } as SteeringWheelData;
    onChange({ steering_wheel: updatedSteeringWheel });
  };

  return (
    <Card>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="interior-mods">
            <AccordionTrigger>Interior Modifications</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-6">
                {/* Seats */}
                <div>
                  <h4 className="font-medium mb-4">Seats</h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Front Seats</Label>
                      <Input
                        value={data.seats?.front_seats || ""}
                        onChange={(e) =>
                          handleSeatsChange("front_seats", e.target.value)
                        }
                        placeholder="e.g., Recaro SPG"
                        disabled={isLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Rear Seats</Label>
                      <Input
                        value={data.seats?.rear_seats || ""}
                        onChange={(e) =>
                          handleSeatsChange("rear_seats", e.target.value)
                        }
                        placeholder="e.g., Stock"
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Steering Wheel */}
                <div>
                  <h4 className="font-medium mb-4">Steering Wheel</h4>
                  <div className="space-y-2">
                    <Label>Steering Wheel</Label>
                    <Input
                      value={data.steering_wheel?.steering_wheel || ""}
                      onChange={(e) =>
                        handleSteeringWheelChange(
                          "steering_wheel",
                          e.target.value
                        )
                      }
                      placeholder="e.g., MOMO Prototipo 350mm Leather"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <Separator />

                {/* Audio System */}
                <div>
                  <h4 className="font-medium mb-4">Audio System</h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Head Unit</Label>
                      <Input
                        value={data.audio_system?.head_unit || ""}
                        onChange={(e) =>
                          handleAudioSystemChange("head_unit", e.target.value)
                        }
                        placeholder="e.g., Pioneer DEH-X7800DAB"
                        disabled={isLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Speakers</Label>
                      <Input
                        value={data.audio_system?.speakers || ""}
                        onChange={(e) =>
                          handleAudioSystemChange("speakers", e.target.value)
                        }
                        placeholder="e.g., JL Audio C2-650X"
                        disabled={isLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Amplifier</Label>
                      <Input
                        value={data.audio_system?.amplifier || ""}
                        onChange={(e) =>
                          handleAudioSystemChange("amplifier", e.target.value)
                        }
                        placeholder="e.g., JL Audio XD400/4v2"
                        disabled={isLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Subwoofer</Label>
                      <Input
                        value={data.audio_system?.subwoofer || ""}
                        onChange={(e) =>
                          handleAudioSystemChange("subwoofer", e.target.value)
                        }
                        placeholder="e.g., JL Audio 10W3v3-4"
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}
