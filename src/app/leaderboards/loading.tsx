import { Skeleton } from "@/components/ui/skeleton";

export default function LeaderboardsLoading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header skeleton */}
          <div className="text-center mb-8">
            <Skeleton className="h-10 w-80 mx-auto mb-4" />
            <Skeleton className="h-6 w-96 mx-auto" />
          </div>

          {/* Tab navigation skeleton */}
          <div className="flex justify-center mb-6">
            <div className="flex gap-2 p-1 bg-muted rounded-lg">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-20" />
              <Skeleton className="h-10 w-16" />
            </div>
          </div>

          {/* Leaderboard content skeleton */}
          <div className="bg-background">
            {/* Stats overview skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <Skeleton className="h-8 w-12 mx-auto mb-2" />
                <Skeleton className="h-4 w-20 mx-auto" />
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <Skeleton className="h-8 w-16 mx-auto mb-2" />
                <Skeleton className="h-4 w-24 mx-auto" />
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <Skeleton className="h-8 w-14 mx-auto mb-2" />
                <Skeleton className="h-4 w-28 mx-auto" />
              </div>
            </div>

            {/* Search/filter skeleton */}
            <div className="mb-6">
              <Skeleton className="h-10 w-full max-w-md" />
            </div>

            {/* Leaderboard list skeleton */}
            <div className="space-y-4">
              {Array.from({ length: 15 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 p-4 border rounded-lg"
                >
                  <Skeleton className="h-8 w-8 rounded" />
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-5 w-48 mb-2" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <div className="text-right">
                    <Skeleton className="h-6 w-16 mb-1" />
                    <Skeleton className="h-4 w-12" />
                  </div>
                </div>
              ))}
            </div>

            {/* Load more button skeleton */}
            <div className="text-center mt-6">
              <Skeleton className="h-10 w-32 mx-auto" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
