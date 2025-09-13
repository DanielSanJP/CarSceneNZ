import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Car } from "@/types/car";

interface SuspensionDetailsProps {
  car: Car;
}

export function SuspensionDetails({ car }: SuspensionDetailsProps) {
  // Helper function to get suspension by position
  const getSuspensionByPosition = (position: "front" | "rear") => {
    return car.suspension?.[position];
  };

  // Get the suspension type (prefer front, fallback to rear)
  const getSuspensionType = () => {
    return (
      car.suspension?.front?.suspension_type ||
      car.suspension?.rear?.suspension_type
    );
  };

  if (!car.suspension || (!car.suspension.front && !car.suspension.rear)) {
    return null;
  }

  const suspensionType = getSuspensionType();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Suspension</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Suspension Type - Single field at top */}
        {suspensionType && (
          <div className="space-y-2 pb-2">
            <h5 className="font-medium">Type</h5>
            <p className="text-sm font-medium capitalize">{suspensionType}</p>
          </div>
        )}

        {["front", "rear"].map((position) => {
          const susp = getSuspensionByPosition(position as "front" | "rear");
          if (!susp) return null;

          return (
            <div key={position} className="space-y-4">
              <h4 className="font-medium capitalize">{position} Suspension</h4>

              {/* Suspension Components - removed suspension_type from here */}
              {(susp.suspension || susp.spring_rate) && (
                <div className="space-y-2">
                  <h5 className="font-medium text-sm">Suspension Components</h5>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {susp.suspension && (
                      <div>
                        <p className="text-muted-foreground">Setup</p>
                        <p className="font-medium">{susp.suspension}</p>
                      </div>
                    )}
                    {susp.spring_rate && (
                      <div>
                        <p className="text-muted-foreground">Spring Rate</p>
                        <p className="font-medium">{susp.spring_rate}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Wheel Alignment */}
              {(susp.camber_degrees !== undefined ||
                susp.toe_degrees ||
                susp.caster_degrees) && (
                <div className="space-y-2">
                  <h5 className="font-medium text-sm">Wheel Alignment</h5>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    {susp.camber_degrees !== undefined && (
                      <div>
                        <p className="text-muted-foreground">Camber</p>
                        <p className="font-medium">{susp.camber_degrees}°</p>
                      </div>
                    )}
                    {susp.toe_degrees && (
                      <div>
                        <p className="text-muted-foreground">Toe</p>
                        <p className="font-medium">{susp.toe_degrees}</p>
                      </div>
                    )}
                    {susp.caster_degrees && (
                      <div>
                        <p className="text-muted-foreground">Caster</p>
                        <p className="font-medium">{susp.caster_degrees}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Anti-Roll System */}
              {(susp.anti_roll_bar || susp.strut_brace) && (
                <div className="space-y-2">
                  <h5 className="font-medium text-sm">Anti-Roll System</h5>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {susp.anti_roll_bar && (
                      <div>
                        <p className="text-muted-foreground">Anti-Roll Bar</p>
                        <p className="font-medium">{susp.anti_roll_bar}</p>
                      </div>
                    )}
                    {susp.strut_brace && (
                      <div>
                        <p className="text-muted-foreground">Strut Brace</p>
                        <p className="font-medium">{susp.strut_brace}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
