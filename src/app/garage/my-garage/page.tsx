import MyGarageView from "@/components/garage/my-garage-view";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/utils/supabase/server";
import { UserGarageData } from "@/types/car";

// Force dynamic rendering for authentication
export const dynamic = "force-dynamic";

export default async function MyGaragePage() {
  // Server-side auth check - this will redirect if not authenticated
  const user = await getUser();
  const supabase = await createClient();

  // Fetch initial my garage data server-side
  const { data, error } = await supabase.rpc("get_user_garage_optimized", {
    user_id_param: user.id,
  });

  if (error) {
    console.error("Error fetching my garage data:", error);
    throw new Error("Failed to load your garage");
  }

  const initialData: UserGarageData = data || {
    cars: [],
    total: 0,
    meta: {
      generated_at: new Date().toISOString(),
      cache_key: "",
    },
  };

  return <MyGarageView initialData={initialData} />;
}
