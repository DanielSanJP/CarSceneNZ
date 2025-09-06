import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";
import type { Car } from "@/types/car";

interface CarStatsProps {
  car: Car;
  likeCount?: number;
}

export function CarStats({ car, likeCount }: CarStatsProps) {
  // Format date consistently to avoid hydration mismatch
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-NZ", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  return (
    <Card>
      <CardContent>
        <div className="text-center">
          <p className="text-muted-foreground text-sm mb-2">
            Added on {formatDate(car.created_at)}
          </p>
          <div className="flex items-center justify-center gap-2">
            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
            <span className="font-medium">
              {likeCount ?? car.total_likes} likes
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
