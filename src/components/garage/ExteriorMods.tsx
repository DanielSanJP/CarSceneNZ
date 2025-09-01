"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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

// Direct database structure interfaces
interface PaintFinishData {
  paint_color?: string;
  paint_finish?: string;
  wrap_brand?: string;
  wrap_color?: string;
}

interface LightingModificationsData {
  headlights?: string;
  taillights?: string;
  fog_lights?: string;
  underglow?: string;
  interior_lighting?: string;
}

interface BodykitModificationsData {
  front_bumper?: string;
  front_lip?: string;
  rear_bumper?: string;
  rear_lip?: string;
  side_skirts?: string;
  rear_spoiler?: string;
  diffuser?: string;
  fender_flares?: string;
  hood?: string;
}

interface ExteriorModsData {
  paint_finish?: PaintFinishData;
  lighting_modifications?: LightingModificationsData;
  bodykit_modifications?: BodykitModificationsData;
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
  // Auto-detect if should start in wrap mode based on existing data
  const hasWrapData = !!(
    data.paint_finish?.wrap_brand || data.paint_finish?.wrap_color
  );
  const hasPaintData = !!(
    data.paint_finish?.paint_color || data.paint_finish?.paint_finish
  );
  const [isWrap, setIsWrap] = useState(hasWrapData && !hasPaintData);

  const handlePaintFinishChange = (
    field: keyof PaintFinishData,
    value: string
  ) => {
    const updatedPaintFinish = {
      ...data.paint_finish,
      [field]: value,
    } as PaintFinishData;
    onChange({ paint_finish: updatedPaintFinish });
  };

  const handleLightingChange = (
    field: keyof LightingModificationsData,
    value: string
  ) => {
    const updatedLighting = {
      ...data.lighting_modifications,
      [field]: value,
    } as LightingModificationsData;
    onChange({ lighting_modifications: updatedLighting });
  };

  const handleBodykitChange = (
    field: keyof BodykitModificationsData,
    value: string
  ) => {
    const updatedBodykit = {
      ...data.bodykit_modifications,
      [field]: value,
    } as BodykitModificationsData;
    onChange({ bodykit_modifications: updatedBodykit });
  };

