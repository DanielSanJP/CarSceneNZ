import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function GarageLoading() {
  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-4 sm:space-y-6">
          {/* Header skeleton - matches garage gallery */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div>
                <Skeleton className="h-8 w-32 mb-2" />
                <Skeleton className="h-4 w-80" />
              </div>
              <div className="flex gap-2 sm:gap-3">
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 w-24" />
              </div>
            </div>
          </div>

          {/* Filters skeleton - matches garage gallery layout */}
          <div className="space-y-3">
            {/* Flexible filter layout - BMY on one line, Sort can wrap */}
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <div className="flex flex-1 min-w-0 gap-2 sm:gap-3">
                <Skeleton className="h-8 sm:h-10 flex-1 min-w-[80px]" />
                <Skeleton className="h-8 sm:h-10 flex-1 min-w-[80px]" />
                <Skeleton className="h-8 sm:h-10 flex-1 min-w-[70px]" />
              </div>
              <Skeleton className="h-8 sm:h-10 w-full sm:w-auto sm:min-w-[120px]" />
            </div>

            {/* Results count skeleton */}
            <div className="text-center sm:text-left">
              <Skeleton className="h-4 w-24" />
            </div>
          </div>

          {/* Cars grid skeleton - matches garage gallery */}
          <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 12 }).map((_, index) => (
              <Card
                key={index}
                className="overflow-hidden pt-0 hover:shadow-lg transition-shadow"
              >
                <CardContent className="p-0">
                  {/* Car Image - aspect-square to match gallery */}
                  <div className="relative aspect-square overflow-hidden">
                    <Skeleton className="w-full h-full" />
                    {/* Like button skeleton */}
                    <div className="absolute top-2 right-2">
                      <Skeleton className="h-8 w-8 rounded-full" />
                    </div>
                  </div>
                </CardContent>

                <CardHeader className="pb-2 sm:pb-3">
                  {/* Car make/model */}
                  <Skeleton className="h-6 w-4/5" />
                  {/* Car year */}
                  <Skeleton className="h-4 w-16" />
                </CardHeader>

                <CardContent className="pt-0 pb-3 sm:pb-4">
                  {/* Engine info and specs */}
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <div className="flex gap-4">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                  </div>

                  {/* Owner info */}
                  <div className="flex items-center gap-2 pt-2 border-t mt-3">
                    <Skeleton className="h-6 w-6 rounded-full" />
                    <Skeleton className="h-4 w-24" />
                  </div>

                  {/* Like count */}
                  <div className="flex items-center gap-1 mt-2">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 w-8" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination skeleton - matches garage gallery */}
          <div className="flex justify-center items-center gap-2 mt-6">
            <Skeleton className="h-9 w-20" />
            <div className="flex items-center gap-1 sm:gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-9 w-9" />
              ))}
            </div>
            <Skeleton className="h-9 w-20" />
          </div>

          {/* Results info skeleton */}
          <div className="text-center mt-3">
            <Skeleton className="h-4 w-48 mx-auto" />
          </div>
        </div>
      </div>
    </div>
  );
}
