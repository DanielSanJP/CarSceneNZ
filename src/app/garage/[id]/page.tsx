import { getUserOptional } from "@/lib/auth";
import { createClient } from "@/lib/utils/supabase/server";
import { isCarLiked, likeCarAction, unlikeCarAction } from "@/lib/server/cars";
import { notFound } from "next/navigation";
import { CarDetailView } from "@/components/garage/display/car-detail-view";

interface CarDetailPageProps {
  params: { id: string };
}

export default async function CarDetailPage({ params }: CarDetailPageProps) {
  // Get user (optional - not required to view cars)
  const user = await getUserOptional();
  const { id } = await params;

  // Fetch car data directly from database
  const supabase = await createClient();
  const { data: car, error } = await supabase
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
    .eq("id", id)
    .single();

  if (error || !car) {
    console.error("Error fetching car:", error);
    notFound();
  }

  // Check if user has liked this car
  let userHasLiked = false;
  if (user) {
    userHasLiked = await isCarLiked(id, user.id);
  }

  // Add liked state to car object
  const carWithLikedState = {
    ...car,
    is_liked: userHasLiked,
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <CarDetailView
            car={carWithLikedState}
            user={user}
            onLike={likeCarAction}
            onUnlike={unlikeCarAction}
          />
        </div>
      </div>
    </div>
  );
}
