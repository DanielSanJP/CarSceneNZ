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
import type {
  CarEngine,
  CarTurboSystem,
  CarExhaustSystem,
  CarEngineManagement,
  CarInternalComponents,
  CarFuelSystem,
} from "@/types/car";

// Component-specific data interfaces (without database metadata)
type EngineData = Omit<
  CarEngine,
  "id" | "car_id" | "created_at" | "updated_at"
>;
type TurboSystemData = Omit<
  CarTurboSystem,
  "id" | "car_id" | "created_at" | "updated_at"
>;
type ExhaustSystemData = Omit<
  CarExhaustSystem,
  "id" | "car_id" | "created_at" | "updated_at"
>;
type EngineManagementData = Omit<
  CarEngineManagement,
  "id" | "car_id" | "created_at" | "updated_at"
>;
type InternalComponentsData = Omit<
  CarInternalComponents,
  "id" | "car_id" | "created_at" | "updated_at"
>;
type FuelSystemData = Omit<
  CarFuelSystem,
  "id" | "car_id" | "created_at" | "updated_at"
>;

interface EngineDetailsData {
  engine?: EngineData;
  turbo_system?: TurboSystemData;
  exhaust_system?: ExhaustSystemData;
  engine_management?: EngineManagementData;
  internal_components?: InternalComponentsData;
  fuel_system?: FuelSystemData;
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

  const handleTurboSystemChange = (
    field: keyof TurboSystemData,
    value: string
  ) => {
    const updatedTurboSystem = {
      ...data.turbo_system,
      [field]: value,
    } as TurboSystemData;
    onChange({ turbo_system: updatedTurboSystem });
  };

  const handleExhaustSystemChange = (
    field: keyof ExhaustSystemData,
    value: string
  ) => {
    const updatedExhaustSystem = {
      ...data.exhaust_system,
      [field]: value,
    } as ExhaustSystemData;
    onChange({ exhaust_system: updatedExhaustSystem });
  };

  const handleEngineManagementChange = (
    field: keyof EngineManagementData,
    value: string
  ) => {
    const updatedEngineManagement = {
      ...data.engine_management,
      [field]: value,
    } as EngineManagementData;
    onChange({ engine_management: updatedEngineManagement });
  };

  const handleInternalComponentsChange = (
    field: keyof InternalComponentsData,
    value: string
  ) => {
    const updatedInternalComponents = {
      ...data.internal_components,
      [field]: value,
    } as InternalComponentsData;
    onChange({ internal_components: updatedInternalComponents });
  };

  const handleFuelSystemChange = (
    field: keyof FuelSystemData,
    value: string
  ) => {
    const updatedFuelSystem = {
      ...data.fuel_system,
      [field]: value,
    } as FuelSystemData;
    onChange({ fuel_system: updatedFuelSystem });
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
                        <Label>Turbo</Label>
                        <Input
                          value={data.turbo_system?.turbo || ""}
                          onChange={(e) =>
                            handleTurboSystemChange("turbo", e.target.value)
                          }
                          placeholder="e.g., Garrett GT2860RS"
                          disabled={isLoading}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Intercooler</Label>
                        <Input
                          value={data.turbo_system?.intercooler || ""}
                          onChange={(e) =>
                            handleTurboSystemChange(
                              "intercooler",
                              e.target.value
                            )
                          }
                          placeholder="e.g., Process West Verticooler"
                          disabled={isLoading}
                        />
                      </div>
                    </div>

                    {/* Exhaust System */}
                    <div>
                      <h5 className="font-medium mb-2">Exhaust System</h5>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Header</Label>
                          <Input
                            value={data.exhaust_system?.header || ""}
                            onChange={(e) =>
                              handleExhaustSystemChange(
                                "header",
                                e.target.value
                              )
                            }
                            placeholder="e.g., XForce Performance Headers"
                            disabled={isLoading}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Exhaust</Label>
                          <Input
                            value={data.exhaust_system?.exhaust || ""}
                            onChange={(e) =>
                              handleExhaustSystemChange(
                                "exhaust",
                                e.target.value
                              )
                            }
                            placeholder="e.g., Tomei Expreme Ti"
                            disabled={isLoading}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Intake */}
                    <div className="space-y-2">
                      <Label>Intake</Label>
                      <Input
                        value={data.exhaust_system?.intake || ""}
                        onChange={(e) =>
                          handleExhaustSystemChange("intake", e.target.value)
                        }
                        placeholder="e.g., AEM Cold Air Intake"
                        disabled={isLoading}
                      />
                    </div>

                    {/* ECU */}
                    <div>
                      <h5 className="font-medium mb-2">Engine Management</h5>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>ECU</Label>
                          <Input
                            value={data.engine_management?.ecu || ""}
                            onChange={(e) =>
                              handleEngineManagementChange(
                                "ecu",
                                e.target.value
                              )
                            }
                            placeholder="e.g., Cobb Accessport V3"
                            disabled={isLoading}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Tuned By</Label>
                          <Input
                            value={data.engine_management?.tuned_by || ""}
                            onChange={(e) =>
                              handleEngineManagementChange(
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
                            value={data.internal_components?.pistons || ""}
                            onChange={(e) =>
                              handleInternalComponentsChange(
                                "pistons",
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
                            value={
                              data.internal_components?.connecting_rods || ""
                            }
                            onChange={(e) =>
                              handleInternalComponentsChange(
                                "connecting_rods",
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
                            value={data.internal_components?.valves || ""}
                            onChange={(e) =>
                              handleInternalComponentsChange(
                                "valves",
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
                            value={
                              data.internal_components?.valve_springs || ""
                            }
                            onChange={(e) =>
                              handleInternalComponentsChange(
                                "valve_springs",
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
                            value={data.internal_components?.camshafts || ""}
                            onChange={(e) =>
                              handleInternalComponentsChange(
                                "camshafts",
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
                            value={data.fuel_system?.fuel_injectors || ""}
                            onChange={(e) =>
                              handleFuelSystemChange(
                                "fuel_injectors",
                                e.target.value
                              )
                            }
                            placeholder="e.g., 1000cc"
                            disabled={isLoading}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Fuel Pump</Label>
                          <Input
                            value={data.fuel_system?.fuel_pump || ""}
                            onChange={(e) =>
                              handleFuelSystemChange(
                                "fuel_pump",
                                e.target.value
                              )
                            }
                            placeholder="e.g., Walbro 450"
                            disabled={isLoading}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Fuel Rail</Label>
                          <Input
                            value={data.fuel_system?.fuel_rail || ""}
                            onChange={(e) =>
                              handleFuelSystemChange(
                                "fuel_rail",
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
