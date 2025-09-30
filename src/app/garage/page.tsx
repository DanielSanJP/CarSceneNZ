import { getAuthUser, getUserProfile } from "@/lib/auth";
import { GarageGallery } from "@/components/garage/display/garage-gallery";
import { likeCarAction } from "@/lib/actions";
import type { GarageData } from "@/types/car";
import { createClient } from "@/lib/utils/supabase/server";

export const revalidate = 300; // 5 minutes

interface GaragePageProps {
  searchParams: Promise<{ page?: string }>;
}

// Helper function to get garage data using direct Supabase queries
async function getGarageData(
  page: number,
  limit: number,
  userId?: string
): Promise<GarageData> {
  const startTime = Date.now();

  console.log(
    `🚀 FETCH CACHE: Fetching garage page ${page} using direct queries...`
  );

  try {
    // Use direct Supabase queries instead of API route
    const supabase = await createClient();
    const offset = (page - 1) * limit;

    console.log(
      `🚀 FETCH CACHE: Fetching garage page ${page} via direct queries...`
    );

    // Get cars with owner information using direct query
    const { data: cars, error: carsError } = await supabase
      .from("cars")
      .select(
        `
        id,
        brand,
        model,
        year,
        images,
        total_likes,
        created_at,
        updated_at,
        owner_id,
        owner:users!cars_owner_id_fkey(
          id,
          username,
          display_name,
          profile_image_url
        )
      `
      )
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (carsError) {
      console.error("❌ Error fetching cars:", carsError);
      throw carsError;
    }

    console.log(`🔍 DEBUG: Fetched ${cars?.length || 0} cars from database`);

    // Transform cars to handle owner relationship (Supabase returns arrays, we need single objects)
    const transformedCars =
      cars?.map((car) => ({
        ...car,
        owner:
          Array.isArray(car.owner) && car.owner.length > 0
            ? car.owner[0]
            : undefined,
      })) || [];

    // Get user's liked cars if userId is provided
    let likedCarIds: string[] = [];
    if (userId && transformedCars.length > 0) {
      const carIds = transformedCars.map((car) => car.id);
      const { data: likes } = await supabase
        .from("car_likes")
        .select("car_id")
        .eq("user_id", userId)
        .in("car_id", carIds);

      likedCarIds = likes?.map((like) => like.car_id) || [];
    }

    // Add is_liked flag to cars and fix owner type
    const carsWithLikes = transformedCars.map((car) => ({
      ...car,
      is_liked: likedCarIds.includes(car.id),
      owner: car.owner
        ? {
            ...car.owner,
            display_name: car.owner.display_name || undefined,
            profile_image_url: car.owner.profile_image_url || undefined,
          }
        : {
            id: car.owner_id,
            username: "Unknown",
            display_name: undefined,
            profile_image_url: undefined,
          },
    }));

    const garageApiData = {
      cars: carsWithLikes,
      pagination: {
        page,
        limit,
        total: 0, // We don't fetch total count for performance, but some components may expect it
        totalPages: 0, // Same here
        hasMore: (cars?.length || 0) === limit,
      },
      meta: {
        generated_at: new Date().toISOString(),
        cache_key: `garage_${page}_${limit}`,
      },
    };

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
