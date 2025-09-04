import type { CarSteeringWheel } from "@/types/car";

interface SteeringWheelProps {
  steeringWheel: CarSteeringWheel | undefined;
}

export function SteeringWheel({ steeringWheel }: SteeringWheelProps) {
  if (!steeringWheel || !steeringWheel.steering_wheel) {
    return null;
  }

  return (
    <div>
      <h4 className="font-medium mb-2">Steering Wheel</h4>
      <div className="text-sm">
        <p className="text-muted-foreground">Steering Wheel</p>
        <p className="font-medium">{steeringWheel.steering_wheel}</p>
      </div>
    </div>
  );
}
