import type { CarFuelSystem } from "@/types/car";

interface FuelSystemProps {
  fuelSystem: CarFuelSystem | undefined;
}

export function FuelSystem({ fuelSystem }: FuelSystemProps) {
  if (
    !fuelSystem ||
    (!fuelSystem.fuel_injectors &&
      !fuelSystem.fuel_pump &&
      !fuelSystem.fuel_rail)
  ) {
    return null;
  }

  return (
    <div className="space-y-2">
      <h4 className="font-medium capitalize">Fuel System</h4>
      <div className="grid grid-cols-3 gap-4 text-sm">
        {fuelSystem.fuel_injectors && (
          <div>
            <p className="text-muted-foreground">Fuel Injectors</p>
            <p className="font-medium">{fuelSystem.fuel_injectors}</p>
          </div>
        )}
        {fuelSystem.fuel_pump && (
          <div>
            <p className="text-muted-foreground">Fuel Pump</p>
            <p className="font-medium">{fuelSystem.fuel_pump}</p>
          </div>
        )}
        {fuelSystem.fuel_rail && (
          <div>
            <p className="text-muted-foreground">Fuel Rail</p>
            <p className="font-medium">{fuelSystem.fuel_rail}</p>
          </div>
        )}
      </div>
    </div>
  );
}
