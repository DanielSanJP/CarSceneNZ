"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface SuspensionData {
  position?: "front" | "rear"; // nullable for general suspension_type
  suspension_type?: string; // 'coilovers', 'springs', 'air' etc.
  brand?: string;
  model?: string;
  spring_rate?: string;
  camber_degrees?: number;
  toe_degrees?: string;
  caster_degrees?: string;
}

interface SuspensionAccessoryData {
  accessory_type: string; // 'anti_roll_bar', 'strut_brace'
  position?: string; // 'front', 'rear', or null for general
  brand?: string;
  model?: string;
  size?: string;
  description?: string;
}

interface SuspensionDetailsData {
  suspension?: SuspensionData[];
  suspension_accessories?: SuspensionAccessoryData[];
}

interface SuspensionDetailsProps {
  data: SuspensionDetailsData;
  onChange: (updates: Partial<SuspensionDetailsData>) => void;
  isLoading?: boolean;
}

export default function SuspensionDetails({
  data,
  onChange,
  isLoading,
}: SuspensionDetailsProps) {
  const handleSuspensionChange = (
    position: "front" | "rear" | "general",
    field: keyof SuspensionData,
    value: string | number
  ) => {
    const suspension = data.suspension || [];
    const targetPosition = position === "general" ? undefined : position;
    const existingSuspensionIndex = suspension.findIndex(
      (s) => s.position === targetPosition
    );

    let updatedSuspension: SuspensionData[];

    if (existingSuspensionIndex >= 0) {
      // Update existing suspension
      updatedSuspension = [...suspension];
      updatedSuspension[existingSuspensionIndex] = {
        ...updatedSuspension[existingSuspensionIndex],
        [field]: value,
      };
    } else {
      // Create new suspension entry
      const newSuspension: SuspensionData = {
        position: targetPosition,
        [field]: value,
      };
      updatedSuspension = [...suspension, newSuspension];
    }

    onChange({ suspension: updatedSuspension });
  };

  const handleAccessoryChange = (
    accessoryType: string,
    position: string | null,
    field: keyof Omit<SuspensionAccessoryData, "accessory_type">,
    value: string
  ) => {
    const accessories = data.suspension_accessories || [];
    const existingAccessoryIndex = accessories.findIndex(
      (a) => a.accessory_type === accessoryType && a.position === position
    );

    let updatedAccessories: SuspensionAccessoryData[];

    if (existingAccessoryIndex >= 0) {
      // Update existing accessory
      updatedAccessories = [...accessories];
      updatedAccessories[existingAccessoryIndex] = {
        ...updatedAccessories[existingAccessoryIndex],
        [field]: value,
      };
    } else if (value.trim()) {
      // Create new accessory entry if value is not empty
      const newAccessory: SuspensionAccessoryData = {
        accessory_type: accessoryType,
        position: position || undefined,
        [field]: value,
      };
      updatedAccessories = [...accessories, newAccessory];
    } else {
      updatedAccessories = accessories;
    }

    onChange({ suspension_accessories: updatedAccessories });
  };

  const getSuspensionValue = (
    position: "front" | "rear" | "general",
    field: keyof SuspensionData
  ): string | number => {
    const targetPosition = position === "general" ? undefined : position;
    const suspensionItem = data.suspension?.find(
      (s) => s.position === targetPosition
    );
    return suspensionItem?.[field] || "";
  };

  const getAccessoryValue = (
    accessoryType: string,
    position: string | null,
    field: keyof Omit<SuspensionAccessoryData, "accessory_type">
  ): string => {
    const accessory = data.suspension_accessories?.find(
      (a) => a.accessory_type === accessoryType && a.position === position
    );
    return accessory?.[field] || "";
  };

  return (
    <Card>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="suspension-details">
            <AccordionTrigger>Suspension Details</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-6">
                {/* General Suspension Type */}
                <div>
                  <h4 className="font-medium mb-4">Suspension Type</h4>
                  <div className="space-y-2">
                    <Label htmlFor="suspension-type">Suspension Setup</Label>
                    <Select
                      value={
                        getSuspensionValue(
                          "general",
                          "suspension_type"
                        ) as string
                      }
                      onValueChange={(value) =>
                        handleSuspensionChange(
                          "general",
                          "suspension_type",
                          value
                        )
                      }
                      disabled={isLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select suspension type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="air_suspension">
                          Air Suspension
                        </SelectItem>
                        <SelectItem value="coilovers">Coilovers</SelectItem>
                        <SelectItem value="lowering_springs">
                          Lowering Springs
                        </SelectItem>
                        <SelectItem value="stock">Stock</SelectItem>
                        <SelectItem value="adjustable_coilovers">
                          Adjustable Coilovers
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                {/* Front Suspension */}
                <div>
                  <h4 className="font-medium mb-4">Front Suspension</h4>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label>Brand</Label>
                      <Input
                        value={getSuspensionValue("front", "brand") as string}
                        onChange={(e) =>
                          handleSuspensionChange(
                            "front",
                            "brand",
                            e.target.value
                          )
                        }
                        placeholder="e.g., BC Racing"
                        disabled={isLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Model</Label>
                      <Input
                        value={getSuspensionValue("front", "model") as string}
                        onChange={(e) =>
                          handleSuspensionChange(
                            "front",
                            "model",
                            e.target.value
                          )
                        }
                        placeholder="e.g., BR Series"
                        disabled={isLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Spring Rate</Label>
                      <Input
                        value={
                          getSuspensionValue("front", "spring_rate") as string
                        }
                        onChange={(e) =>
                          handleSuspensionChange(
                            "front",
                            "spring_rate",
                            e.target.value
                          )
                        }
                        placeholder="e.g., 8K"
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  {/* Front Alignment */}
                  <div className="grid gap-4 md:grid-cols-3 mt-4">
                    <div className="space-y-2">
                      <Label>Camber (degrees)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={
                          (getSuspensionValue(
                            "front",
                            "camber_degrees"
                          ) as number) || ""
                        }
                        onChange={(e) =>
                          handleSuspensionChange(
                            "front",
                            "camber_degrees",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        placeholder="e.g., -3.2"
                        disabled={isLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Toe</Label>
                      <Input
                        value={
                          getSuspensionValue("front", "toe_degrees") as string
                        }
                        onChange={(e) =>
                          handleSuspensionChange(
                            "front",
                            "toe_degrees",
                            e.target.value
                          )
                        }
                        placeholder="e.g., 0.5°"
                        disabled={isLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Caster</Label>
                      <Input
                        value={
                          getSuspensionValue(
                            "front",
                            "caster_degrees"
                          ) as string
                        }
                        onChange={(e) =>
                          handleSuspensionChange(
                            "front",
                            "caster_degrees",
                            e.target.value
                          )
                        }
                        placeholder="e.g., 6.2°"
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Rear Suspension */}
                <div>
                  <h4 className="font-medium mb-4">Rear Suspension</h4>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label>Brand</Label>
                      <Input
                        value={getSuspensionValue("rear", "brand") as string}
                        onChange={(e) =>
                          handleSuspensionChange(
                            "rear",
                            "brand",
                            e.target.value
                          )
                        }
                        placeholder="e.g., BC Racing"
                        disabled={isLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Model</Label>
                      <Input
                        value={getSuspensionValue("rear", "model") as string}
                        onChange={(e) =>
                          handleSuspensionChange(
                            "rear",
                            "model",
                            e.target.value
                          )
                        }
                        placeholder="e.g., BR Series"
                        disabled={isLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Spring Rate</Label>
                      <Input
                        value={
                          getSuspensionValue("rear", "spring_rate") as string
                        }
                        onChange={(e) =>
                          handleSuspensionChange(
                            "rear",
                            "spring_rate",
                            e.target.value
                          )
                        }
                        placeholder="e.g., 6K"
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  {/* Rear Alignment */}
                  <div className="grid gap-4 md:grid-cols-3 mt-4">
                    <div className="space-y-2">
                      <Label>Camber (degrees)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={
                          (getSuspensionValue(
                            "rear",
                            "camber_degrees"
                          ) as number) || ""
                        }
                        onChange={(e) =>
                          handleSuspensionChange(
                            "rear",
                            "camber_degrees",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        placeholder="e.g., -2.8"
                        disabled={isLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Toe</Label>
                      <Input
                        value={
                          getSuspensionValue("rear", "toe_degrees") as string
                        }
                        onChange={(e) =>
                          handleSuspensionChange(
                            "rear",
                            "toe_degrees",
                            e.target.value
                          )
                        }
                        placeholder="e.g., 0.2°"
                        disabled={isLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Caster</Label>
                      <Input
                        value={
                          getSuspensionValue("rear", "caster_degrees") as string
                        }
                        onChange={(e) =>
                          handleSuspensionChange(
                            "rear",
                            "caster_degrees",
                            e.target.value
                          )
                        }
                        placeholder="e.g., N/A"
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Suspension Accessories */}
                <div>
                  <h4 className="font-medium mb-4">Suspension Accessories</h4>
                  <div className="space-y-4">
                    {/* Anti-Roll Bars */}
                    <div>
                      <h5 className="font-medium mb-2">Anti-Roll Bars</h5>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Front Anti-Roll Bar</Label>
                          <Input
                            value={getAccessoryValue(
                              "anti_roll_bar",
                              "front",
                              "brand"
                            )}
                            onChange={(e) =>
                              handleAccessoryChange(
                                "anti_roll_bar",
                                "front",
                                "brand",
                                e.target.value
                              )
                            }
                            placeholder="e.g., Whiteline"
                            disabled={isLoading}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Rear Anti-Roll Bar</Label>
                          <Input
                            value={getAccessoryValue(
                              "anti_roll_bar",
                              "rear",
                              "brand"
                            )}
                            onChange={(e) =>
                              handleAccessoryChange(
                                "anti_roll_bar",
                                "rear",
                                "brand",
                                e.target.value
                              )
                            }
                            placeholder="e.g., Whiteline"
                            disabled={isLoading}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Strut Braces */}
                    <div>
                      <h5 className="font-medium mb-2">Strut Braces</h5>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Front Strut Brace</Label>
                          <Input
                            value={getAccessoryValue(
                              "strut_brace",
                              "front",
                              "brand"
                            )}
                            onChange={(e) =>
                              handleAccessoryChange(
                                "strut_brace",
                                "front",
                                "brand",
                                e.target.value
                              )
                            }
                            placeholder="e.g., Cusco"
                            disabled={isLoading}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Rear Strut Brace</Label>
                          <Input
                            value={getAccessoryValue(
                              "strut_brace",
                              "rear",
                              "brand"
                            )}
                            onChange={(e) =>
                              handleAccessoryChange(
                                "strut_brace",
                                "rear",
                                "brand",
                                e.target.value
                              )
                            }
                            placeholder="e.g., Cusco"
                            disabled={isLoading}
                          />
                        </div>
                      </div>
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
