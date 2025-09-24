import { getAuthUser, getUserProfile } from "@/lib/auth";
import { CarDetailView } from "@/components/garage/display/car-detail-view";
import { likeCarAction } from "@/lib/actions";
import type { CarDetailData } from "@/types/car";
import { getBaseUrl } from "@/lib/utils";

interface CarDetailPageProps {
  params: Promise<{ id: string }>;
}

// Helper function to get car details using cached API route
async function getCarDetailData(
  carId: string,
  userId?: string
): Promise<CarDetailData> {
  try {
    // Use our API route with Next.js native fetch for caching
    const url = new URL(`${getBaseUrl()}/api/garage/${carId}`);
    if (userId) {
      url.searchParams.set("userId", userId);
    }

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      // Enable Next.js caching with 5 minute revalidation
      next: {
        revalidate: 300, // 5 minutes
        tags: ["garage", "cars", `car-${carId}`],
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("Car not found");
      }
      throw new Error(`Failed to fetch car: ${response.status}`);
    }

    const carDetailData = await response.json();

    return carDetailData;
  } catch (error) {
    console.error("❌ Error fetching car details:", error);
    throw error;
  }
}

interface CarDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function CarDetailsPage({ params }: CarDetailPageProps) {
  const { id } = await params;

  try {
    // Get user directly in server component
    const authUser = await getAuthUser();
    const user = authUser ? await getUserProfile(authUser.id) : null;

    // Get car details using our cached API route
    const carDetailData = await getCarDetailData(id, user?.id);

    return (
      <CarDetailView
        user={user}
        carDetailData={carDetailData}
        likeCarAction={likeCarAction}
      />
    );
  } catch (error) {
    console.error("❌ Error loading car on server:", error);

    // Return error state instead of notFound() to see what's happening
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">
            Failed to load car details
          </h2>
          <p className="text-muted-foreground mb-6">
            There was an error loading the car information.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }
}
