import { Skeleton } from "@/components/ui/skeleton";
import { LeaderboardSkeleton } from "@/components/leaderboard/leaderboard-skeleton";

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
            <LeaderboardSkeleton count={15} />

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
