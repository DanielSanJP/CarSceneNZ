import { createClient } from "@/lib/utils/supabase/server";
import { GarageGallery } from "@/components/garage";
import { getUserOptional } from "@/lib/auth";
import { likeCarAction, unlikeCarAction } from "@/lib/server/cars";

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

  // If user is logged in, fetch their liked cars
  let carsWithLikedState = cars || [];
  if (user && cars) {
    const { data: likedCars } = await supabase
      .from("car_likes")
      .select("car_id")
      .eq("user_id", user.id);

    const likedCarIds = new Set(likedCars?.map((like) => like.car_id) || []);

    carsWithLikedState = cars.map((car) => ({
      ...car,
      is_liked: likedCarIds.has(car.id),
    }));
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <GarageGallery
            cars={carsWithLikedState}
            user={user}
            onLike={likeCarAction}
            onUnlike={unlikeCarAction}
          />
        </div>
      </div>
    </div>
  );
}
