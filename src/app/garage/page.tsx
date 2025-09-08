import { GarageGallery } from "@/components/garage";
import { getUserOptional } from "@/lib/auth";
import {
  getCarsPaginated,
  likeCarAction,
  unlikeCarAction,
} from "@/lib/server/cars";

interface GaragePageProps {
  searchParams: { page?: string };
}

export default async function GaragePage({ searchParams }: GaragePageProps) {
  // Get authenticated user with profile (cached per request) - null if not logged in
  const user = await getUserOptional();

  // Await searchParams before accessing properties (Next.js 15 requirement)
  const resolvedSearchParams = await searchParams;

  // Get page from search params, default to 1
  const page = Number(resolvedSearchParams.page) || 1;
  const limit = 12; // Show 12 cars per page

  // Fetch paginated cars with optimized cached function
  const { cars: carsWithLikedState, total } = await getCarsPaginated(
    page,
    limit,
    user?.id
  );

  // Calculate pagination info
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <GarageGallery
            cars={carsWithLikedState}
            user={user}
            onLike={likeCarAction}
            onUnlike={unlikeCarAction}
            currentPage={page}
            totalPages={totalPages}
            totalCars={total}
          />
        </div>
      </div>
    </div>
  );
}
