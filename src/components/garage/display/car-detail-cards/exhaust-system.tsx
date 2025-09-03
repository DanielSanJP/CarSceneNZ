import type { Car } from "@/types/car";

interface ExhaustSystemProps {
  exhaustSystem: Car["exhaust_system"];
}

export function ExhaustSystem({ exhaustSystem }: ExhaustSystemProps) {
  if (
    !exhaustSystem ||
    (!exhaustSystem.intake && !exhaustSystem.header && !exhaustSystem.exhaust)
  ) {
    return null;
  }

  return (
    <div className="space-y-2">
      <h4 className="font-medium capitalize">Exhaust & Intake</h4>
      <div className="grid grid-cols-3 gap-4 text-sm">
        {exhaustSystem.intake && (
          <div>
            <p className="text-muted-foreground">Intake</p>
            <p className="font-medium">{exhaustSystem.intake}</p>
          </div>
        )}
        {exhaustSystem.header && (
          <div>
            <p className="text-muted-foreground">Header</p>
            <p className="font-medium">{exhaustSystem.header}</p>
          </div>
        )}
        {exhaustSystem.exhaust && (
          <div>
            <p className="text-muted-foreground">Exhaust</p>
            <p className="font-medium">{exhaustSystem.exhaust}</p>
          </div>
        )}
      </div>
    </div>
  );
}
