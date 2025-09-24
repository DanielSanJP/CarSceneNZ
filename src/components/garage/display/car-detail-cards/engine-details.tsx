import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CarEngine } from "@/types/car";

interface EngineDetailsProps {
  engine: CarEngine | undefined;
}

export const EngineDetails = React.memo(function EngineDetails({
  engine,
}: EngineDetailsProps) {
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
        <div className="flex flex-wrap gap-4 text-sm">
          {engine.engine_code && (
            <div className="min-w-[120px] flex-1">
              <p className="text-muted-foreground">Engine Code</p>
              <p className="font-medium">{engine.engine_code}</p>
            </div>
          )}
          {engine.displacement && (
            <div className="min-w-[120px] flex-1">
              <p className="text-muted-foreground">Displacement</p>
              <p className="font-medium">{engine.displacement}</p>
            </div>
          )}
          {engine.power_hp && engine.power_hp > 0 && (
            <div className="min-w-[120px] flex-1">
              <p className="text-muted-foreground">Power</p>
              <p className="font-medium">{engine.power_hp} HP</p>
            </div>
          )}
          {engine.torque_nm && engine.torque_nm > 0 && (
            <div className="min-w-[120px] flex-1">
              <p className="text-muted-foreground">Torque</p>
              <p className="font-medium">{engine.torque_nm} Nm</p>
            </div>
          )}
          {engine.aspiration && (
            <div className="min-w-[120px] flex-1">
              <p className="text-muted-foreground">Aspiration</p>
              <p className="font-medium text-sm sm:text-base break-words">
                {engine.aspiration
                  .replace(/[-_]/g, " ")
                  .replace(/\b\w/g, (l) => l.toUpperCase())}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
});
