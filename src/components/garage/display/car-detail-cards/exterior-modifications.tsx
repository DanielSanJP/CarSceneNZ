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
    car.paint_color ||
    car.paint_finish ||
    car.wrap_brand ||
    car.wrap_color ||
    car.headlights ||
    car.taillights ||
    car.fog_lights ||
    car.underglow ||
    car.interior_lighting ||
    car.front_bumper ||
    car.front_lip ||
    car.rear_bumper ||
    car.rear_lip ||
    car.side_skirts ||
    car.rear_spoiler ||
    car.diffuser ||
    car.fender_flares ||
    car.hood;

  if (!hasAnyModifications) {
    return null;
  }

  // Create temporary objects for the sub-components to maintain backward compatibility
  const paintFinish =
    car.paint_color || car.paint_finish || car.wrap_brand || car.wrap_color
      ? {
          paint_color: car.paint_color,
          paint_finish: car.paint_finish,
          wrap_brand: car.wrap_brand,
          wrap_color: car.wrap_color,
        }
      : undefined;

  const lightingModifications =
    car.headlights ||
    car.taillights ||
    car.fog_lights ||
    car.underglow ||
    car.interior_lighting
      ? {
          headlights: car.headlights,
          taillights: car.taillights,
          fog_lights: car.fog_lights,
          underglow: car.underglow,
          interior_lighting: car.interior_lighting,
        }
      : undefined;

  const bodykitModifications =
    car.front_bumper ||
    car.front_lip ||
    car.rear_bumper ||
    car.rear_lip ||
    car.side_skirts ||
    car.rear_spoiler ||
    car.diffuser ||
    car.fender_flares ||
    car.hood
      ? {
          front_bumper: car.front_bumper,
          front_lip: car.front_lip,
          rear_bumper: car.rear_bumper,
          rear_lip: car.rear_lip,
          side_skirts: car.side_skirts,
          rear_spoiler: car.rear_spoiler,
          diffuser: car.diffuser,
          fender_flares: car.fender_flares,
          hood: car.hood,
        }
      : undefined;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Exterior Modifications</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <PaintFinish paintFinish={paintFinish} />
        <LightingModifications lightingModifications={lightingModifications} />
        <BodykitModifications bodykitModifications={bodykitModifications} />
      </CardContent>
    </Card>
  );
}
