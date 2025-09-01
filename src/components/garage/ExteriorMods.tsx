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
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface ExteriorData {
  category: string; // 'body_kit', 'paint', 'lighting'
  component?: string; // 'front_bumper', 'rear_bumper', 'headlights', etc.
  brand?: string;
  model?: string;
  color?: string;
  type?: string;
  finish?: string;
  description?: string;
}

interface ExteriorModsData {
  exterior?: ExteriorData[];
}

interface ExteriorModsProps {
  data: ExteriorModsData;
  onChange: (updates: Partial<ExteriorModsData>) => void;
  isLoading?: boolean;
}

export default function ExteriorMods({
  data,
  onChange,
  isLoading,
}: ExteriorModsProps) {
  const handleExteriorChange = (
    category: string,
    component: string | null,
    field: keyof Omit<ExteriorData, "category">,
    value: string
  ) => {
    const exterior = data.exterior || [];
    const existingItemIndex = exterior.findIndex(
      (e) => e.category === category && e.component === component
    );

    let updatedExterior: ExteriorData[];

    if (existingItemIndex >= 0) {
      // Update existing item
      updatedExterior = [...exterior];
      updatedExterior[existingItemIndex] = {
        ...updatedExterior[existingItemIndex],
        [field]: value,
      };
    } else if (value.trim()) {
      // Create new item if value is not empty
      const newItem: ExteriorData = {
        category,
        component: component || undefined,
        [field]: value,
      };
      updatedExterior = [...exterior, newItem];
    } else {
      updatedExterior = exterior;
    }

    onChange({ exterior: updatedExterior });
  };

  const getExteriorValue = (
    category: string,
    component: string | null,
    field: keyof Omit<ExteriorData, "category">
  ): string => {
    const item = data.exterior?.find(
      (e) => e.category === category && e.component === component
    );
    return item?.[field] || "";
  };

  return (
    <Card>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="exterior-mods">
            <AccordionTrigger>Exterior Modifications</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-6">
                {/* Paint */}
                <div>
                  <h4 className="font-medium mb-4">Paint & Finish</h4>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label>Paint Color</Label>
                      <Input
                        value={getExteriorValue("paint", null, "color")}
                        onChange={(e) =>
                          handleExteriorChange(
                            "paint",
                            null,
                            "color",
                            e.target.value
                          )
                        }
                        placeholder="e.g., World Rally Blue"
                        disabled={isLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Paint Type</Label>
                      <Select
                        value={getExteriorValue("paint", null, "type")}
                        onValueChange={(value) =>
                          handleExteriorChange("paint", null, "type", value)
                        }
                        disabled={isLoading}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select paint type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="metallic">Metallic</SelectItem>
                          <SelectItem value="pearl">Pearl</SelectItem>
                          <SelectItem value="matte">Matte</SelectItem>
                          <SelectItem value="satin">Satin</SelectItem>
                          <SelectItem value="gloss">Gloss</SelectItem>
                          <SelectItem value="factory">Factory</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Finish</Label>
                      <Input
                        value={getExteriorValue("paint", null, "finish")}
                        onChange={(e) =>
                          handleExteriorChange(
                            "paint",
                            null,
                            "finish",
                            e.target.value
                          )
                        }
                        placeholder="e.g., Clear coat"
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Body Kit */}
                <div>
                  <h4 className="font-medium mb-4">Body Kit</h4>
                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Front Bumper</Label>
                        <Input
                          value={getExteriorValue(
                            "body_kit",
                            "front_bumper",
                            "brand"
                          )}
                          onChange={(e) =>
                            handleExteriorChange(
                              "body_kit",
                              "front_bumper",
                              "brand",
                              e.target.value
                            )
                          }
                          placeholder="e.g., STI"
                          disabled={isLoading}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Rear Bumper</Label>
                        <Input
                          value={getExteriorValue(
                            "body_kit",
                            "rear_bumper",
                            "brand"
                          )}
                          onChange={(e) =>
                            handleExteriorChange(
                              "body_kit",
                              "rear_bumper",
                              "brand",
                              e.target.value
                            )
                          }
                          placeholder="e.g., STI"
                          disabled={isLoading}
                        />
                      </div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Side Skirts</Label>
                        <Input
                          value={getExteriorValue(
                            "body_kit",
                            "side_skirts",
                            "brand"
                          )}
                          onChange={(e) =>
                            handleExteriorChange(
                              "body_kit",
                              "side_skirts",
                              "brand",
                              e.target.value
                            )
                          }
                          placeholder="e.g., STI"
                          disabled={isLoading}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Rear Wing/Spoiler</Label>
                        <Input
                          value={getExteriorValue(
                            "body_kit",
                            "rear_wing",
                            "brand"
                          )}
                          onChange={(e) =>
                            handleExteriorChange(
                              "body_kit",
                              "rear_wing",
                              "brand",
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

                <Separator />

                {/* Lighting */}
                <div>
                  <h4 className="font-medium mb-4">Lighting Modifications</h4>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label>Headlights</Label>
                      <Input
                        value={getExteriorValue(
                          "lighting",
                          "headlights",
                          "brand"
                        )}
                        onChange={(e) =>
                          handleExteriorChange(
                            "lighting",
                            "headlights",
                            "brand",
                            e.target.value
                          )
                        }
                        placeholder="e.g., Spec-D"
                        disabled={isLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Taillights</Label>
                      <Input
                        value={getExteriorValue(
                          "lighting",
                          "taillights",
                          "brand"
                        )}
                        onChange={(e) =>
                          handleExteriorChange(
                            "lighting",
                            "taillights",
                            "brand",
                            e.target.value
                          )
                        }
                        placeholder="e.g., Spec-D"
                        disabled={isLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Indicators</Label>
                      <Input
                        value={getExteriorValue(
                          "lighting",
                          "indicators",
                          "brand"
                        )}
                        onChange={(e) =>
                          handleExteriorChange(
                            "lighting",
                            "indicators",
                            "brand",
                            e.target.value
                          )
                        }
                        placeholder="e.g., LED"
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Aero Modifications */}
                <div>
                  <h4 className="font-medium mb-4">
                    Aerodynamic Modifications
                  </h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Front Splitter</Label>
                      <Input
                        value={getExteriorValue(
                          "aero",
                          "front_splitter",
                          "brand"
                        )}
                        onChange={(e) =>
                          handleExteriorChange(
                            "aero",
                            "front_splitter",
                            "brand",
                            e.target.value
                          )
                        }
                        placeholder="e.g., APR Performance"
                        disabled={isLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Rear Diffuser</Label>
                      <Input
                        value={getExteriorValue(
                          "aero",
                          "rear_diffuser",
                          "brand"
                        )}
                        onChange={(e) =>
                          handleExteriorChange(
                            "aero",
                            "rear_diffuser",
                            "brand",
                            e.target.value
                          )
                        }
                        placeholder="e.g., APR Performance"
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Other Exterior Modifications */}
                <div>
                  <h4 className="font-medium mb-4">
                    Other Exterior Modifications
                  </h4>
                  <div className="space-y-2">
                    <Label>Additional Modifications</Label>
                    <Textarea
                      value={getExteriorValue("other", null, "description")}
                      onChange={(e) =>
                        handleExteriorChange(
                          "other",
                          null,
                          "description",
                          e.target.value
                        )
                      }
                      placeholder="e.g., Window tinting, carbon fiber hood, fender flares..."
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
