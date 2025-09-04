import type { CarTurboSystem } from "@/types/car";

interface TurboSystemProps {
  turboSystem: CarTurboSystem | undefined;
}

export function TurboSystem({ turboSystem }: TurboSystemProps) {
  if (!turboSystem || (!turboSystem.turbo && !turboSystem.intercooler)) {
    return null;
  }

  return (
    <div className="space-y-2">
      <h4 className="font-medium capitalize">Turbo System</h4>
      <div className="grid grid-cols-2 gap-4 text-sm">
        {turboSystem.turbo && (
          <div>
            <p className="text-muted-foreground">Turbo</p>
            <p className="font-medium">{turboSystem.turbo}</p>
          </div>
        )}
        {turboSystem.intercooler && (
          <div>
            <p className="text-muted-foreground">Intercooler</p>
            <p className="font-medium">{turboSystem.intercooler}</p>
          </div>
        )}
      </div>
    </div>
  );
}
