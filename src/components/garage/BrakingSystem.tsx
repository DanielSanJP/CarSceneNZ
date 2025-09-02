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
import { CarBrake } from "@/types/car";

// Component-specific data interfaces (without database metadata)
type BrakeData = Omit<CarBrake, "id" | "car_id" | "created_at" | "updated_at">;

interface BrakingSystemData {
  brakes?: BrakeData[];
}

interface BrakingSystemProps {
  data: BrakingSystemData;
  onChange: (updates: Partial<BrakingSystemData>) => void;
  isLoading?: boolean;
}

export default function BrakingSystem({
  data,
  onChange,
  isLoading,
}: BrakingSystemProps) {
  const handleBrakeChange = (
    position: "front" | "rear",
    field: keyof Omit<BrakeData, "position">,
    value: string
  ) => {
    const brakes = data.brakes || [];
    const existingBrakeIndex = brakes.findIndex((b) => b.position === position);

    let updatedBrakes: BrakeData[];

    if (existingBrakeIndex >= 0) {
      // Update existing brake
      updatedBrakes = [...brakes];
      updatedBrakes[existingBrakeIndex] = {
        ...updatedBrakes[existingBrakeIndex],
        [field]: value,
      };
    } else {
      // Create new brake entry
      const newBrake: BrakeData = {
        position,
        [field]: value,
      };
      updatedBrakes = [...brakes, newBrake];
    }

    onChange({ brakes: updatedBrakes });
  };

  const getBrakeValue = (
    position: "front" | "rear",
    field: keyof Omit<BrakeData, "position">
  ): string => {
    const brake = data.brakes?.find((b) => b.position === position);
    return brake?.[field] || "";
  };

  return (
    <Card>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="braking-system">
            <AccordionTrigger>Braking System</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-6">
                {/* Front Brakes */}
                <div>
                  <h4 className="font-medium mb-4">Front Brakes</h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Caliper</Label>
                      <Input
                        value={getBrakeValue("front", "caliper")}
                        onChange={(e) =>
                          handleBrakeChange("front", "caliper", e.target.value)
                        }
                        placeholder="e.g., Brembo"
                        disabled={isLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Disc Size</Label>
                      <Input
                        value={getBrakeValue("front", "disc_size")}
                        onChange={(e) =>
                          handleBrakeChange(
                            "front",
                            "disc_size",
                            e.target.value
                          )
                        }
                        placeholder="e.g., 355mm"
                        disabled={isLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Disc Type</Label>
                      <Input
                        value={getBrakeValue("front", "disc_type")}
                        onChange={(e) =>
                          handleBrakeChange(
                            "front",
                            "disc_type",
                            e.target.value
                          )
                        }
                        placeholder="e.g., Slotted"
                        disabled={isLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Brake Pads</Label>
                      <Input
                        value={getBrakeValue("front", "pads")}
                        onChange={(e) =>
                          handleBrakeChange("front", "pads", e.target.value)
                        }
                        placeholder="e.g., Hawk HPS"
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Rear Brakes */}
                <div>
                  <h4 className="font-medium mb-4">Rear Brakes</h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Caliper</Label>
                      <Input
                        value={getBrakeValue("rear", "caliper")}
                        onChange={(e) =>
                          handleBrakeChange("rear", "caliper", e.target.value)
                        }
                        placeholder="e.g., Brembo"
                        disabled={isLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Disc Size</Label>
                      <Input
                        value={getBrakeValue("rear", "disc_size")}
                        onChange={(e) =>
                          handleBrakeChange("rear", "disc_size", e.target.value)
                        }
                        placeholder="e.g., 326mm"
                        disabled={isLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Disc Type</Label>
                      <Input
                        value={getBrakeValue("rear", "disc_type")}
                        onChange={(e) =>
                          handleBrakeChange("rear", "disc_type", e.target.value)
                        }
                        placeholder="e.g., Drilled"
                        disabled={isLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Brake Pads</Label>
                      <Input
                        value={getBrakeValue("rear", "pads")}
                        onChange={(e) =>
                          handleBrakeChange("rear", "pads", e.target.value)
                        }
                        placeholder="e.g., Hawk HPS"
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
