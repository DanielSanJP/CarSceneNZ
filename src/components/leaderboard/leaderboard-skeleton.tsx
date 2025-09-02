import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

interface LeaderboardSkeletonProps {
  count?: number;
}

export function LeaderboardSkeleton({ count = 10 }: LeaderboardSkeletonProps) {
  return (
    <div className="space-y-2 md:space-y-3">
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index}>
          <CardContent className="px-2 md:px-4">
            <div className="flex items-center gap-2 md:gap-4">
              {/* Rank Number Skeleton */}
              <div className="flex items-center justify-center min-w-[40px] md:min-w-[60px]">
                <Skeleton className="h-6 w-8 md:h-8 md:w-12" />
              </div>

              {/* Avatar/Image Skeleton */}
              <Skeleton className="h-14 w-14 md:h-20 md:w-20 rounded-lg flex-shrink-0" />

              {/* Content Skeleton */}
              <div className="flex-1 min-w-0 space-y-1 md:space-y-2">
                <Skeleton className="h-4 md:h-5 w-3/4" />
                <Skeleton className="h-3 md:h-4 w-1/2" />
              </div>

              {/* Score Skeleton */}
              <div className="text-right flex-shrink-0">
                <Skeleton className="h-6 w-16 md:h-8 md:w-20" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
