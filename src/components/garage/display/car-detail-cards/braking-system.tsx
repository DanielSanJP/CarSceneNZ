import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Car } from "@/types/car";

interface BrakingSystemProps {
  car: Car;
}

export function BrakingSystem({ car }: BrakingSystemProps) {
  // Helper function to get brakes by position
  const getBrakesByPosition = (position: "front" | "rear") => {
    return car.brakes?.find((brake) => brake.position === position);
  };

  if (!car.brakes || car.brakes.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Brakes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {["front", "rear"].map((position) => {
          const brake = getBrakesByPosition(position as "front" | "rear");
          if (!brake) return null;

          return (
            <div key={position} className="space-y-2">
              <h4 className="font-medium capitalize">{position}</h4>
              <div className="grid grid-cols-3 gap-4 text-sm">
                {brake.caliper && (
                  <div>
                    <p className="text-muted-foreground">Caliper</p>
                    <p className="font-medium">{brake.caliper}</p>
                  </div>
                )}
                {brake.disc_size && (
                  <div>
                    <p className="text-muted-foreground">Disc Size</p>
                    <p className="font-medium">{brake.disc_size}</p>
                  </div>
                )}
                {brake.disc_type && (
                  <div>
                    <p className="text-muted-foreground">Disc Type</p>
                    <p className="font-medium capitalize">{brake.disc_type}</p>
                  </div>
                )}
                {brake.pads && (
                  <div>
                    <p className="text-muted-foreground">Pads</p>
                    <p className="font-medium">{brake.pads}</p>
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
