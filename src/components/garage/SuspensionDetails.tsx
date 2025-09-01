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

interface SuspensionData {
  position?: "front" | "rear"; // nullable for general suspension_type
  suspension_type?: string; // 'coilovers', 'springs', 'air' etc.
  brand?: string;
  model?: string;
  spring_rate?: string;
  camber_degrees?: number;
  toe_degrees?: string;
  caster_degrees?: string;
  // Suspension accessories - direct fields
  front_anti_roll_bar?: string;
  rear_anti_roll_bar?: string;
  front_strut_brace?: string;
  rear_strut_brace?: string;
}

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
        !s.brand &&
        !s.model &&
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
          !s.brand &&
          !s.model &&
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
                !item.brand &&
                !item.model &&
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

    // Migrate accessories from general entries to position-specific entries
    const generalAccessoryEntry = cleanedSuspension.find(
      (s) =>
        s.position === undefined &&
        (s.front_anti_roll_bar ||
          s.rear_anti_roll_bar ||
          s.front_strut_brace ||
          s.rear_strut_brace)
    );

    if (generalAccessoryEntry) {
      // Ensure we have front and rear entries
      let frontEntry = cleanedSuspension.find((s) => s.position === "front");
      let rearEntry = cleanedSuspension.find((s) => s.position === "rear");

      if (!frontEntry) {
        frontEntry = { position: "front" };
        cleanedSuspension.push(frontEntry);
      }

      if (!rearEntry) {
        rearEntry = { position: "rear" };
        cleanedSuspension.push(rearEntry);
      }

      // Migrate accessories to both front and rear entries
      cleanedSuspension = cleanedSuspension.map((item) => {
        if (item.position === "front" || item.position === "rear") {
          return {
            ...item,
            front_anti_roll_bar:
              item.front_anti_roll_bar ||
              generalAccessoryEntry.front_anti_roll_bar,
            rear_anti_roll_bar:
              item.rear_anti_roll_bar ||
              generalAccessoryEntry.rear_anti_roll_bar,
            front_strut_brace:
              item.front_strut_brace || generalAccessoryEntry.front_strut_brace,
            rear_strut_brace:
              item.rear_strut_brace || generalAccessoryEntry.rear_strut_brace,
          };
        }
        return item;
      });

      // Remove the general entry with accessories if it has no other data
      cleanedSuspension = cleanedSuspension.filter((item) => {
        if (item.position === undefined) {
          const hasNonAccessoryData =
            item.suspension_type ||
            item.brand ||
            item.model ||
            item.spring_rate ||
            item.camber_degrees !== undefined ||
            item.toe_degrees ||
            item.caster_degrees;
          return hasNonAccessoryData;
        }
        return true;
      });

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
          case "brand":
            updated.brand = value as string;
            break;
          case "model":
            updated.model = value as string;
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
          case "front_anti_roll_bar":
            updated.front_anti_roll_bar = value as string;
            break;
          case "rear_anti_roll_bar":
            updated.rear_anti_roll_bar = value as string;
            break;
          case "front_strut_brace":
            updated.front_strut_brace = value as string;
            break;
          case "rear_strut_brace":
            updated.rear_strut_brace = value as string;
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
          case "brand":
            newSuspension.brand = value as string;
            break;
          case "model":
            newSuspension.model = value as string;
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
          case "front_anti_roll_bar":
            newSuspension.front_anti_roll_bar = value as string;
            break;
          case "rear_anti_roll_bar":
            newSuspension.rear_anti_roll_bar = value as string;
            break;
          case "front_strut_brace":
            newSuspension.front_strut_brace = value as string;
            break;
          case "rear_strut_brace":
            newSuspension.rear_strut_brace = value as string;
            break;
        }

        updatedSuspension = [...suspension, newSuspension];
      }
    }

    onChange({ suspension: updatedSuspension });
  };

  /**
   * Handle changes to suspension accessories (anti-roll bars and strut braces).
   * These accessories are stored with both front and rear suspension entries
   * to avoid creating separate database rows with position=null.
   */
  const handleAccessoryChange = (
    accessoryField: keyof SuspensionData,
    value: string
  ) => {
    const suspension = data.suspension || [];
    let updatedSuspension = [...suspension];

    // Determine which suspension entries need the accessory
    const isGlobalAccessory =
      accessoryField === "front_anti_roll_bar" ||
      accessoryField === "rear_anti_roll_bar" ||
      accessoryField === "front_strut_brace" ||
      accessoryField === "rear_strut_brace";

    if (isGlobalAccessory) {
      // These accessories should be stored with the appropriate position entries
      // If we don't have position entries yet, we need to handle this differently
      const frontIndex = updatedSuspension.findIndex(
        (s) => s.position === "front"
      );
      const rearIndex = updatedSuspension.findIndex(
        (s) => s.position === "rear"
      );

      // Always ensure we have front and rear entries for accessories
      if (frontIndex === -1) {
        updatedSuspension.push({ position: "front" });
      }
      if (rearIndex === -1) {
        updatedSuspension.push({ position: "rear" });
      }

      // Update both front and rear entries with the accessory
      updatedSuspension = updatedSuspension.map((item) => {
        if (item.position === "front" || item.position === "rear") {
          return {
            ...item,
            [accessoryField]: value,
          };
        }
        return item;
      });

      // Remove any general entries that only contain accessories
      updatedSuspension = updatedSuspension.filter((item) => {
        if (item.position === undefined) {
          // Keep general entries if they have suspension data beyond just accessories
          const hasNonAccessoryData =
            item.suspension_type ||
            item.brand ||
            item.model ||
            item.spring_rate ||
            item.camber_degrees !== undefined ||
            item.toe_degrees ||
            item.caster_degrees;
          return hasNonAccessoryData;
        }
        return true;
      });
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

  /**
   * Get accessory values from front or rear suspension entries.
   * Accessories are now stored with position-specific entries rather than
   * in separate general entries with position=null.
   */
  const getAccessoryValue = (accessoryField: keyof SuspensionData): string => {
    const suspension = data.suspension || [];

    // First try to get from front or rear entries
    const frontEntry = suspension.find((s) => s.position === "front");
    const rearEntry = suspension.find((s) => s.position === "rear");

    // Return value from either front or rear entry (they should be the same for accessories)
    if (frontEntry?.[accessoryField]) {
      return frontEntry[accessoryField] as string;
    }

    if (rearEntry?.[accessoryField]) {
      return rearEntry[accessoryField] as string;
    }

    // Fallback: check general entry for backward compatibility
    const generalEntry = suspension.find((s) => s.position === undefined);
    return (generalEntry?.[accessoryField] as string) || "";
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
                            value={getAccessoryValue("front_anti_roll_bar")}
                            onChange={(e) =>
                              handleAccessoryChange(
                                "front_anti_roll_bar",
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
                            value={getAccessoryValue("rear_anti_roll_bar")}
                            onChange={(e) =>
                              handleAccessoryChange(
                                "rear_anti_roll_bar",
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
                            value={getAccessoryValue("front_strut_brace")}
                            onChange={(e) =>
                              handleAccessoryChange(
                                "front_strut_brace",
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
                            value={getAccessoryValue("rear_strut_brace")}
                            onChange={(e) =>
                              handleAccessoryChange(
                                "rear_strut_brace",
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
