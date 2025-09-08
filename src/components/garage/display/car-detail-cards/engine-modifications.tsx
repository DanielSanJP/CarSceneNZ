import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TurboSystem } from "./turbo-system";
import { ExhaustSystem } from "./exhaust-system";
import { EngineManagement } from "./engine-management";
import { InternalComponents } from "./internal-components";
import { FuelSystem } from "./fuel-system";
import type { Car } from "@/types/car";

interface EngineModificationsProps {
  car: Car;
}

export const EngineModifications = React.memo(function EngineModifications({
  car,
}: EngineModificationsProps) {
  const hasAnyModifications = useMemo(() => {
    return !!(
      car.turbo ||
      car.intercooler ||
      car.header ||
      car.exhaust ||
      car.intake ||
      car.ecu ||
      car.tuned_by ||
      car.pistons ||
      car.connecting_rods ||
      car.valves ||
      car.valve_springs ||
      car.camshafts ||
      car.fuel_injectors ||
      car.fuel_pump ||
      car.fuel_rail
    );
  }, [
    car.turbo,
    car.intercooler,
    car.header,
    car.exhaust,
    car.intake,
    car.ecu,
    car.tuned_by,
    car.pistons,
    car.connecting_rods,
    car.valves,
    car.valve_springs,
    car.camshafts,
    car.fuel_injectors,
    car.fuel_pump,
    car.fuel_rail,
  ]);

  // Memoize derived objects to avoid recreation on each render
  const turboSystem = useMemo(
    () =>
      car.turbo || car.intercooler
        ? {
            turbo: car.turbo,
            intercooler: car.intercooler,
          }
        : undefined,
    [car.turbo, car.intercooler]
  );

  const exhaustSystem = useMemo(
    () =>
      car.header || car.exhaust || car.intake
        ? {
            header: car.header,
            exhaust: car.exhaust,
            intake: car.intake,
          }
        : undefined,
    [car.header, car.exhaust, car.intake]
  );

  const engineManagement = useMemo(
    () =>
      car.ecu || car.tuned_by
        ? {
            ecu: car.ecu,
            tuned_by: car.tuned_by,
          }
        : undefined,
    [car.ecu, car.tuned_by]
  );

  const internalComponents = useMemo(
    () =>
      car.pistons ||
      car.connecting_rods ||
      car.valves ||
      car.valve_springs ||
      car.camshafts
        ? {
            pistons: car.pistons,
            connecting_rods: car.connecting_rods,
            valves: car.valves,
            valve_springs: car.valve_springs,
            camshafts: car.camshafts,
          }
        : undefined,
    [
      car.pistons,
      car.connecting_rods,
      car.valves,
      car.valve_springs,
      car.camshafts,
    ]
  );

  const fuelSystem = useMemo(
    () =>
      car.fuel_injectors || car.fuel_pump || car.fuel_rail
        ? {
            fuel_injectors: car.fuel_injectors,
            fuel_pump: car.fuel_pump,
            fuel_rail: car.fuel_rail,
          }
        : undefined,
    [car.fuel_injectors, car.fuel_pump, car.fuel_rail]
  );

  if (!hasAnyModifications) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Engine Modifications</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <TurboSystem turboSystem={turboSystem} />
        <ExhaustSystem exhaustSystem={exhaustSystem} />
        <EngineManagement engineManagement={engineManagement} />
        <InternalComponents internalComponents={internalComponents} />
        <FuelSystem fuelSystem={fuelSystem} />
      </CardContent>
    </Card>
  );
});
