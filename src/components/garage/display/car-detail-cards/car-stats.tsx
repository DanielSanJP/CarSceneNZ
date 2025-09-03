import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";
import type { Car } from "@/types/car";

interface CarStatsProps {
  car: Car;
}

export function CarStats({ car }: CarStatsProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-center">
          <p className="text-muted-foreground text-sm mb-2">
            Added on {new Date(car.created_at).toLocaleDateString()}
          </p>
          <div className="flex items-center justify-center gap-2">
            <Star className="h-4 w-4" />
            <span className="font-medium">{car.total_likes} likes</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
