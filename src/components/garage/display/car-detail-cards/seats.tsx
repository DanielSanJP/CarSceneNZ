import type { CarSeats } from "@/types/car";

interface SeatsProps {
  seats: CarSeats | undefined;
}

export function Seats({ seats }: SeatsProps) {
  if (!seats) {
    return null;
  }

  return (
    <div>
      <h4 className="font-medium mb-2">Seats</h4>
      <div className="grid grid-cols-3 gap-4 text-sm">
        {seats.front_seats && (
          <div>
            <p className="text-muted-foreground">Front Seats</p>
            <p className="font-medium">{seats.front_seats}</p>
          </div>
        )}
        {seats.rear_seats && (
          <div>
            <p className="text-muted-foreground">Rear Seats</p>
            <p className="font-medium">{seats.rear_seats}</p>
          </div>
        )}
      </div>
    </div>
  );
}
