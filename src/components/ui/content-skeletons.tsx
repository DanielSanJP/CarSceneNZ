import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

interface EventCardSkeletonProps {
  count?: number;
}

export function EventCardSkeleton({ count = 1 }: EventCardSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} className="overflow-hidden pt-0">
          <CardContent className="p-0">
            {/* Event image skeleton */}
            <Skeleton className="w-full h-48" />

            <div className="p-4 space-y-3">
              {/* Event title */}
              <Skeleton className="h-6 w-3/4" />

              {/* Event date & time */}
              <div className="space-y-2">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-2/3" />
              </div>

              {/* Event location */}
              <Skeleton className="h-4 w-5/6" />

              {/* Host info */}
              <div className="flex items-center gap-2 pt-2">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-4 w-24" />
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 pt-2">
                <Skeleton className="h-9 w-20" />
                <Skeleton className="h-9 w-24" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </>
  );
}

interface CarCardSkeletonProps {
  count?: number;
}

export function CarCardSkeleton({ count = 1 }: CarCardSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} className="overflow-hidden group pt-0">
          <CardContent className="p-0">
            {/* Car image skeleton */}
            <div className="relative">
              <Skeleton className="w-full h-48" />
              {/* Like button skeleton */}
              <div className="absolute top-2 right-2">
                <Skeleton className="h-8 w-8 rounded-full" />
              </div>
            </div>

            <div className="p-4 space-y-3">
              {/* Car make/model */}
              <Skeleton className="h-6 w-4/5" />

              {/* Car year */}
              <Skeleton className="h-4 w-16" />

              {/* Engine info */}
              <Skeleton className="h-4 w-3/4" />

              {/* Power/torque */}
              <div className="flex gap-4">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-20" />
              </div>

              {/* Owner info */}
              <div className="flex items-center gap-2 pt-2 border-t">
                <Skeleton className="h-6 w-6 rounded-full" />
                <Skeleton className="h-4 w-24" />
              </div>

              {/* Like count */}
              <div className="flex items-center gap-1">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-8" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </>
  );
}

interface ClubCardSkeletonProps {
  count?: number;
}

export function ClubCardSkeleton({ count = 1 }: ClubCardSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} className="overflow-hidden pt-0">
          <CardContent className="p-0">
            {/* Club banner skeleton */}
            <Skeleton className="w-full h-32" />

            <div className="p-4 space-y-3">
              {/* Club name */}
              <Skeleton className="h-6 w-3/4" />

              {/* Club description */}
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
              </div>

              {/* Club stats */}
              <div className="flex gap-4 pt-2">
                <div className="flex items-center gap-1">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 w-8" />
                </div>
                <div className="flex items-center gap-1">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 w-8" />
                </div>
              </div>

              {/* Leader info */}
              <div className="flex items-center gap-2 pt-2 border-t">
                <Skeleton className="h-6 w-6 rounded-full" />
                <div>
                  <Skeleton className="h-3 w-12 mb-1" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>

              {/* Join button */}
              <Skeleton className="h-9 w-full" />
            </div>
          </CardContent>
        </Card>
      ))}
    </>
  );
}
