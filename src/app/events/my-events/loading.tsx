import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export default function MyEventsLoading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header skeleton */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
            <div className="flex-1 min-w-0 pr-4">
              <Skeleton className="h-8 w-32 mb-2" />
              <Skeleton className="h-4 w-80" />
            </div>
            <div className="flex-shrink-0">
              <Skeleton className="h-10 w-40" />
            </div>
          </div>

          {/* Events grid skeleton */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Card key={index} className="overflow-hidden py-0">
                <CardContent className="p-0">
                  {/* Event banner skeleton */}
                  <div className="relative aspect-square">
                    <Skeleton className="w-full h-full" />
                    {/* Date badge skeleton */}
                    <div className="absolute top-3 right-3">
                      <Skeleton className="h-6 w-16 rounded-full" />
                    </div>
                    {/* Event type badge skeleton */}
                    <div className="absolute top-3 left-3">
                      <Skeleton className="h-6 w-20 rounded-full" />
                    </div>
                    {/* Attendee count skeleton */}
                    <div className="absolute bottom-3 right-3">
                      <Skeleton className="h-6 w-12 rounded-full" />
                    </div>
                  </div>

                  <div className="p-4 space-y-3">
                    {/* Event name */}
                    <Skeleton className="h-6 w-3/4" />

                    {/* Event stats */}
                    <div className="flex gap-4">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-20" />
                    </div>

                    {/* Event description */}
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-4/5" />
                    </div>

                    {/* Organizer info */}
                    <Skeleton className="h-3 w-28" />

                    {/* Action button */}
                    <Skeleton className="h-9 w-full" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
