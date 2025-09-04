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
    car.front_seats ||
    car.rear_seats ||
    car.steering_wheel ||
    car.head_unit ||
    car.speakers ||
    car.subwoofer ||
    car.amplifier ||
    (car.gauges && car.gauges.length > 0);

  if (!hasAnyModifications) {
    return null;
  }

  // Create temporary objects for the sub-components to maintain backward compatibility
  const seats =
    car.front_seats || car.rear_seats
      ? {
          front_seats: car.front_seats,
          rear_seats: car.rear_seats,
        }
      : undefined;

  const steeringWheel = car.steering_wheel
    ? {
        steering_wheel: car.steering_wheel,
      }
    : undefined;

  const audioSystem =
    car.head_unit || car.speakers || car.subwoofer || car.amplifier
      ? {
          head_unit: car.head_unit,
          speakers: car.speakers,
          subwoofer: car.subwoofer,
          amplifier: car.amplifier,
        }
      : undefined;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Interior Modifications</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Seats seats={seats} />
        <SteeringWheel steeringWheel={steeringWheel} />
        <AudioSystem audioSystem={audioSystem} />
        <Gauges gauges={car.gauges} />
      </CardContent>
    </Card>
  );
}
