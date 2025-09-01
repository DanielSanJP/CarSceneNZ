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

interface InteriorData {
  category: string; // 'seats', 'audio', 'steering_wheel', 'gauges', 'roll_cage'
  position?: string; // 'front', 'rear', or null for general items
  brand?: string;
  model?: string;
  size?: string;
  description?: string;
}

interface InteriorModsData {
  interior?: InteriorData[];
}

interface InteriorModsProps {
  data: InteriorModsData;
  onChange: (updates: Partial<InteriorModsData>) => void;
  isLoading?: boolean;
}

export default function InteriorMods({
  data,
  onChange,
  isLoading,
}: InteriorModsProps) {
  const handleInteriorChange = (
    category: string,
    position: string | null,
    field: keyof Omit<InteriorData, "category">,
    value: string
  ) => {
    const interior = data.interior || [];
    const existingItemIndex = interior.findIndex(
      (i) => i.category === category && i.position === position
    );

    let updatedInterior: InteriorData[];

    if (existingItemIndex >= 0) {
      // Update existing item
      updatedInterior = [...interior];
      updatedInterior[existingItemIndex] = {
        ...updatedInterior[existingItemIndex],
        [field]: value,
      };
    } else if (value.trim()) {
      // Create new item if value is not empty
      const newItem: InteriorData = {
        category,
        position: position || undefined,
        [field]: value,
      };
      updatedInterior = [...interior, newItem];
    } else {
      updatedInterior = interior;
    }

    onChange({ interior: updatedInterior });
  };

  const getInteriorValue = (
    category: string,
    position: string | null,
    field: keyof Omit<InteriorData, "category">
  ): string => {
    const item = data.interior?.find(
      (i) => i.category === category && i.position === position
    );
    return item?.[field] || "";
  };

  return (
    <Card>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="interior-mods">
            <AccordionTrigger>Interior Modifications</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-6">
                {/* Seats */}
                <div>
                  <h4 className="font-medium mb-4">Seats</h4>
                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Front Seats Brand</Label>
                        <Input
                          value={getInteriorValue("seats", "front", "brand")}
                          onChange={(e) =>
                            handleInteriorChange(
                              "seats",
                              "front",
                              "brand",
                              e.target.value
                            )
                          }
                          placeholder="e.g., Recaro"
                          disabled={isLoading}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Front Seats Model</Label>
                        <Input
                          value={getInteriorValue("seats", "front", "model")}
                          onChange={(e) =>
                            handleInteriorChange(
                              "seats",
                              "front",
                              "model",
                              e.target.value
                            )
                          }
                          placeholder="e.g., SPG"
                          disabled={isLoading}
                        />
                      </div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Rear Seats Brand</Label>
                        <Input
                          value={getInteriorValue("seats", "rear", "brand")}
                          onChange={(e) =>
                            handleInteriorChange(
                              "seats",
                              "rear",
                              "brand",
                              e.target.value
                            )
                          }
                          placeholder="e.g., Stock"
                          disabled={isLoading}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Rear Seats Model</Label>
                        <Input
                          value={getInteriorValue("seats", "rear", "model")}
                          onChange={(e) =>
                            handleInteriorChange(
                              "seats",
                              "rear",
                              "model",
                              e.target.value
                            )
                          }
                          placeholder="e.g., Factory"
                          disabled={isLoading}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Steering Wheel */}
                <div>
                  <h4 className="font-medium mb-4">Steering Wheel</h4>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label>Brand</Label>
                      <Input
                        value={getInteriorValue(
                          "steering_wheel",
                          null,
                          "brand"
                        )}
                        onChange={(e) =>
                          handleInteriorChange(
                            "steering_wheel",
                            null,
                            "brand",
                            e.target.value
                          )
                        }
                        placeholder="e.g., Momo"
                        disabled={isLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Model</Label>
                      <Input
                        value={getInteriorValue(
                          "steering_wheel",
                          null,
                          "model"
                        )}
                        onChange={(e) =>
                          handleInteriorChange(
                            "steering_wheel",
                            null,
                            "model",
                            e.target.value
                          )
                        }
                        placeholder="e.g., Race"
                        disabled={isLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Size</Label>
                      <Input
                        value={getInteriorValue("steering_wheel", null, "size")}
                        onChange={(e) =>
                          handleInteriorChange(
                            "steering_wheel",
                            null,
                            "size",
                            e.target.value
                          )
                        }
                        placeholder="e.g., 350mm"
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Audio System */}
                <div>
                  <h4 className="font-medium mb-4">Audio System</h4>
                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Head Unit Brand</Label>
                        <Input
                          value={getInteriorValue(
                            "audio",
                            "head_unit",
                            "brand"
                          )}
                          onChange={(e) =>
                            handleInteriorChange(
                              "audio",
                              "head_unit",
                              "brand",
                              e.target.value
                            )
                          }
                          placeholder="e.g., Pioneer"
                          disabled={isLoading}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Head Unit Model</Label>
                        <Input
                          value={getInteriorValue(
                            "audio",
                            "head_unit",
                            "model"
                          )}
                          onChange={(e) =>
                            handleInteriorChange(
                              "audio",
                              "head_unit",
                              "model",
                              e.target.value
                            )
                          }
                          placeholder="e.g., AVH-Z5100DAB"
                          disabled={isLoading}
                        />
                      </div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Speakers</Label>
                        <Input
                          value={getInteriorValue("audio", "speakers", "brand")}
                          onChange={(e) =>
                            handleInteriorChange(
                              "audio",
                              "speakers",
                              "brand",
                              e.target.value
                            )
                          }
                          placeholder="e.g., JL Audio"
                          disabled={isLoading}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Subwoofer</Label>
                        <Input
                          value={getInteriorValue(
                            "audio",
                            "subwoofer",
                            "brand"
                          )}
                          onChange={(e) =>
                            handleInteriorChange(
                              "audio",
                              "subwoofer",
                              "brand",
                              e.target.value
                            )
                          }
                          placeholder="e.g., JL Audio 12W6v3"
                          disabled={isLoading}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Gauges */}
                <div>
                  <h4 className="font-medium mb-4">Gauges & Instrumentation</h4>
                  <div className="space-y-2">
                    <Label>Additional Gauges</Label>
                    <Textarea
                      value={getInteriorValue("gauges", null, "description")}
                      onChange={(e) =>
                        handleInteriorChange(
                          "gauges",
                          null,
                          "description",
                          e.target.value
                        )
                      }
                      placeholder="e.g., Defi boost gauge, oil pressure gauge, exhaust gas temperature..."
                      className="min-h-[80px]"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <Separator />

                {/* Roll Cage */}
                <div>
                  <h4 className="font-medium mb-4">Roll Cage</h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Brand</Label>
                      <Input
                        value={getInteriorValue("roll_cage", null, "brand")}
                        onChange={(e) =>
                          handleInteriorChange(
                            "roll_cage",
                            null,
                            "brand",
                            e.target.value
                          )
                        }
                        placeholder="e.g., Cusco"
                        disabled={isLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Material</Label>
                      <Input
                        value={getInteriorValue(
                          "roll_cage",
                          null,
                          "description"
                        )}
                        onChange={(e) =>
                          handleInteriorChange(
                            "roll_cage",
                            null,
                            "description",
                            e.target.value
                          )
                        }
                        placeholder="e.g., Chromoly steel"
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Dashboard & Trim */}
                <div>
                  <h4 className="font-medium mb-4">Dashboard & Trim</h4>
                  <div className="space-y-2">
                    <Label>Dashboard Modifications</Label>
                    <Input
                      value={getInteriorValue("dashboard", null, "description")}
                      onChange={(e) =>
                        handleInteriorChange(
                          "dashboard",
                          null,
                          "description",
                          e.target.value
                        )
                      }
                      placeholder="e.g., Carbon fiber trim"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <Separator />

                {/* Other Interior Modifications */}
                <div>
                  <h4 className="font-medium mb-4">
                    Other Interior Modifications
                  </h4>
                  <div className="space-y-2">
                    <Label>Additional Modifications</Label>
                    <Textarea
                      value={getInteriorValue("other", null, "description")}
                      onChange={(e) =>
                        handleInteriorChange(
                          "other",
                          null,
                          "description",
                          e.target.value
                        )
                      }
                      placeholder="e.g., Custom floor mats, shift knob, pedals, harnesses..."
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
