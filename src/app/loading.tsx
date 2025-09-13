import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader } from "@/components/ui/card";

export default function HomeLoading() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section Skeleton */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center space-y-6">
          <Skeleton className="h-6 w-48 mx-auto" />
          <Skeleton className="h-16 w-96 mx-auto" />
          <Skeleton className="h-6 w-full max-w-2xl mx-auto" />
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Skeleton className="h-12 w-40" />
            <Skeleton className="h-12 w-40" />
          </div>
        </div>
      </section>

      {/* Events Section Skeleton */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <Skeleton className="h-8 w-64 mx-auto mb-4" />
          <Skeleton className="h-4 w-96 mx-auto" />
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card className="pt-0" key={i}>
              <div className="aspect-square">
                <Skeleton className="h-full w-full" />
              </div>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-full" />
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      {/* Cars Section Skeleton */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <Skeleton className="h-8 w-64 mx-auto mb-4" />
          <Skeleton className="h-4 w-96 mx-auto" />
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card className="pt-0" key={i}>
              <div className="aspect-square">
                <Skeleton className="h-full w-full" />
              </div>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-16" />
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      {/* Features Section Skeleton */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <Skeleton className="h-8 w-64 mx-auto mb-4" />
          <Skeleton className="h-4 w-96 mx-auto" />
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="text-center">
              <CardHeader>
                <Skeleton className="h-12 w-12 mx-auto mb-4" />
                <Skeleton className="h-6 w-24 mx-auto" />
                <Skeleton className="h-12 w-full" />
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
