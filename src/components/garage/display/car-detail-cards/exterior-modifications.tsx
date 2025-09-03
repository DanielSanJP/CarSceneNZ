import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PaintFinish } from "./paint-finish";
import { LightingModifications } from "./lighting-modifications";
import { BodykitModifications } from "./bodykit-modifications";
import type { Car } from "@/types/car";

interface ExteriorModificationsProps {
  car: Car;
}

export function ExteriorModifications({ car }: ExteriorModificationsProps) {
  const hasAnyModifications =
    car.paint_finish || car.lighting_modifications || car.bodykit_modifications;

  if (!hasAnyModifications) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Exterior Modifications</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <PaintFinish paintFinish={car.paint_finish} />
        <LightingModifications
          lightingModifications={car.lighting_modifications}
        />
        <BodykitModifications
          bodykitModifications={car.bodykit_modifications}
        />
      </CardContent>
    </Card>
  );
}
