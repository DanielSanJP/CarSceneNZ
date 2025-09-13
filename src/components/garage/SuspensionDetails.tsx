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
import { useEffect } from "react";
import { CarSuspension } from "@/types/car";

// Component-specific data interfaces (without database metadata)
type SuspensionData = Omit<
  CarSuspension,
  "id" | "car_id" | "created_at" | "updated_at"
>;

interface SuspensionDetailsData {
  suspension?: SuspensionData[];
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
  // Basic cleanup on load - remove completely empty entries
  useEffect(() => {
    const suspension = data.suspension || [];
    if (suspension.length === 0) return;

    const cleanedSuspension = suspension.filter((s) => {
      // Keep entries that have at least one meaningful field
      const hasData =
        s.suspension_type ||
        s.suspension ||
        s.spring_rate ||
        s.strut_brace ||
        s.anti_roll_bar ||
        s.camber_degrees !== undefined ||
        s.caster_degrees ||
        s.toe_degrees;
      return hasData;
    });

    // Only update if something changed
    if (cleanedSuspension.length !== suspension.length) {
      onChange({ suspension: cleanedSuspension });
    }
  }, [data.suspension, onChange]);
  const handleSuspensionChange = (
    position: "front" | "rear" | "general",
    field: keyof SuspensionData,
    value: string | number
  ) => {
    const suspension = data.suspension || [];
    let updatedSuspension: SuspensionData[];

    if (field === "suspension_type" && position === "general") {
      // For general suspension type, update both front and rear entries
      updatedSuspension = [...suspension];

      ["front", "rear"].forEach((pos) => {
        const existingIndex = updatedSuspension.findIndex(
          (s) => s.position === pos
        );
        if (existingIndex >= 0) {
          updatedSuspension[existingIndex].suspension_type = value as string;
        } else {
          updatedSuspension.push({
            position: pos as "front" | "rear",
            suspension_type: value as string,
          });
        }
      });
    } else {
      // For position-specific changes
      const targetPosition = position === "general" ? undefined : position;
      const existingIndex = suspension.findIndex(
        (s) => s.position === targetPosition
      );

      if (existingIndex >= 0) {
        // Update existing entry
        updatedSuspension = [...suspension];
        updatedSuspension[existingIndex] = {
          ...updatedSuspension[existingIndex],
          [field]: value,
        };
      } else {
        // Create new entry
        updatedSuspension = [
          ...suspension,
          {
            position: targetPosition,
            [field]: value,
          } as SuspensionData,
        ];
      }
    }

    onChange({ suspension: updatedSuspension });
  };

  const getSuspensionValue = (
    position: "front" | "rear" | "general",
    field: keyof SuspensionData
  ): string | number => {
    const suspension = data.suspension || [];

    if (field === "suspension_type" && position === "general") {
      // For general suspension type, get it from any position entry
      const anyEntry = suspension.find((s) => s.position && s.suspension_type);
      return anyEntry?.suspension_type || "";
    }

    // For position-specific values
    const targetPosition = position === "general" ? undefined : position;
    const suspensionItem = suspension.find(
      (s) => s.position === targetPosition
    );
    return suspensionItem?.[field] || "";
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
                  <div className="space-y-2">
                    <Label htmlFor="suspension-type">Suspension Type</Label>
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
                  <div className="space-y-4">
                    {/* Suspension Components */}
                    <div>
                      <h5 className="font-medium mb-2">
                        Suspension Components
                      </h5>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Suspension</Label>
                          <Input
                            value={
                              getSuspensionValue(
                                "front",
                                "suspension"
                              ) as string
                            }
                            onChange={(e) =>
                              handleSuspensionChange(
                                "front",
                                "suspension",
                                e.target.value
                              )
                            }
                            placeholder="e.g., BC Racing BR Series"
                            disabled={isLoading}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Spring Rate</Label>
                          <Input
                            value={
                              getSuspensionValue(
                                "front",
                                "spring_rate"
                              ) as string
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
                    </div>

                    {/* Wheel Alignment */}
                    <div>
                      <h5 className="font-medium mb-2">Wheel Alignment</h5>
                      <div className="grid gap-4 md:grid-cols-3">
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
                              getSuspensionValue(
                                "front",
                                "toe_degrees"
                              ) as string
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

                    {/* Anti-Roll System */}
                    <div>
                      <h5 className="font-medium mb-2">Anti-Roll System</h5>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Anti-Roll Bar</Label>
                          <Input
                            value={
                              getSuspensionValue(
                                "front",
                                "anti_roll_bar"
                              ) as string
                            }
                            onChange={(e) =>
                              handleSuspensionChange(
                                "front",
                                "anti_roll_bar",
                                e.target.value
                              )
                            }
                            placeholder="e.g., Whiteline"
                            disabled={isLoading}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Strut Brace</Label>
                          <Input
                            value={
                              getSuspensionValue(
                                "front",
                                "strut_brace"
                              ) as string
                            }
                            onChange={(e) =>
                              handleSuspensionChange(
                                "front",
                                "strut_brace",
                                e.target.value
                              )
                            }
                            placeholder="e.g., STI"
                            disabled={isLoading}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Rear Suspension */}
                <div>
                  <h4 className="font-medium mb-4">Rear Suspension</h4>
                  <div className="space-y-4">
                    {/* Suspension Components */}
                    <div>
                      <h5 className="font-medium mb-2">
                        Suspension Components
                      </h5>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Suspension</Label>
                          <Input
                            value={
                              getSuspensionValue("rear", "suspension") as string
                            }
                            onChange={(e) =>
                              handleSuspensionChange(
                                "rear",
                                "suspension",
                                e.target.value
                              )
                            }
                            placeholder="e.g., BC Racing BR Series"
                            disabled={isLoading}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Spring Rate</Label>
                          <Input
                            value={
                              getSuspensionValue(
                                "rear",
                                "spring_rate"
                              ) as string
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
                    </div>

                    {/* Wheel Alignment */}
                    <div>
                      <h5 className="font-medium mb-2">Wheel Alignment</h5>
                      <div className="grid gap-4 md:grid-cols-3">
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
                              getSuspensionValue(
                                "rear",
                                "toe_degrees"
                              ) as string
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
                              getSuspensionValue(
                                "rear",
                                "caster_degrees"
                              ) as string
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

                    {/* Anti-Roll System */}
                    <div>
                      <h5 className="font-medium mb-2">Anti-Roll System</h5>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Anti-Roll Bar</Label>
                          <Input
                            value={
                              getSuspensionValue(
                                "rear",
                                "anti_roll_bar"
                              ) as string
                            }
                            onChange={(e) =>
                              handleSuspensionChange(
                                "rear",
                                "anti_roll_bar",
                                e.target.value
                              )
                            }
                            placeholder="e.g., Whiteline"
                            disabled={isLoading}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Strut Brace</Label>
                          <Input
                            value={
                              getSuspensionValue(
                                "rear",
                                "strut_brace"
                              ) as string
                            }
                            onChange={(e) =>
                              handleSuspensionChange(
                                "rear",
                                "strut_brace",
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

                <Separator />
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}
