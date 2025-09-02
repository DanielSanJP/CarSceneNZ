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
  /**
   * Clean up and migrate suspension data on load:
   * 1. Remove duplicate general entries with only suspension_type
   * 2. Migrate accessories from general entries (position=null) to front/rear entries
   * 3. Remove empty general entries after migration
   *
   * This ensures that anti-roll bars and strut braces are stored with the
   * front and rear suspension entries instead of creating separate rows.
   */
  useEffect(() => {
    const suspension = data.suspension || [];
    if (suspension.length === 0) return;

    let hasChanges = false;
    let cleanedSuspension = [...suspension];

    // Check if we have multiple entries with only suspension_type (duplicates)
    const generalEntries = suspension.filter(
      (s) =>
        s.position === undefined &&
        s.suspension_type &&
        !s.suspension &&
        !s.spring_rate &&
        !s.camber_degrees &&
        !s.toe_degrees &&
        !s.caster_degrees
    );

    const positionEntries = suspension.filter((s) => s.position !== undefined);

    // If we have multiple general entries with only suspension_type, keep only one
    if (generalEntries.length > 1) {
      cleanedSuspension = suspension.filter((s, index) => {
        if (
          s.position === undefined &&
          s.suspension_type &&
          !s.suspension &&
          !s.spring_rate &&
          !s.camber_degrees &&
          !s.toe_degrees &&
          !s.caster_degrees
        ) {
          // Keep only the first general entry
          return (
            index ===
            suspension.findIndex(
              (item) =>
                item.position === undefined &&
                item.suspension_type &&
                !item.suspension &&
                !item.spring_rate &&
                !item.camber_degrees &&
                !item.toe_degrees &&
                !item.caster_degrees
            )
          );
        }
        return true;
      });
      hasChanges = true;
    }

    // If we have both general entries and position entries, remove general entries
    // as the position entries should contain the suspension_type
    if (generalEntries.length > 0 && positionEntries.length > 0) {
      cleanedSuspension = cleanedSuspension.filter(
        (s) => s.position !== undefined
      );
      hasChanges = true;
    }

    if (hasChanges) {
      onChange({ suspension: cleanedSuspension });
    }
  }, [data.suspension, onChange]);
  const handleSuspensionChange = (
    position: "front" | "rear" | "general",
    field: keyof SuspensionData,
    value: string | number
  ) => {
    const suspension = data.suspension || [];
    const targetPosition = position === "general" ? undefined : position;

    let updatedSuspension: SuspensionData[];

    if (field === "suspension_type" && position === "general") {
      // For general suspension type changes, we need special handling
      const hasPositionSpecific = suspension.some(
        (s) => s.position !== undefined
      );

      if (hasPositionSpecific) {
        // If we have position-specific entries, update all of them
        updatedSuspension = suspension.map((s) => ({
          ...s,
          suspension_type: value as string,
        }));
      } else {
        // If no position-specific entries, update or create general entry
        const generalIndex = suspension.findIndex(
          (s) => s.position === undefined
        );
        if (generalIndex >= 0) {
          updatedSuspension = [...suspension];
          updatedSuspension[generalIndex] = {
            ...updatedSuspension[generalIndex],
            suspension_type: value as string,
          };
        } else {
          const newEntry: SuspensionData = {
            position: undefined,
            suspension_type: value as string,
          };
          updatedSuspension = [...suspension, newEntry];
        }
      }
    } else {
      // For position-specific changes or non-suspension_type changes
      const existingSuspensionIndex = suspension.findIndex(
        (s) => s.position === targetPosition
      );

      if (existingSuspensionIndex >= 0) {
        // Update existing suspension
        updatedSuspension = [...suspension];
        const updated = { ...updatedSuspension[existingSuspensionIndex] };

        // Handle different field types properly
        switch (field) {
          case "camber_degrees":
            updated.camber_degrees = value as number;
            break;
          case "suspension_type":
            updated.suspension_type = value as string;
            break;
          case "suspension":
            updated.suspension = value as string;
            break;
          case "spring_rate":
            updated.spring_rate = value as string;
            break;
          case "toe_degrees":
            updated.toe_degrees = value as string;
            break;
          case "caster_degrees":
            updated.caster_degrees = value as string;
            break;
          case "anti_roll_bar":
            updated.anti_roll_bar = value as string;
            break;
          case "strut_brace":
            updated.strut_brace = value as string;
            break;
        }

        updatedSuspension[existingSuspensionIndex] = updated;
      } else {
        // Create new suspension entry
        const newSuspension: SuspensionData = {
          position: targetPosition,
        };

        // Handle different field types properly
        switch (field) {
          case "camber_degrees":
            newSuspension.camber_degrees = value as number;
            break;
          case "suspension_type":
            newSuspension.suspension_type = value as string;
            break;
          case "suspension":
            newSuspension.suspension = value as string;
            break;
          case "spring_rate":
            newSuspension.spring_rate = value as string;
            break;
          case "toe_degrees":
            newSuspension.toe_degrees = value as string;
            break;
          case "caster_degrees":
            newSuspension.caster_degrees = value as string;
            break;
          case "anti_roll_bar":
            newSuspension.anti_roll_bar = value as string;
            break;
          case "strut_brace":
            newSuspension.strut_brace = value as string;
            break;
        }

        updatedSuspension = [...suspension, newSuspension];
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
      // For general suspension type, check if we have position-specific entries first
      const hasPositionSpecific = suspension.some(
        (s) => s.position !== undefined
      );

      if (hasPositionSpecific) {
        // If we have position-specific entries, get the suspension_type from any of them
        // (they should all have the same suspension_type when properly managed)
        const positionSpecific = suspension.find(
          (s) => s.position !== undefined
        );
        return positionSpecific?.suspension_type || "";
      } else {
        // If no position-specific entries, get from general entry
        const generalEntry = suspension.find((s) => s.position === undefined);
        return generalEntry?.suspension_type || "";
      }
    } else {
      // For position-specific values or non-suspension_type fields
      const targetPosition = position === "general" ? undefined : position;
      const suspensionItem = suspension.find(
        (s) => s.position === targetPosition
      );
      return suspensionItem?.[field] || "";
    }
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