  return (
    <Card>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="exterior-mods">
            <AccordionTrigger>Exterior Modifications</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-6">
                {/* Paint & Finish */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium">Paint & Finish</h4>
                    <div className="flex items-center space-x-2">
                      <Label htmlFor="wrap-mode" className="text-sm">
                        Paint
                      </Label>
                      <Switch
                        id="wrap-mode"
                        checked={isWrap}
                        onCheckedChange={setIsWrap}
                        disabled={isLoading}
                      />
                      <Label htmlFor="wrap-mode" className="text-sm">
                        Wrap
                      </Label>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    {!isWrap ? (
                      // Paint fields
                      <>
                        <div className="space-y-2">
                          <Label>Paint Color</Label>
                          <Input
                            value={data.paint_finish?.paint_color || ""}
                            onChange={(e) =>
                              handlePaintFinishChange(
                                "paint_color",
                                e.target.value
                              )
                            }
                            placeholder="e.g., Championship White"
                            disabled={isLoading}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Finish Type</Label>
                          <Select
                            value={data.paint_finish?.paint_finish || ""}
                            onValueChange={(value) =>
                              handlePaintFinishChange("paint_finish", value)
                            }
                            disabled={isLoading}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select finish type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Gloss">Gloss</SelectItem>
                              <SelectItem value="Matte">Matte</SelectItem>
                              <SelectItem value="Satin">Satin</SelectItem>
                              <SelectItem value="Metallic">Metallic</SelectItem>
                              <SelectItem value="Pearl">Pearl</SelectItem>
                              <SelectItem value="Chrome">Chrome</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </>
                    ) : (
                      // Wrap fields
                      <>
                        <div className="space-y-2">
                          <Label>Wrap Brand</Label>
                          <Input
                            value={data.paint_finish?.wrap_brand || ""}
                            onChange={(e) =>
                              handlePaintFinishChange(
                                "wrap_brand",
                                e.target.value
                              )
                            }
                            placeholder="e.g., 3M, Avery Dennison"
                            disabled={isLoading}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Wrap Color</Label>
                          <Input
                            value={data.paint_finish?.wrap_color || ""}
                            onChange={(e) =>
                              handlePaintFinishChange(
                                "wrap_color",
                                e.target.value
                              )
                            }
                            placeholder="e.g., Matte Black"
                            disabled={isLoading}
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Body Kit */}
                <div>
                  <h4 className="font-medium mb-4">Body Kit</h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Front Bumper</Label>
                      <Input
                        value={data.bodykit_modifications?.front_bumper || ""}
                        onChange={(e) =>
                          handleBodykitChange("front_bumper", e.target.value)
                        }
                        placeholder="e.g., Mugen"
                        disabled={isLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Front Lip</Label>
                      <Input
                        value={data.bodykit_modifications?.front_lip || ""}
                        onChange={(e) =>
                          handleBodykitChange("front_lip", e.target.value)
                        }
                        placeholder="e.g., Carbon Fiber Lip"
                        disabled={isLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Rear Bumper</Label>
                      <Input
                        value={data.bodykit_modifications?.rear_bumper || ""}
                        onChange={(e) =>
                          handleBodykitChange("rear_bumper", e.target.value)
                        }
                        placeholder="e.g., Spoon Sports"
                        disabled={isLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Rear Lip</Label>
                      <Input
                        value={data.bodykit_modifications?.rear_lip || ""}
                        onChange={(e) =>
                          handleBodykitChange("rear_lip", e.target.value)
                        }
                        placeholder="e.g., Mugen Rear Lip"
                        disabled={isLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Side Skirts</Label>
                      <Input
                        value={data.bodykit_modifications?.side_skirts || ""}
                        onChange={(e) =>
                          handleBodykitChange("side_skirts", e.target.value)
                        }
                        placeholder="e.g., Mugen"
                        disabled={isLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Rear Spoiler</Label>
                      <Input
                        value={data.bodykit_modifications?.rear_spoiler || ""}
                        onChange={(e) =>
                          handleBodykitChange("rear_spoiler", e.target.value)
                        }
                        placeholder="e.g., Mugen"
                        disabled={isLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Diffuser</Label>
                      <Input
                        value={data.bodykit_modifications?.diffuser || ""}
                        onChange={(e) =>
                          handleBodykitChange("diffuser", e.target.value)
                        }
                        placeholder="e.g., Carbon Fiber Diffuser"
                        disabled={isLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Fender Flares</Label>
                      <Input
                        value={data.bodykit_modifications?.fender_flares || ""}
                        onChange={(e) =>
                          handleBodykitChange("fender_flares", e.target.value)
                        }
                        placeholder="e.g., Rocket Bunny"
                        disabled={isLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Hood</Label>
                      <Input
                        value={data.bodykit_modifications?.hood || ""}
                        onChange={(e) =>
                          handleBodykitChange("hood", e.target.value)
                        }
                        placeholder="e.g., Carbon Fiber Hood"
                        disabled={isLoading}
                      />
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
                        value={data.lighting_modifications?.headlights || ""}
                        onChange={(e) =>
                          handleLightingChange("headlights", e.target.value)
                        }
                        placeholder="e.g., Projector HID"
                        disabled={isLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Taillights</Label>
                      <Input
                        value={data.lighting_modifications?.taillights || ""}
                        onChange={(e) =>
                          handleLightingChange("taillights", e.target.value)
                        }
                        placeholder="e.g., LED"
                        disabled={isLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Underglow</Label>
                      <Input
                        value={data.lighting_modifications?.underglow || ""}
                        onChange={(e) =>
                          handleLightingChange("underglow", e.target.value)
                        }
                        placeholder="e.g., RGB LED Kit"
                        disabled={isLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Fog Lights</Label>
                      <Input
                        value={data.lighting_modifications?.fog_lights || ""}
                        onChange={(e) =>
                          handleLightingChange("fog_lights", e.target.value)
                        }
                        placeholder="e.g., LED Fog Lights"
                        disabled={isLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Interior Lighting</Label>
                      <Input
                        value={
                          data.lighting_modifications?.interior_lighting || ""
                        }
                        onChange={(e) =>
                          handleLightingChange(
                            "interior_lighting",
                            e.target.value
                          )
                        }
                        placeholder="e.g., RGB Ambient Kit"
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
