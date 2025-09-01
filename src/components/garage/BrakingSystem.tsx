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

interface BrakeData {
  position: "front" | "rear";
  caliper?: string;
  disc_size?: string;
  disc_type?: string;
  pads?: string;
}

interface BrakeAccessoryData {
  component: string; // 'brake_lines', 'master_cylinder'
  brand?: string;
  model?: string;
  description?: string;
}

interface BrakingSystemData {
  brakes?: BrakeData[];
  brake_accessories?: BrakeAccessoryData[];
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

  const handleAccessoryChange = (
    component: string,
    field: keyof Omit<BrakeAccessoryData, "component">,
    value: string
  ) => {
    const accessories = data.brake_accessories || [];
    const existingAccessoryIndex = accessories.findIndex(
      (a) => a.component === component
    );

    let updatedAccessories: BrakeAccessoryData[];

    if (existingAccessoryIndex >= 0) {
      // Update existing accessory
      updatedAccessories = [...accessories];
      updatedAccessories[existingAccessoryIndex] = {
        ...updatedAccessories[existingAccessoryIndex],
        [field]: value,
      };
    } else if (value.trim()) {
      // Create new accessory entry if value is not empty
      const newAccessory: BrakeAccessoryData = {
        component,
        [field]: value,
      };
      updatedAccessories = [...accessories, newAccessory];
    } else {
      updatedAccessories = accessories;
    }

    onChange({ brake_accessories: updatedAccessories });
  };

  const getBrakeValue = (
    position: "front" | "rear",
    field: keyof Omit<BrakeData, "position">
  ): string => {
    const brake = data.brakes?.find((b) => b.position === position);
    return brake?.[field] || "";
  };

  const getAccessoryValue = (
    component: string,
    field: keyof Omit<BrakeAccessoryData, "component">
  ): string => {
    const accessory = data.brake_accessories?.find(
      (a) => a.component === component
    );
    return accessory?.[field] || "";
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

                <Separator />

                {/* Brake Accessories */}
                <div>
                  <h4 className="font-medium mb-4">Brake Accessories</h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Brake Lines</Label>
                      <Input
                        value={getAccessoryValue("brake_lines", "brand")}
                        onChange={(e) =>
                          handleAccessoryChange(
                            "brake_lines",
                            "brand",
                            e.target.value
                          )
                        }
                        placeholder="e.g., Goodridge"
                        disabled={isLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Master Cylinder</Label>
                      <Input
                        value={getAccessoryValue("master_cylinder", "brand")}
                        onChange={(e) =>
                          handleAccessoryChange(
                            "master_cylinder",
                            "brand",
                            e.target.value
                          )
                        }
                        placeholder="e.g., Stock"
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
