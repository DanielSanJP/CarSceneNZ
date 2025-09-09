import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function ProfileLoading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="space-y-6">
            {/* Profile Info Card */}
            <Card>
              <CardHeader>
                {/* Three Column Layout */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-center justify-items-center">
                  {/* Column 1: Profile Image, Display Name, Username */}
                  <div className="flex items-start gap-4 w-full">
                    <div className="relative h-24 w-24 sm:h-32 sm:w-32 lg:h-48 lg:w-48 flex-shrink-0 rounded-full overflow-hidden">
                      <Skeleton className="w-full h-full rounded-full" />
                    </div>
                    <div className="flex flex-col justify-center space-y-2 min-h-[96px] sm:min-h-[128px] lg:min-h-[192px]">
                      <Skeleton className="h-6 w-32" />
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-8 w-20" />
                    </div>
                  </div>

                  {/* Column 2: Stats */}
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className="grid grid-cols-2 gap-6 w-full">
                      <div className="text-center">
                        <Skeleton className="h-6 w-8 mx-auto mb-1" />
                        <Skeleton className="h-4 w-12 mx-auto" />
                      </div>
                      <div className="text-center">
                        <Skeleton className="h-6 w-8 mx-auto mb-1" />
                        <Skeleton className="h-4 w-16 mx-auto" />
                      </div>
                      <div className="text-center">
                        <Skeleton className="h-6 w-8 mx-auto mb-1" />
                        <Skeleton className="h-4 w-10 mx-auto" />
                      </div>
                      <div className="text-center">
                        <Skeleton className="h-6 w-8 mx-auto mb-1" />
                        <Skeleton className="h-4 w-12 mx-auto" />
                      </div>
                    </div>
                  </div>

                  {/* Column 3: Actions */}
                  <div className="flex flex-col items-center text-center space-y-3">
                    <Skeleton className="h-10 w-24" />
                    <Skeleton className="h-10 w-32" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-wrap gap-2">
                      <Skeleton className="h-6 w-16" />
                      <Skeleton className="h-6 w-20" />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Skeleton className="h-6 w-24" />
                      <Skeleton className="h-6 w-18" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cars Grid */}
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-5" />
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-5 w-8" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <Card
                      key={index}
                      className="overflow-hidden pt-0 hover:shadow-lg transition-shadow"
                    >
                      <CardContent className="p-0">
                        {/* Car Image */}
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

                        {/* Like count */}
                        <div className="flex items-center gap-1 mt-2">
                          <Skeleton className="h-4 w-4" />
                          <Skeleton className="h-4 w-8" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
