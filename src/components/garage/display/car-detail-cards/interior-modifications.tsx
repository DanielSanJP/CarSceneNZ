import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Seats } from "./seats";
import { SteeringWheel } from "./steering-wheel";
import { AudioSystem } from "./audio-system";
import { Gauges } from "./gauges";
import type { Car } from "@/types/car";

interface InteriorModificationsProps {
  car: Car;
}

export function InteriorModifications({ car }: InteriorModificationsProps) {
  const hasAnyModifications =
    car.seats ||
    car.steering_wheel ||
    car.audio_system ||
    (car.gauges && car.gauges.length > 0);

  if (!hasAnyModifications) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Interior Modifications</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Seats seats={car.seats} />
        <SteeringWheel steeringWheel={car.steering_wheel} />
        <AudioSystem audioSystem={car.audio_system} />
        <Gauges gauges={car.gauges} />
      </CardContent>
    </Card>
  );
}
