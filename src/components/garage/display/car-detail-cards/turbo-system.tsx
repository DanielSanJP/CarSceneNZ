import type { CarTurboSystem } from "@/types/car";

interface TurboSystemProps {
  turboSystem: CarTurboSystem | undefined;
  aspiration?: string;
}

export function TurboSystem({ turboSystem, aspiration }: TurboSystemProps) {
  if (
    !turboSystem ||
    (!turboSystem.turbo &&
      !turboSystem.supercharger &&
      !turboSystem.twin_turbo_setup &&
      !turboSystem.intercooler)
  ) {
    return null;
  }

  // Determine the header based on aspiration type
  const getHeaderTitle = () => {
    switch (aspiration) {
      case "supercharged":
        return "Supercharger System";
      case "twin_turbo":
        return "Twin Turbo System";
      case "turbocharged":
        return "Turbo System";
      default:
        return "Forced Induction System";
    }
  };

  return (
    <div className="space-y-2">
      <h4 className="font-medium capitalize">{getHeaderTitle()}</h4>
      <div className="flex flex-wrap gap-4 text-sm">
        {turboSystem.turbo && aspiration === "turbocharged" && (
          <div className="min-w-[120px] flex-1">
            <p className="text-muted-foreground">Turbo</p>
            <p className="font-medium">{turboSystem.turbo}</p>
          </div>
        )}
        {turboSystem.supercharger && aspiration === "supercharged" && (
          <div className="min-w-[120px] flex-1">
            <p className="text-muted-foreground">Supercharger</p>
            <p className="font-medium">{turboSystem.supercharger}</p>
          </div>
        )}
        {turboSystem.twin_turbo_setup && aspiration === "twin_turbo" && (
          <div className="min-w-[120px] flex-1">
            <p className="text-muted-foreground">Twin Turbo Setup</p>
            <p className="font-medium">{turboSystem.twin_turbo_setup}</p>
          </div>
        )}
        {turboSystem.intercooler && (
          <div className="min-w-[120px] flex-1">
            <p className="text-muted-foreground">Intercooler</p>
            <p className="font-medium">{turboSystem.intercooler}</p>
          </div>
        )}
      </div>
    </div>
  );
}
