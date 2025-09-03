import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Car } from "@/types/car";

interface WheelsTiresProps {
  car: Car;
}

export function WheelsTires({ car }: WheelsTiresProps) {
  // Helper function to get wheels by position
  const getWheelsByPosition = (position: "front" | "rear") => {
    return car.wheels?.find((wheel) => wheel.position === position);
  };

  if (!car.wheels || car.wheels.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Wheels & Tires</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {["front", "rear"].map((position) => {
          const wheel = getWheelsByPosition(position as "front" | "rear");
          if (!wheel) return null;

          return (
            <div key={position} className="space-y-2">
              <h4 className="font-medium capitalize">{position}</h4>
              <div className="grid grid-cols-3 gap-4 text-sm">
                {wheel.wheel && (
                  <div>
                    <p className="text-muted-foreground">Wheel</p>
                    <p className="font-medium">{wheel.wheel}</p>
                  </div>
                )}
                {wheel.wheel_size && (
                  <div>
                    <p className="text-muted-foreground">Size</p>
                    <p className="font-medium">{wheel.wheel_size}</p>
                  </div>
                )}
                {wheel.wheel_offset && (
                  <div>
                    <p className="text-muted-foreground">Offset</p>
                    <p className="font-medium">{wheel.wheel_offset}</p>
                  </div>
                )}
                {wheel.tyre && (
                  <div>
                    <p className="text-muted-foreground">Tyre</p>
                    <p className="font-medium">{wheel.tyre}</p>
                  </div>
                )}
                {wheel.tyre_size && (
                  <div>
                    <p className="text-muted-foreground">Tyre Size</p>
                    <p className="font-medium">{wheel.tyre_size}</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
