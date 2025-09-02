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
import { CarWheel } from "@/types/car";

// Component-specific data interfaces (without database metadata)
type WheelData = Omit<CarWheel, "id" | "car_id" | "created_at" | "updated_at">;

interface WheelsAndTiresData {
  wheels?: WheelData[];
}

interface WheelsAndTiresProps {
  data: WheelsAndTiresData;
  onChange: (updates: Partial<WheelsAndTiresData>) => void;
  isLoading?: boolean;
}

export default function WheelsAndTires({
  data,
  onChange,
  isLoading,
}: WheelsAndTiresProps) {
  const handleWheelChange = (
    position: "front" | "rear",
    field: keyof Omit<WheelData, "position">,
    value: string | number
  ) => {
    const wheels = data.wheels || [];
    const existingWheelIndex = wheels.findIndex((w) => w.position === position);

    let updatedWheels: WheelData[];

    if (existingWheelIndex >= 0) {
      // Update existing wheel
      updatedWheels = [...wheels];
      updatedWheels[existingWheelIndex] = {
        ...updatedWheels[existingWheelIndex],
        [field]: value,
      };
    } else {
      // Create new wheel entry
      const newWheel: WheelData = {
        position,
        [field]: value,
      };
      updatedWheels = [...wheels, newWheel];
    }

    onChange({ wheels: updatedWheels });
  };

  const getWheelValue = (
    position: "front" | "rear",
    field: keyof Omit<WheelData, "position">
  ): string | number => {
    const wheel = data.wheels?.find((w) => w.position === position);
    return wheel?.[field] || "";
  };

  return (
    <Card>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="wheels-tires">
            <AccordionTrigger>Wheels & Tires</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-6">
                {/* Front Wheels */}
                <div>
                  <h4 className="font-medium mb-4">Front Wheels & Tyres</h4>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <div className="space-y-2">
                      <Label>Wheel</Label>
                      <Input
                        value={getWheelValue("front", "wheel") as string}
                        onChange={(e) =>
                          handleWheelChange("front", "wheel", e.target.value)
                        }
                        placeholder="e.g., Work Emotion CR Ultimate"
                        disabled={isLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Wheel Size</Label>
                      <Input
                        value={getWheelValue("front", "wheel_size") as string}
                        onChange={(e) =>
                          handleWheelChange(
                            "front",
                            "wheel_size",
                            e.target.value
                          )
                        }
                        placeholder="e.g., 18x9.5"
                        disabled={isLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Offset</Label>
                      <Input
                        value={getWheelValue("front", "wheel_offset") as string}
                        onChange={(e) =>
                          handleWheelChange(
                            "front",
                            "wheel_offset",
                            e.target.value
                          )
                        }
                        placeholder="e.g., +38"
                        disabled={isLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Tyre</Label>
                      <Input
                        value={getWheelValue("front", "tyre") as string}
                        onChange={(e) =>
                          handleWheelChange("front", "tyre", e.target.value)
                        }
                        placeholder="e.g., Toyo Proxes R 888 R"
                        disabled={isLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Tyre Size</Label>
                      <Input
                        value={getWheelValue("front", "tyre_size") as string}
                        onChange={(e) =>
                          handleWheelChange(
                            "front",
                            "tyre_size",
                            e.target.value
                          )
                        }
                        placeholder="e.g., 255/40R18"
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Rear Wheels */}
                <div>
                  <h4 className="font-medium mb-4">Rear Wheels & Tyres</h4>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <div className="space-y-2">
                      <Label>Wheel</Label>
                      <Input
                        value={getWheelValue("rear", "wheel") as string}
                        onChange={(e) =>
                          handleWheelChange("rear", "wheel", e.target.value)
                        }
                        placeholder="e.g., Work Emotion CR Ultimate"
                        disabled={isLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Wheel Size</Label>
                      <Input
                        value={getWheelValue("rear", "wheel_size") as string}
                        onChange={(e) =>
                          handleWheelChange(
                            "rear",
                            "wheel_size",
                            e.target.value
                          )
                        }
                        placeholder="e.g., 18x10.5"
                        disabled={isLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Offset</Label>
                      <Input
                        value={getWheelValue("rear", "wheel_offset") as string}
                        onChange={(e) =>
                          handleWheelChange(
                            "rear",
                            "wheel_offset",
                            e.target.value
                          )
                        }
                        placeholder="e.g., +22"
                        disabled={isLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Tyre</Label>
                      <Input
                        value={getWheelValue("rear", "tyre") as string}
                        onChange={(e) =>
                          handleWheelChange("rear", "tyre", e.target.value)
                        }
                        placeholder="e.g., Toyo Proxes R 888 R"
                        disabled={isLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Tyre Size</Label>
                      <Input
                        value={getWheelValue("rear", "tyre_size") as string}
                        onChange={(e) =>
                          handleWheelChange("rear", "tyre_size", e.target.value)
                        }
                        placeholder="e.g., 275/40R18"
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
