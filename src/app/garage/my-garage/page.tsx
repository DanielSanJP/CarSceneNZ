import MyGarageView from "@/components/garage/my-garage-view";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/utils/supabase/server";
import { UserGarageData } from "@/types/car";

// Cache this page for 5 minutes, then revalidate in the background
export const revalidate = 300; // 5 minutes

export default async function MyGaragePage() {
  // Server-side auth check - this will redirect if not authenticated
  const user = await getUser();
  const supabase = await createClient();

  console.log("🚀 SSR: Fetching user garage data using optimized RPC...");
  const startTime = Date.now();

  // Fetch initial my garage data server-side
  const { data, error } = await supabase.rpc("get_user_garage_optimized", {
    user_id_param: user.id,
  });

  if (error) {
    console.error("Error fetching my garage data:", error);
    throw new Error("Failed to load your garage");
  }

  console.log(
    `✅ SSR: User garage data fetched in ${Date.now() - startTime}ms`
  );

  const garageData: UserGarageData = data || {
    cars: [],
    total: 0,
    meta: {
      generated_at: new Date().toISOString(),
      cache_key: "",
    },
  };

  return <MyGarageView garageData={garageData} />;
}
