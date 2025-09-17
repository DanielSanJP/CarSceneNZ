import { getAuthUser, getUserProfile } from "@/lib/auth";
import { GarageGallery } from "@/components/garage/display/garage-gallery";
import { likeCarAction } from "@/lib/actions";
import type { GarageData } from "@/types/car";
import { getBaseUrl } from "@/lib/utils";

interface GaragePageProps {
  searchParams: Promise<{ page?: string }>;
}

// Helper function to get garage data using cached API route
async function getGarageData(
  page: number,
  limit: number,
  userId?: string
): Promise<GarageData> {
  const startTime = Date.now();

  console.log(
    `🚀 FETCH CACHE: Fetching garage page ${page} using API route...`
  );

  try {
    // Use our API route with Next.js native fetch for caching
    const response = await fetch(`${getBaseUrl()}/api/garage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        page,
        limit,
        userId: userId || null,
      }),
      // Enable Next.js caching with 5 minute revalidation
      next: {
        revalidate: 300, // 5 minutes
        tags: ["garage", `garage-page-${page}`],
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch garage: ${response.status}`);
    }

    const garageApiData = await response.json();

    const endTime = Date.now();
    console.log(
      `✅ FETCH CACHE: Garage page ${page} fetched in ${endTime - startTime}ms`
    );

    return {
      cars: garageApiData.cars,
      pagination: garageApiData.pagination,
      meta: garageApiData.meta,
      currentUser: null, // Will be added by the page component
    };
  } catch (error) {
    console.error("❌ Error fetching garage data:", error);
    throw error;
  }
}

interface GaragePageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function GaragePage({ searchParams }: GaragePageProps) {
  // Await searchParams before accessing properties (Next.js 15 requirement)
  const resolvedSearchParams = await searchParams;

  // Get page from search params, default to 1
  const page = Number(resolvedSearchParams.page) || 1;
  const limit = 12; // Show 12 cars per page

  // Get user (optional - not required to view garage)
  const authUser = await getAuthUser();
  const user = authUser ? await getUserProfile(authUser.id) : null;

  try {
    // Get garage data using our cached API route
    const garageApiData = await getGarageData(page, limit, user?.id);

    // Prepare complete garage data with user information
    const garageData: GarageData = {
      ...garageApiData,
      currentUser: user
        ? {
            id: user.id,
            username: user.username,
            display_name: user.display_name,
            profile_image_url: user.profile_image_url,
          }
        : null,
    };

    return (
      <GarageGallery
        page={page}
        limit={limit}
        garageData={garageData}
        likeCarAction={likeCarAction}
      />
    );
  } catch (error) {
    console.error("Error loading garage:", error);
    // Return null data to show error state
    return (
      <GarageGallery
        page={page}
        limit={limit}
        garageData={null}
        likeCarAction={likeCarAction}
      />
    );
  }
}
