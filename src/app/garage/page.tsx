import { createClient } from "@/lib/utils/supabase/server";
import { GarageGallery } from "@/components/garage";
import { getUserOptional } from "@/lib/auth";

export default async function GaragePage() {
  // Get authenticated user with profile (cached per request) - null if not logged in
  const user = await getUserOptional();

  // Fetch cars directly from database
  const supabase = await createClient();
  const { data: cars, error } = await supabase
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
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching cars:", error);
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <GarageGallery cars={cars || []} user={user} />
        </div>
      </div>
    </div>
  );
}
