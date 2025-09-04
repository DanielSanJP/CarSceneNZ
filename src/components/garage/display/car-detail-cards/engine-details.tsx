import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CarEngine } from "@/types/car";

interface EngineDetailsProps {
  engine: CarEngine | undefined;
}

export function EngineDetails({ engine }: EngineDetailsProps) {
  if (!engine) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Engine Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            No engine details available for this car.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Engine Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4 text-sm">
          {engine.engine_code && (
            <div>
              <p className="text-muted-foreground">Engine Code</p>
              <p className="font-medium">{engine.engine_code}</p>
            </div>
          )}
          {engine.displacement && (
            <div>
              <p className="text-muted-foreground">Displacement</p>
              <p className="font-medium">{engine.displacement}</p>
            </div>
          )}
          {engine.aspiration && (
            <div>
              <p className="text-muted-foreground">Aspiration</p>
              <p className="font-medium capitalize">{engine.aspiration}</p>
            </div>
          )}
          {engine.power_hp && engine.power_hp > 0 && (
            <div>
              <p className="text-muted-foreground">Power</p>
              <p className="font-medium">{engine.power_hp} HP</p>
            </div>
          )}
          {engine.torque_nm && engine.torque_nm > 0 && (
            <div>
              <p className="text-muted-foreground">Torque</p>
              <p className="font-medium">{engine.torque_nm} Nm</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
