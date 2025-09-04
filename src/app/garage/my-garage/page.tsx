import MyGarageView from "@/components/garage/my-garage-view";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/utils/supabase/server";

export default async function MyGaragePage() {
  // Server-side auth check
  const user = await getUser();

  // Fetch user's cars directly from database
  const supabase = await createClient();
  const { data: userCars, error } = await supabase
    .from("cars")
    .select(
      `
      *,
      owner:users!owner_id (
        id,
        username,
        display_name,
        profile_image_url
      )
    `
    )
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching user cars:", error);
  }

  return <MyGarageView cars={userCars || []} />;
}
