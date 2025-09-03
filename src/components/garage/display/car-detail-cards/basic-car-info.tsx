import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Car as CarIcon } from "lucide-react";
import type { Car } from "@/types/car";

interface BasicCarInfoProps {
  car: Car;
}

export function BasicCarInfo({ car }: BasicCarInfoProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CarIcon className="h-5 w-5" />
          Car Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-2 text-sm">
          <div>
            <p className="text-muted-foreground">Year</p>
            <p className="font-medium">{car.year}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Make</p>
            <p className="font-medium">{car.brand}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Model</p>
            <p className="font-medium">{car.model}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 mt-4"></div>
      </CardContent>
    </Card>
  );
}
