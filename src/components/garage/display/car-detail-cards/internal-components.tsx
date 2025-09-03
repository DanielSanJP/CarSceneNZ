import type { Car } from "@/types/car";

interface InternalComponentsProps {
  internalComponents: Car["internal_components"];
}

export function InternalComponents({
  internalComponents,
}: InternalComponentsProps) {
  if (
    !internalComponents ||
    (!internalComponents.pistons &&
      !internalComponents.connecting_rods &&
      !internalComponents.valves &&
      !internalComponents.camshafts &&
      !internalComponents.valve_springs)
  ) {
    return null;
  }

  return (
    <div className="space-y-2">
      <h4 className="font-medium capitalize">Internal Components</h4>
      <div className="grid grid-cols-3 gap-4 text-sm">
        {internalComponents.pistons && (
          <div>
            <p className="text-muted-foreground">Pistons</p>
            <p className="font-medium">{internalComponents.pistons}</p>
          </div>
        )}
        {internalComponents.connecting_rods && (
          <div>
            <p className="text-muted-foreground">Connecting Rods</p>
            <p className="font-medium">{internalComponents.connecting_rods}</p>
          </div>
        )}
        {internalComponents.valves && (
          <div>
            <p className="text-muted-foreground">Valves</p>
            <p className="font-medium">{internalComponents.valves}</p>
          </div>
        )}
        {internalComponents.camshafts && (
          <div>
            <p className="text-muted-foreground">Camshafts</p>
            <p className="font-medium">{internalComponents.camshafts}</p>
          </div>
        )}
        {internalComponents.valve_springs && (
          <div>
            <p className="text-muted-foreground">Valve Springs</p>
            <p className="font-medium">{internalComponents.valve_springs}</p>
          </div>
        )}
      </div>
    </div>
  );
}
