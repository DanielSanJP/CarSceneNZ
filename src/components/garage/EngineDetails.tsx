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

// Define types that work with both database and form data
interface EngineData {
  engine_code?: string;
  displacement?: string;
  aspiration?: string;
  power_hp?: number;
  torque_nm?: number;
}

interface EngineModificationData {
  component: string;
  subcomponent?: string;
  brand?: string;
  model?: string;
  description?: string;
  is_custom?: boolean;
  tuned_by?: string;
}

interface EngineDetailsData {
  engine?: EngineData;
  engine_modifications?: EngineModificationData[];
}

interface EngineDetailsProps {
  data: EngineDetailsData;
  onChange: (updates: Partial<EngineDetailsData>) => void;
  isLoading?: boolean;
}

export default function EngineDetails({
  data,
  onChange,
  isLoading,
}: EngineDetailsProps) {
  const handleEngineChange = (
    field: keyof EngineData,
    value: string | number
  ) => {
    const updatedEngine = {
      ...data.engine,
      [field]: value,
    } as EngineData;
    onChange({ engine: updatedEngine });
  };

  const handleModificationChange = (
    component: string,
    subcomponent: string | null,
    field: string,
    value: string
  ) => {
    const modifications = data.engine_modifications || [];
    const existingModIndex = modifications.findIndex(
      (mod) => mod.component === component && mod.subcomponent === subcomponent
    );

    let updatedModifications: EngineModificationData[];

    if (existingModIndex >= 0) {
      // Update existing modification
      updatedModifications = [...modifications];
      updatedModifications[existingModIndex] = {
        ...updatedModifications[existingModIndex],
        [field]: value,
      };
    } else if (value.trim()) {
      // Create new modification if value is not empty
      const newMod: EngineModificationData = {
        component,
        subcomponent: subcomponent || undefined,
        [field]: value,
        is_custom: false,
      };
      updatedModifications = [...modifications, newMod];
    } else {
      updatedModifications = modifications;
    }

    onChange({ engine_modifications: updatedModifications });
  };

  const getModificationValue = (
    component: string,
    subcomponent: string | null,
    field: string
  ): string => {
    const mod = data.engine_modifications?.find(
      (m) => m.component === component && m.subcomponent === subcomponent
    );
    return (mod?.[field as keyof EngineModificationData] as string) || "";
  };

  return (
    <Card>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="engine-details">
            <AccordionTrigger>Engine Details</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-6">
                {/* Basic Engine Info */}
                <div>
                  <h4 className="font-medium mb-4">Engine Specifications</h4>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <div className="space-y-2">
                      <Label>Engine Code</Label>
                      <Input
                        value={data.engine?.engine_code || ""}
                        onChange={(e) =>
                          handleEngineChange("engine_code", e.target.value)
                        }
                        placeholder="e.g., EJ257"
                        disabled={isLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Displacement</Label>
                      <Input
                        value={data.engine?.displacement || ""}
                        onChange={(e) =>
                          handleEngineChange("displacement", e.target.value)
                        }
                        placeholder="e.g., 2.5L"
                        disabled={isLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Aspiration</Label>
                      <Select
                        value={data.engine?.aspiration || ""}
                        onValueChange={(value) =>
                          handleEngineChange("aspiration", value)
                        }
                        disabled={isLoading}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select aspiration" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="naturally_aspirated">
                            Naturally Aspirated
                          </SelectItem>
                          <SelectItem value="turbocharged">
                            Turbocharged
                          </SelectItem>
                          <SelectItem value="supercharged">
                            Supercharged
                          </SelectItem>
                          <SelectItem value="twin_turbo">Twin Turbo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Power (HP)</Label>
                      <Input
                        type="number"
                        value={data.engine?.power_hp || ""}
                        onChange={(e) =>
                          handleEngineChange(
                            "power_hp",
                            parseInt(e.target.value) || 0
                          )
                        }
                        placeholder="e.g., 300"
                        disabled={isLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Torque (Nm)</Label>
                      <Input
                        type="number"
                        value={data.engine?.torque_nm || ""}
                        onChange={(e) =>
                          handleEngineChange(
                            "torque_nm",
                            parseInt(e.target.value) || 0
                          )
                        }
                        placeholder="e.g., 407"
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Engine Modifications */}
                <div>
                  <h4 className="font-medium mb-4">Engine Modifications</h4>
                  <div className="space-y-4">
                    {/* Turbo/Supercharger */}
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Turbo Brand</Label>
                        <Input
                          value={getModificationValue("turbo", null, "brand")}
                          onChange={(e) =>
                            handleModificationChange(
                              "turbo",
                              null,
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
                          value={getModificationValue("turbo", null, "model")}
                          onChange={(e) =>
                            handleModificationChange(
                              "turbo",
                              null,
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
                          value={getModificationValue(
                            "intercooler",
                            null,
                            "brand"
                          )}
                          onChange={(e) =>
                            handleModificationChange(
                              "intercooler",
                              null,
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
                          value={getModificationValue(
                            "intercooler",
                            null,
                            "model"
                          )}
                          onChange={(e) =>
                            handleModificationChange(
                              "intercooler",
                              null,
                              "model",
                              e.target.value
                            )
                          }
                          placeholder="e.g., Verticooler"
                          disabled={isLoading}
                        />
                      </div>
                    </div>

                    {/* Exhaust System */}
                    <div>
                      <h5 className="font-medium mb-2">Exhaust System</h5>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Header Brand</Label>
                          <Input
                            value={getModificationValue(
                              "exhaust",
                              "header",
                              "brand"
                            )}
                            onChange={(e) =>
                              handleModificationChange(
                                "exhaust",
                                "header",
                                "brand",
                                e.target.value
                              )
                            }
                            placeholder="e.g., Tomei"
                            disabled={isLoading}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Catback Brand</Label>
                          <Input
                            value={getModificationValue(
                              "exhaust",
                              "catback",
                              "brand"
                            )}
                            onChange={(e) =>
                              handleModificationChange(
                                "exhaust",
                                "catback",
                                "brand",
                                e.target.value
                              )
                            }
                            placeholder="e.g., Invidia"
                            disabled={isLoading}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Intake */}
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Intake Brand</Label>
                        <Input
                          value={getModificationValue("intake", null, "brand")}
                          onChange={(e) =>
                            handleModificationChange(
                              "intake",
                              null,
                              "brand",
                              e.target.value
                            )
                          }
                          placeholder="e.g., AEM"
                          disabled={isLoading}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Intake Model</Label>
                        <Input
                          value={getModificationValue("intake", null, "model")}
                          onChange={(e) =>
                            handleModificationChange(
                              "intake",
                              null,
                              "model",
                              e.target.value
                            )
                          }
                          placeholder="e.g., Cold Air Intake"
                          disabled={isLoading}
                        />
                      </div>
                    </div>

                    {/* ECU */}
                    <div>
                      <h5 className="font-medium mb-2">Engine Management</h5>
                      <div className="grid gap-4 md:grid-cols-3">
                        <div className="space-y-2">
                          <Label>ECU Brand</Label>
                          <Input
                            value={getModificationValue("ecu", null, "brand")}
                            onChange={(e) =>
                              handleModificationChange(
                                "ecu",
                                null,
                                "brand",
                                e.target.value
                              )
                            }
                            placeholder="e.g., Cobb"
                            disabled={isLoading}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>ECU Model</Label>
                          <Input
                            value={getModificationValue("ecu", null, "model")}
                            onChange={(e) =>
                              handleModificationChange(
                                "ecu",
                                null,
                                "model",
                                e.target.value
                              )
                            }
                            placeholder="e.g., Accessport V3"
                            disabled={isLoading}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Tuned By</Label>
                          <Input
                            value={getModificationValue(
                              "ecu",
                              null,
                              "tuned_by"
                            )}
                            onChange={(e) =>
                              handleModificationChange(
                                "ecu",
                                null,
                                "tuned_by",
                                e.target.value
                              )
                            }
                            placeholder="e.g., ProTune"
                            disabled={isLoading}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Internal Engine Components */}
                    <div>
                      <h5 className="font-medium mb-2">Internal Components</h5>
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <div className="space-y-2">
                          <Label>Pistons</Label>
                          <Input
                            value={getModificationValue(
                              "internals",
                              "pistons",
                              "brand"
                            )}
                            onChange={(e) =>
                              handleModificationChange(
                                "internals",
                                "pistons",
                                "brand",
                                e.target.value
                              )
                            }
                            placeholder="e.g., Manley"
                            disabled={isLoading}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Connecting Rods</Label>
                          <Input
                            value={getModificationValue(
                              "internals",
                              "rods",
                              "brand"
                            )}
                            onChange={(e) =>
                              handleModificationChange(
                                "internals",
                                "rods",
                                "brand",
                                e.target.value
                              )
                            }
                            placeholder="e.g., Manley"
                            disabled={isLoading}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Valves</Label>
                          <Input
                            value={getModificationValue(
                              "internals",
                              "valves",
                              "brand"
                            )}
                            onChange={(e) =>
                              handleModificationChange(
                                "internals",
                                "valves",
                                "brand",
                                e.target.value
                              )
                            }
                            placeholder="e.g., Supertech"
                            disabled={isLoading}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Valve Springs</Label>
                          <Input
                            value={getModificationValue(
                              "internals",
                              "springs",
                              "brand"
                            )}
                            onChange={(e) =>
                              handleModificationChange(
                                "internals",
                                "springs",
                                "brand",
                                e.target.value
                              )
                            }
                            placeholder="e.g., Supertech"
                            disabled={isLoading}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Camshafts</Label>
                          <Input
                            value={getModificationValue(
                              "internals",
                              "cams",
                              "brand"
                            )}
                            onChange={(e) =>
                              handleModificationChange(
                                "internals",
                                "cams",
                                "brand",
                                e.target.value
                              )
                            }
                            placeholder="e.g., Kelford"
                            disabled={isLoading}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Fuel System */}
                    <div>
                      <h5 className="font-medium mb-2">Fuel System</h5>
                      <div className="grid gap-4 md:grid-cols-3">
                        <div className="space-y-2">
                          <Label>Fuel Injectors</Label>
                          <Input
                            value={getModificationValue(
                              "fuel_system",
                              "injectors",
                              "brand"
                            )}
                            onChange={(e) =>
                              handleModificationChange(
                                "fuel_system",
                                "injectors",
                                "brand",
                                e.target.value
                              )
                            }
                            placeholder="e.g., ID1050X"
                            disabled={isLoading}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Fuel Pump</Label>
                          <Input
                            value={getModificationValue(
                              "fuel_system",
                              "fuel_pump",
                              "brand"
                            )}
                            onChange={(e) =>
                              handleModificationChange(
                                "fuel_system",
                                "fuel_pump",
                                "brand",
                                e.target.value
                              )
                            }
                            placeholder="e.g., DeatschWerks"
                            disabled={isLoading}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Fuel Rail</Label>
                          <Input
                            value={getModificationValue(
                              "fuel_system",
                              "fuel_rail",
                              "brand"
                            )}
                            onChange={(e) =>
                              handleModificationChange(
                                "fuel_system",
                                "fuel_rail",
                                "brand",
                                e.target.value
                              )
                            }
                            placeholder="e.g., Radium"
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
