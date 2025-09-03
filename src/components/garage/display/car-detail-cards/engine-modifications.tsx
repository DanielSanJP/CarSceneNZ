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

export function EngineModifications({ car }: EngineModificationsProps) {
  const hasAnyModifications =
    car.turbo_system ||
    car.exhaust_system ||
    car.engine_management ||
    car.internal_components ||
    car.fuel_system;

  if (!hasAnyModifications) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Engine Modifications</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <TurboSystem turboSystem={car.turbo_system} />
        <ExhaustSystem exhaustSystem={car.exhaust_system} />
        <EngineManagement engineManagement={car.engine_management} />
        <InternalComponents internalComponents={car.internal_components} />
        <FuelSystem fuelSystem={car.fuel_system} />
      </CardContent>
    </Card>
  );
}
