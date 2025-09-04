import { Suspense } from "react";
import { getUserOptional } from "@/lib/auth";
import { createClient } from "@/lib/utils/supabase/server";
import { ClubsGallery } from "@/components/clubs/clubs-gallery";

// Force dynamic rendering since we use authentication/cookies
export const dynamic = "force-dynamic";

export default async function ClubsPage() {
  // Get user (optional)
  const currentUser = await getUserOptional();

  // Fetch clubs directly from database
  const supabase = await createClient();
  const { data: clubs, error } = await supabase
    .from("clubs")
    .select(
      `
      *,
      users!clubs_leader_id_fkey (
        id,
        username,
        display_name,
        profile_image_url
      )
    `
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching clubs:", error);
  }

  // Transform data to match expected format
  const transformedClubs = (clubs || []).map((club) => ({
    id: club.id,
    name: club.name,
    description: club.description,
    banner_image_url: club.banner_image_url,
    club_type: club.club_type,
    location: club.location,
    leader_id: club.leader_id,
    total_likes: club.total_likes || 0,
    created_at: club.created_at,
    updated_at: club.updated_at,
    leader: {
      id: club.users.id,
      username: club.users.username,
      display_name: club.users.display_name || club.users.username,
      profile_image_url: club.users.profile_image_url,
    },
  }));

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background">
          <div className="container mx-auto px-4 py-8">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-8">
                <h1 className="text-4xl font-bold mb-4">🏁 Car Clubs</h1>
                <p className="text-muted-foreground mb-6">Loading...</p>
              </div>
            </div>
          </div>
        </div>
      }
    >
      <ClubsGallery
        clubs={transformedClubs}
        currentUser={
          currentUser
            ? {
                ...currentUser,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              }
            : null
        }
      />
    </Suspense>
  );
}
