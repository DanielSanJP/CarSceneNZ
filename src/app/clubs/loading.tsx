import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export default function ClubsLoading() {
  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* Header skeleton */}
        <div className="mb-8">
          <Skeleton className="h-8 w-24 mb-4" />
          <Skeleton className="h-4 w-72" />
        </div>

        {/* Create club button skeleton */}
        <div className="mb-6">
          <Skeleton className="h-10 w-32" />
        </div>

        {/* Clubs grid skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 9 }).map((_, index) => (
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
        </div>
      </div>
    </div>
  );
}
