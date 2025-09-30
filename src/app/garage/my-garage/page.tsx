import MyGarageView from "@/components/garage/my-garage-view";
import { requireAuth } from "@/lib/auth";
import { UserGarageData } from "@/types/car";
import { createClient } from "@/lib/utils/supabase/server";

// Cache this page for 5 minutes, then revalidate in the background
export const revalidate = 300; // 5 minutes

export default async function MyGaragePage() {
  // Server-side auth check - this will redirect if not authenticated
  const authUser = await requireAuth();

  console.log("🚀 SSR CACHE: Fetching user garage data via direct queries...");
  const startTime = Date.now();

  const supabase = await createClient();

  // Get user's cars - simple query!
  const { data: userCars, error: carsError } = await supabase
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
      owner_id
    `
    )
    .eq("owner_id", authUser.id)
    .order("created_at", { ascending: false });

  if (carsError) {
    console.error("❌ Error fetching user cars:", carsError);
    throw new Error("Failed to load your garage");
  }

  console.log(
    `🔍 DEBUG: Found ${userCars?.length || 0} cars for user ${authUser.id}`
  );

  const garageData: UserGarageData = {
    cars:
      userCars?.map((car) => ({
        id: car.id,
        brand: car.brand,
        model: car.model,
        year: car.year,
        images: car.images || [],
        total_likes: car.total_likes,
        created_at: car.created_at,
        updated_at: car.updated_at,
        owner_id: car.owner_id,
      })) || [],
    total: userCars?.length || 0,
    meta: {
      generated_at: new Date().toISOString(),
      cache_key: `user_garage_${authUser.id}_${Date.now()}`,
    },
  };

  console.log(
    `✅ SSR CACHE: User garage data fetched via direct queries in ${
      Date.now() - startTime
    }ms`
  );
  console.log(`📊 Final data - User cars: ${garageData.total}`);

  return <MyGarageView garageData={garageData} />;
}
