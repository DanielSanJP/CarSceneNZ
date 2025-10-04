import { LeaderboardsView } from "@/components/leaderboard/leaderboards-view";
import type { LeaderboardsData } from "@/types/leaderboard";
import { createClient } from "@/lib/utils/supabase/server";

// RPC function return types based on the actual database function implementations
interface TopCarRPC {
  id: string;
  brand: string;
  model: string;
  year: number;
  images?: string[];
  total_likes: number;
  created_at: string;
  updated_at: string;
  owner_id: string;
  owner_username: string;
  owner_display_name?: string;
  owner_profile_image_url?: string;
  owner_created_at: string;
  owner_updated_at: string;
}

interface TopOwnerRPC {
  id: string;
  username: string;
  display_name?: string;
  profile_image_url?: string;
  created_at: string;
  updated_at: string;
  total_likes: number;
  car_count: number;
}

interface TopClubRPC {
  id: string;
  name: string;
  description?: string;
  banner_image_url?: string;
  club_type?: "open" | "invite" | "closed";
  location?: string;
  total_likes: number;
  created_at: string;
  updated_at: string;
  leader_id: string;
  member_count: number;
}

// Cache this page for 5 minutes, then revalidate in the background
export const revalidate = 300; // 5 minutes

// Server-side leaderboards data fetching using direct Supabase calls
async function getLeaderboardsData(): Promise<LeaderboardsData> {
  const startTime = Date.now();

  console.log(
    "🚀 FETCH CACHE: Fetching leaderboards using direct Supabase calls..."
  );

  try {
    const supabase = await createClient();
    const limit = 200;

    console.log(`🔍 DEBUG: Fetching top ${limit} entries for each leaderboard`);

    // Fetch all three leaderboards in parallel
    const [carsResult, ownersResult, clubsResult] = await Promise.all([
      // Top Cars RPC
      supabase.rpc("get_top_cars", { result_limit: limit }),

      // Top Owners RPC
      supabase.rpc("get_top_owners", { result_limit: limit }),

      // Top Clubs RPC
      supabase.rpc("get_top_clubs", { result_limit: limit }),
    ]);

    // Check for errors
    if (carsResult.error) {
      console.error(`❌ Cars RPC failed:`, carsResult.error);
      throw carsResult.error;
    }

    if (ownersResult.error) {
      console.error(`❌ Owners RPC failed:`, ownersResult.error);
      throw ownersResult.error;
    }

    if (clubsResult.error) {
      console.error(`❌ Clubs query failed:`, clubsResult.error);
      throw clubsResult.error;
    }

    // Transform the raw RPC results to match TypeScript interfaces
    const transformedCars = ((carsResult.data as TopCarRPC[]) || []).map(
      (item: TopCarRPC, index: number) => ({
        car: {
          id: item.id,
          brand: item.brand,
          model: item.model,
          year: item.year,
          images: item.images,
          total_likes: item.total_likes,
          created_at: item.created_at,
          updated_at: item.updated_at,
          owner_id: item.owner_id,
          owner: {
            id: item.owner_id,
            username: item.owner_username,
            display_name: item.owner_display_name,
            profile_image_url: item.owner_profile_image_url,
            created_at: item.owner_created_at,
            updated_at: item.owner_updated_at,
          },
        },
        rank: index + 1,
        likes: item.total_likes,
      })
    );

    const transformedOwners = ((ownersResult.data as TopOwnerRPC[]) || []).map(
      (item: TopOwnerRPC, index: number) => ({
        owner: {
          id: item.id,
          username: item.username,
          display_name: item.display_name,
          profile_image_url: item.profile_image_url,
          created_at: item.created_at,
          updated_at: item.updated_at,
        },
        rank: index + 1,
        totalLikes: item.total_likes,
        carCount: item.car_count,
      })
    );

    const transformedClubs = ((clubsResult.data as TopClubRPC[]) || []).map(
      (item: TopClubRPC, index: number) => ({
        club: {
          id: item.id,
          name: item.name,
          description: item.description,
          banner_image_url: item.banner_image_url,
          club_type: item.club_type,
          location: item.location,
          total_likes: item.total_likes,
          created_at: item.created_at,
          updated_at: item.updated_at,
          leader_id: item.leader_id,
        },
        rank: index + 1,
        likes: item.total_likes,
        memberCount: item.member_count,
      })
    );

    const leaderboardsData: LeaderboardsData = {
      cars: transformedCars,
      owners: transformedOwners,
      clubs: transformedClubs,
      meta: {
        generated_at: new Date().toISOString(),
        cache_key: `leaderboards_${limit}_${Date.now()}`,
      },
    };

    const endTime = Date.now();
    console.log(
      `✅ FETCH CACHE: Leaderboards data fetched in ${endTime - startTime}ms`
    );
    console.log(
      `📊 Data counts - Cars: ${leaderboardsData.cars?.length || 0}, Owners: ${
        leaderboardsData.owners?.length || 0
      }, Clubs: ${leaderboardsData.clubs?.length || 0}`
    );

    return leaderboardsData;
  } catch (error) {
    console.error("❌ Error fetching leaderboards data:", error);
    throw new Error("Failed to load leaderboards data");
  }
}

interface LeaderboardsPageProps {
  searchParams: Promise<{ tab?: string }>;
}

export default async function LeaderboardsPage({
  searchParams,
}: LeaderboardsPageProps) {
  // Await searchParams before accessing properties (Next.js 15 requirement)
  const resolvedSearchParams = await searchParams;

  // Get tab from search params, default to 'owners'
  const tab = resolvedSearchParams.tab || "owners";
  const validTab = ["owners", "clubs", "cars"].includes(tab) ? tab : "owners";

  try {
    // Fetch leaderboards data using cached API route
    const leaderboardsData = await getLeaderboardsData();

    return (
      <div className="w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]">
        <LeaderboardsView
          defaultTab={validTab as "owners" | "clubs" | "cars"}
          leaderboardsData={leaderboardsData}
        />
      </div>
    );
  } catch (error) {
    console.error("Error loading leaderboards:", error);
    return (
      <div className="w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]">
        <div className="container mx-auto px-4 py-6">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl font-bold mb-4">
              🏆 Community Leaderboards
            </h1>
            <p className="text-muted-foreground mb-6">
              Sorry, we couldn&apos;t load the leaderboards right now.
            </p>
          </div>
        </div>
      </div>
    );
  }
}
