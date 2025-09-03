import type { Car } from "@/types/car";

interface LightingModificationsProps {
  lightingModifications: Car["lighting_modifications"];
}

export function LightingModifications({
  lightingModifications,
}: LightingModificationsProps) {
  if (!lightingModifications) {
    return null;
  }

  return (
    <div>
      <h4 className="font-medium mb-2">Lighting</h4>
      <div className="grid grid-cols-3 gap-4 text-sm">
        {lightingModifications.headlights && (
          <div>
            <p className="text-muted-foreground">Headlights</p>
            <p className="font-medium">{lightingModifications.headlights}</p>
          </div>
        )}
        {lightingModifications.taillights && (
          <div>
            <p className="text-muted-foreground">Taillights</p>
            <p className="font-medium">{lightingModifications.taillights}</p>
          </div>
        )}
        {lightingModifications.underglow && (
          <div>
            <p className="text-muted-foreground">Underglow</p>
            <p className="font-medium">{lightingModifications.underglow}</p>
          </div>
        )}
      </div>
    </div>
  );
}
