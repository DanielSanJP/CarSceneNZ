import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function EditEventLoading() {
  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* Back button skeleton */}
        <div className="mb-6">
          <Skeleton className="h-9 w-20" />
        </div>

        {/* Header skeleton */}
        <div className="text-center mb-8">
          <Skeleton className="h-8 w-40 mx-auto mb-2" />
          <Skeleton className="h-5 w-72 mx-auto" />
        </div>

        <div className="max-w-2xl mx-auto">
          <Card className="pt-0">
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Event title */}
              <div>
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-10 w-full" />
              </div>

              {/* Event description */}
              <div>
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-24 w-full" />
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Skeleton className="h-4 w-16 mb-2" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div>
                  <Skeleton className="h-4 w-16 mb-2" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>

              {/* Location */}
              <div>
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-10 w-full" />
              </div>

              {/* Current image */}
              <div>
                <Skeleton className="h-4 w-28 mb-2" />
                <Skeleton className="h-48 w-full" />
              </div>

              {/* Image upload */}
              <div>
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-32 w-full rounded border-dashed" />
              </div>

              {/* Map selection */}
              <div>
                <Skeleton className="h-4 w-28 mb-2" />
                <Skeleton className="h-48 w-full" />
              </div>

              {/* Event type */}
              <div>
                <Skeleton className="h-4 w-24 mb-2" />
                <div className="flex gap-2">
                  <Skeleton className="h-9 w-16" />
                  <Skeleton className="h-9 w-20" />
                  <Skeleton className="h-9 w-18" />
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-4 pt-4">
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 w-28" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
