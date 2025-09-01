"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface PerformanceModData {
  category: string; // 'weight_reduction', 'aero', 'chassis', 'cooling'
  modification: string;
  brand?: string;
  model?: string;
  description?: string;
}

interface PerformanceModsData {
  performance_mods?: PerformanceModData[];
}

interface PerformanceModsProps {
  data: PerformanceModsData;
  onChange: (updates: Partial<PerformanceModsData>) => void;
  isLoading?: boolean;
}

export default function PerformanceMods({
  data,
  onChange,
  isLoading,
}: PerformanceModsProps) {
  const handlePerformanceModChange = (
    category: string,
    modification: string,
    field: keyof Omit<PerformanceModData, "category" | "modification">,
    value: string
  ) => {
    const performanceMods = data.performance_mods || [];
    const existingModIndex = performanceMods.findIndex(
      (p) => p.category === category && p.modification === modification
    );

    let updatedPerformanceMods: PerformanceModData[];

    if (existingModIndex >= 0) {
      // Update existing mod
      updatedPerformanceMods = [...performanceMods];
      updatedPerformanceMods[existingModIndex] = {
        ...updatedPerformanceMods[existingModIndex],
        [field]: value,
      };
    } else if (value.trim()) {
      // Create new mod if value is not empty
      const newMod: PerformanceModData = {
        category,
        modification,
        [field]: value,
      };
      updatedPerformanceMods = [...performanceMods, newMod];
    } else {
      updatedPerformanceMods = performanceMods;
    }

    onChange({ performance_mods: updatedPerformanceMods });
  };

  // Helper function to handle comma-separated lists for multiple items in a category
  const handleCategoryListChange = (category: string, value: string) => {
    const performanceMods = data.performance_mods || [];

    // Remove existing mods in this category
    const filteredMods = performanceMods.filter((p) => p.category !== category);

    // Add new mods from comma-separated list
    const newMods: PerformanceModData[] = value
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item.length > 0)
      .map((item) => ({
        category,
        modification: item,
        description: item,
      }));

    const updatedPerformanceMods = [...filteredMods, ...newMods];
    onChange({ performance_mods: updatedPerformanceMods });
  };

  const getPerformanceModValue = (
    category: string,
    modification: string,
    field: keyof Omit<PerformanceModData, "category" | "modification">
  ): string => {
    const mod = data.performance_mods?.find(
      (p) => p.category === category && p.modification === modification
    );
    return mod?.[field] || "";
  };

  // Helper to get comma-separated list for a category
  const getCategoryList = (category: string): string => {
    const mods =
      data.performance_mods?.filter((p) => p.category === category) || [];
    return mods.map((mod) => mod.modification).join(", ");
  };

  return (
    <Card>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="performance-mods">
            <AccordionTrigger>Performance Modifications</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-6">
                {/* Weight Reduction */}
                <div>
                  <h4 className="font-medium mb-4">Weight Reduction</h4>
                  <div className="space-y-2">
                    <Label>Weight Reduction Modifications</Label>
                    <Textarea
                      value={getCategoryList("weight_reduction")}
                      onChange={(e) =>
                        handleCategoryListChange(
                          "weight_reduction",
                          e.target.value
                        )
                      }
                      placeholder="e.g., carbon fiber hood, lightweight wheels, stripped interior, aluminum radiator"
                      className="min-h-[80px]"
                      disabled={isLoading}
                    />
                    <p className="text-sm text-muted-foreground">
                      Separate multiple items with commas
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Aerodynamic Modifications */}
                <div>
                  <h4 className="font-medium mb-4">
                    Aerodynamic Modifications
                  </h4>
                  <div className="space-y-2">
                    <Label>Aero Modifications</Label>
                    <Textarea
                      value={getCategoryList("aero")}
                      onChange={(e) =>
                        handleCategoryListChange("aero", e.target.value)
                      }
                      placeholder="e.g., front splitter, rear diffuser, canards, side skirts, rear wing"
                      className="min-h-[80px]"
                      disabled={isLoading}
                    />
                    <p className="text-sm text-muted-foreground">
                      Separate multiple items with commas
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Chassis Modifications */}
                <div>
                  <h4 className="font-medium mb-4">Chassis Modifications</h4>
                  <div className="space-y-2">
                    <Label>Chassis Reinforcement</Label>
                    <Textarea
                      value={getCategoryList("chassis")}
                      onChange={(e) =>
                        handleCategoryListChange("chassis", e.target.value)
                      }
                      placeholder="e.g., seam welding, roll cage, strut tower brace, subframe connectors"
                      className="min-h-[80px]"
                      disabled={isLoading}
                    />
                    <p className="text-sm text-muted-foreground">
                      Separate multiple items with commas
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Cooling System */}
                <div>
                  <h4 className="font-medium mb-4">Cooling System Upgrades</h4>
                  <div className="space-y-2">
                    <Label>Cooling Modifications</Label>
                    <Textarea
                      value={getCategoryList("cooling")}
                      onChange={(e) =>
                        handleCategoryListChange("cooling", e.target.value)
                      }
                      placeholder="e.g., upgraded radiator, oil cooler, transmission cooler, electric fans"
                      className="min-h-[80px]"
                      disabled={isLoading}
                    />
                    <p className="text-sm text-muted-foreground">
                      Separate multiple items with commas
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Specific Performance Modifications */}
                <div>
                  <h4 className="font-medium mb-4">
                    Specific Performance Modifications
                  </h4>
                  <div className="space-y-4">
                    {/* Intake System */}
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Intake System Brand</Label>
                        <Input
                          value={getPerformanceModValue(
                            "intake",
                            "intake_system",
                            "brand"
                          )}
                          onChange={(e) =>
                            handlePerformanceModChange(
                              "intake",
                              "intake_system",
                              "brand",
                              e.target.value
                            )
                          }
                          placeholder="e.g., AEM"
                          disabled={isLoading}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Intake System Model</Label>
                        <Input
                          value={getPerformanceModValue(
                            "intake",
                            "intake_system",
                            "model"
                          )}
                          onChange={(e) =>
                            handlePerformanceModChange(
                              "intake",
                              "intake_system",
                              "model",
                              e.target.value
                            )
                          }
                          placeholder="e.g., Cold Air Intake"
                          disabled={isLoading}
                        />
                      </div>
                    </div>

                    {/* Exhaust System */}
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Exhaust System Brand</Label>
                        <Input
                          value={getPerformanceModValue(
                            "exhaust",
                            "exhaust_system",
                            "brand"
                          )}
                          onChange={(e) =>
                            handlePerformanceModChange(
                              "exhaust",
                              "exhaust_system",
                              "brand",
                              e.target.value
                            )
                          }
                          placeholder="e.g., Invidia"
                          disabled={isLoading}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Exhaust System Model</Label>
                        <Input
                          value={getPerformanceModValue(
                            "exhaust",
                            "exhaust_system",
                            "model"
                          )}
                          onChange={(e) =>
                            handlePerformanceModChange(
                              "exhaust",
                              "exhaust_system",
                              "model",
                              e.target.value
                            )
                          }
                          placeholder="e.g., N1 Cat-back"
                          disabled={isLoading}
                        />
                      </div>
                    </div>

                    {/* Turbo Upgrade */}
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Turbo Brand</Label>
                        <Input
                          value={getPerformanceModValue(
                            "forced_induction",
                            "turbo_upgrade",
                            "brand"
                          )}
                          onChange={(e) =>
                            handlePerformanceModChange(
                              "forced_induction",
                              "turbo_upgrade",
                              "brand",
                              e.target.value
                            )
                          }
                          placeholder="e.g., Garrett"
                          disabled={isLoading}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Turbo Model</Label>
                        <Input
                          value={getPerformanceModValue(
                            "forced_induction",
                            "turbo_upgrade",
                            "model"
                          )}
                          onChange={(e) =>
                            handlePerformanceModChange(
                              "forced_induction",
                              "turbo_upgrade",
                              "model",
                              e.target.value
                            )
                          }
                          placeholder="e.g., GT2860RS"
                          disabled={isLoading}
                        />
                      </div>
                    </div>

                    {/* Intercooler */}
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Intercooler Brand</Label>
                        <Input
                          value={getPerformanceModValue(
                            "forced_induction",
                            "intercooler",
                            "brand"
                          )}
                          onChange={(e) =>
                            handlePerformanceModChange(
                              "forced_induction",
                              "intercooler",
                              "brand",
                              e.target.value
                            )
                          }
                          placeholder="e.g., Process West"
                          disabled={isLoading}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Intercooler Model</Label>
                        <Input
                          value={getPerformanceModValue(
                            "forced_induction",
                            "intercooler",
                            "model"
                          )}
                          onChange={(e) =>
                            handlePerformanceModChange(
                              "forced_induction",
                              "intercooler",
                              "model",
                              e.target.value
                            )
                          }
                          placeholder="e.g., Verticooler"
                          disabled={isLoading}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Other Performance Modifications */}
                <div>
                  <h4 className="font-medium mb-4">
                    Other Performance Modifications
                  </h4>
                  <div className="space-y-2">
                    <Label>Additional Performance Mods</Label>
                    <Textarea
                      value={getPerformanceModValue(
                        "other",
                        "other_mods",
                        "description"
                      )}
                      onChange={(e) =>
                        handlePerformanceModChange(
                          "other",
                          "other_mods",
                          "description",
                          e.target.value
                        )
                      }
                      placeholder="e.g., nitrous system, water methanol injection, port and polish..."
                      className="min-h-[100px]"
                      disabled={isLoading}
                    />
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
