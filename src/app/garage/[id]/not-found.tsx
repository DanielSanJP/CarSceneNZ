import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Car } from "lucide-react";

export default function CarNotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-muted p-6">
            <Car className="h-16 w-16 text-muted-foreground" />
          </div>
        </div>

        <h1 className="text-4xl font-bold mb-2">Car Not Found</h1>

        <p className="text-muted-foreground mb-8">
          This car doesn&apos;t exist or may have been deleted. Check out other
          cars in the garage!
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild>
            <Link href="/garage">Browse Garage</Link>
          </Button>

          <Button variant="outline" asChild>
            <Link href="/">Go Home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
