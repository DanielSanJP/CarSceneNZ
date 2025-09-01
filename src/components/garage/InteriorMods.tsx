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

// Direct database structure interfaces
interface SeatsData {
  front_seats?: string;
  rear_seats?: string;
  seat_material?: string;
  seat_color?: string;
}

interface AudioSystemData {
  head_unit?: string;
  speakers?: string;
  amplifier?: string;
  subwoofer?: string;
}

interface SteeringWheelData {
  steering_wheel_brand?: string;
  steering_wheel_model?: string;
  material?: string;
  size?: string;
}

interface RollcageData {
  rollcage_type?: string;
  rollcage_brand?: string;
  material?: string;
  points?: number;
}

interface InteriorModsData {
  seats?: SeatsData;
  audio_system?: AudioSystemData;
  steering_wheel?: SteeringWheelData;
  rollcage?: RollcageData;
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

  const handleRollcageChange = (field: keyof RollcageData, value: string) => {
    const updatedRollcage = {
      ...data.rollcage,
      [field]: value,
    } as RollcageData;
    onChange({ rollcage: updatedRollcage });
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
                    <div className="space-y-2">
                      <Label>Seat Material</Label>
                      <Input
                        value={data.seats?.seat_material || ""}
                        onChange={(e) =>
                          handleSeatsChange("seat_material", e.target.value)
                        }
                        placeholder="e.g., Alcantara"
                        disabled={isLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Seat Color</Label>
                      <Input
                        value={data.seats?.seat_color || ""}
                        onChange={(e) =>
                          handleSeatsChange("seat_color", e.target.value)
                        }
                        placeholder="e.g., Black"
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Steering Wheel */}
                <div>
                  <h4 className="font-medium mb-4">Steering Wheel</h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Brand</Label>
                      <Input
                        value={data.steering_wheel?.steering_wheel_brand || ""}
                        onChange={(e) =>
                          handleSteeringWheelChange(
                            "steering_wheel_brand",
                            e.target.value
                          )
                        }
                        placeholder="e.g., MOMO"
                        disabled={isLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Model</Label>
                      <Input
                        value={data.steering_wheel?.steering_wheel_model || ""}
                        onChange={(e) =>
                          handleSteeringWheelChange(
                            "steering_wheel_model",
                            e.target.value
                          )
                        }
                        placeholder="e.g., Prototipo"
                        disabled={isLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Material</Label>
                      <Input
                        value={data.steering_wheel?.material || ""}
                        onChange={(e) =>
                          handleSteeringWheelChange("material", e.target.value)
                        }
                        placeholder="e.g., Leather"
                        disabled={isLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Size</Label>
                      <Input
                        value={data.steering_wheel?.size || ""}
                        onChange={(e) =>
                          handleSteeringWheelChange("size", e.target.value)
                        }
                        placeholder="e.g., 350mm"
                        disabled={isLoading}
                      />
                    </div>
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

                <Separator />

                {/* Roll Cage */}
                <div>
                  <h4 className="font-medium mb-4">Roll Cage</h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Type</Label>
                      <Input
                        value={data.rollcage?.rollcage_type || ""}
                        onChange={(e) =>
                          handleRollcageChange("rollcage_type", e.target.value)
                        }
                        placeholder="e.g., Half Cage"
                        disabled={isLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Brand</Label>
                      <Input
                        value={data.rollcage?.rollcage_brand || ""}
                        onChange={(e) =>
                          handleRollcageChange("rollcage_brand", e.target.value)
                        }
                        placeholder="e.g., OMP"
                        disabled={isLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Material</Label>
                      <Input
                        value={data.rollcage?.material || ""}
                        onChange={(e) =>
                          handleRollcageChange("material", e.target.value)
                        }
                        placeholder="e.g., Steel"
                        disabled={isLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Points</Label>
                      <Input
                        value={data.rollcage?.points || ""}
                        onChange={(e) =>
                          handleRollcageChange("points", e.target.value)
                        }
                        placeholder="e.g., 6-point"
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
