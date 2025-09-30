import { getAuthUser, getUserProfile } from "@/lib/auth";
import { ClubDetailView } from "@/components/clubs/display/club-detail-view";
import type { ClubDetailData } from "@/types/club";
import { createClient } from "@/lib/utils/supabase/server";

export const revalidate = 60; // 1 minute

interface ClubDetailPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string; tab?: string }>;
}

// Server-side club detail data fetching using direct Supabase queries
async function getClubDetailDataSSR(
  clubId: string,
  currentUserId?: string
): Promise<ClubDetailData> {
  const startTime = Date.now();

  try {
    console.log(
      `🚀 SSR CACHE: Fetching club ${clubId} detail via direct queries...`
    );

    // Use direct Supabase queries instead of API route
    const supabase = await createClient();

    console.log(
      `🚀 SIMPLE: Fetching club ${clubId} detail using direct queries...`
    );

    // 1. Get club basic info from club_stats view for accurate total_likes
    const { data: club, error: clubError } = await supabase
      .from("club_stats")
      .select("*")
      .eq("id", clubId)
      .single();

    if (clubError || !club) {
      console.error("❌ Club not found:", clubError);
      throw new Error("Club not found");
    }

    // 2. Get club leader info
    const { data: leader } = await supabase
      .from("users")
      .select("id, username, display_name, profile_image_url")
      .eq("id", club.leader_id)
      .single();

    // 3. Get members
    const { data: members, error: membersError } = await supabase
      .from("club_members")
      .select("user_id, role, joined_at")
      .eq("club_id", clubId);

    if (membersError) {
      console.error("❌ Error fetching members:", membersError);
      throw new Error("Failed to fetch members");
    }

    // 4. Get user info for each member and their car stats
    const membersWithStats = await Promise.all(
      (members || []).map(async (member) => {
        // Get user info
        const { data: user } = await supabase
          .from("users")
          .select("id, username, display_name, profile_image_url")
          .eq("id", member.user_id)
          .single();

        // Get car stats
        const { data: carStats } = await supabase
          .from("cars")
          .select("id, total_likes, brand, model")
          .eq("owner_id", member.user_id);

        const totalCars = carStats?.length || 0;
        const totalLikes =
          carStats?.reduce((sum, car) => sum + (car.total_likes || 0), 0) || 0;

        // Find most liked car - handle empty array case
        const mostLikedCar =
          carStats && carStats.length > 0
            ? carStats.reduce((prev, current) =>
                current.total_likes > (prev?.total_likes || 0) ? current : prev
              )
            : null;

        return {
          user: user || {
            id: member.user_id,
            username: "Unknown",
            display_name: "Unknown User",
            profile_image_url: null,
          },
          role: member.role,
          joined_at: member.joined_at,
          total_cars: totalCars,
          total_likes: totalLikes,
          most_liked_car_brand: mostLikedCar?.brand || null,
          most_liked_car_model: mostLikedCar?.model || null,
          most_liked_car_likes: mostLikedCar?.total_likes || 0,
        };
      })
    );

    // 5. Check if current user is a member
    const isUserMember = currentUserId
      ? members.some((member) => member.user_id === currentUserId)
      : false;

    // 6. Build response
    const data = {
      club: {
        ...club,
        total_likes: club.calculated_total_likes, // Map calculated_total_likes to total_likes for compatibility
        leader,
        isUserMember,
      },
      members: membersWithStats,
      memberCount: membersWithStats.length,
      meta: {
        generated_at: new Date().toISOString(),
        cache_key: `club_detail_${clubId}_${currentUserId || "anon"}`,
      },
    };

    console.log(
      `✅ SSR CACHE: Club ${clubId} detail fetched via API route in ${
        Date.now() - startTime
      }ms`
    );

    return data;
  } catch (error) {
    console.error("Error fetching club detail data:", error);
    throw new Error("Failed to fetch club detail data");
  }
}

export default async function ClubDetailPage({
  params,
  searchParams,
}: ClubDetailPageProps) {
  const { id } = await params;
  const { from = "join", tab = "clubs" } = await searchParams;

  // Get current user (optional)
  const authUser = await getAuthUser();
  const currentUser = authUser ? await getUserProfile(authUser.id) : null;

  // Fetch club detail data using cached API route
  let clubDetailData: ClubDetailData | null = null;
  try {
    clubDetailData = await getClubDetailDataSSR(id, currentUser?.id);
  } catch (error) {
    console.error("Failed to fetch club detail data on server:", error);
    // Return error state
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">
            Failed to load club details
          </h2>
          <p className="text-muted-foreground mb-6">
            There was an error loading the club information.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <ClubDetailView
        currentUser={currentUser}
        fromTab={from}
        leaderboardTab={tab}
        clubDetailData={clubDetailData}
      />
    </>
  );
}

// (Already exported at top of file)
