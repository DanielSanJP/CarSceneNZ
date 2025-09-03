import type { Car } from "@/types/car";

interface SteeringWheelProps {
  steeringWheel: Car["steering_wheel"];
}

export function SteeringWheel({ steeringWheel }: SteeringWheelProps) {
  if (!steeringWheel || !steeringWheel.steering_wheel) {
    return null;
  }

  return (
    <div>
      <h4 className="font-medium mb-2">Steering Wheel</h4>
      <div className="text-sm">
        <p className="font-medium">{steeringWheel.steering_wheel}</p>
      </div>
    </div>
  );
}
