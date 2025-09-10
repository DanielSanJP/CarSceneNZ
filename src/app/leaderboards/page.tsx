import { LeaderboardsView } from "@/components/leaderboard/leaderboards-view";
import { createClient } from "@/lib/utils/supabase/server";
import type {
  LeaderboardsData,
  CarRanking,
  OwnerRanking,
  ClubRanking,
} from "@/types/leaderboard";

// Cache this page for 5 minutes, then revalidate in the background
export const revalidate = 300; // 5 minutes

// Server-side leaderboards data fetching using direct Supabase queries
async function getLeaderboardsDataSSR(): Promise<LeaderboardsData> {
  const supabase = await createClient();
  const startTime = Date.now();

  try {
    // Fetch top cars with owner info
    const { data: carsData, error: carsError } = await supabase
      .from("cars")
      .select(
        `
        id,
        brand,
        model,
        year,
        images,
        total_likes,
        owner_id,
        created_at,
        updated_at,
        users!cars_owner_id_fkey (
          id,
          username,
          display_name,
          profile_image_url,
          created_at,
          updated_at
        )
      `
      )
      .order("total_likes", { ascending: false })
      .order("created_at", { ascending: true })
      .limit(10);

    if (carsError) {
      console.error("Error fetching cars:", carsError);
      throw new Error("Failed to fetch cars data");
    }

    // Fetch top owners (users with most total likes across all their cars)
    const { data: usersData, error: usersError } = await supabase.from("users")
      .select(`
        id,
        username,
        display_name,
        profile_image_url,
        created_at,
        updated_at,
        cars!cars_owner_id_fkey (
          total_likes
        )
      `);

    if (usersError) {
      console.error("Error fetching users:", usersError);
      throw new Error("Failed to fetch users data");
    }

    // Fetch top clubs with leader info
    const { data: clubsData, error: clubsError } = await supabase
      .from("clubs")
      .select(
        `
        id,
        name,
        description,
        banner_image_url,
        total_likes,
        leader_id,
        club_type,
        location,
        created_at,
        updated_at,
        users!clubs_leader_id_fkey (
          id,
          username,
          display_name,
          profile_image_url,
          created_at,
          updated_at
        ),
        club_members (
          id
        )
      `
      )
      .order("total_likes", { ascending: false })
      .order("created_at", { ascending: true })
      .limit(10);

    if (clubsError) {
      console.error("Error fetching clubs:", clubsError);
      throw new Error("Failed to fetch clubs data");
    }

    // Process cars data
    const carRankings: CarRanking[] = (carsData || [])
      .filter((car) => car && car.id && car.total_likes > 0)
      .map((car, index) => {
        const ownerData = Array.isArray(car.users) ? car.users[0] : car.users;
        return {
          rank: index + 1,
          likes: car.total_likes || 0,
          car: {
            id: car.id,
            owner_id: car.owner_id,
            brand: car.brand,
            model: car.model,
            year: car.year,
            images: car.images || [],
            total_likes: car.total_likes || 0,
            created_at: car.created_at,
            updated_at: car.updated_at,
            owner: ownerData
              ? {
                  id: ownerData.id,
                  username: ownerData.username || "unknown",
                  display_name: ownerData.display_name || "Unknown User",
                  profile_image_url: ownerData.profile_image_url,
                  created_at: ownerData.created_at,
                  updated_at: ownerData.updated_at,
                }
              : {
                  id: car.owner_id,
                  username: "unknown",
                  display_name: "Unknown User",
                  profile_image_url: null,
                  created_at: car.created_at,
                  updated_at: car.updated_at,
                },
          },
        };
      });

    // Process owners data - calculate total likes and sort
    const ownersWithTotals = (usersData || [])
      .filter((owner) => owner && owner.id)
      .map((owner) => {
        const carsArray = Array.isArray(owner.cars) ? owner.cars : [];
        const totalLikes = carsArray.reduce(
          (sum: number, car: { total_likes?: number }) =>
            sum + (car.total_likes || 0),
          0
        );
        return {
          owner: {
            id: owner.id,
            username: owner.username || "unknown",
            display_name: owner.display_name || "Unknown User",
            profile_image_url: owner.profile_image_url,
            created_at: owner.created_at,
            updated_at: owner.updated_at,
          },
          totalLikes,
          carCount: carsArray.length,
        };
      })
      .filter((owner) => owner.totalLikes > 0)
      .sort((a, b) => b.totalLikes - a.totalLikes)
      .slice(0, 10);

    const ownerRankings: OwnerRanking[] = ownersWithTotals.map(
      (ownerData, index) => ({
        rank: index + 1,
        owner: ownerData.owner,
        totalLikes: ownerData.totalLikes,
        carCount: ownerData.carCount,
      })
    );

    // Process clubs data
    const clubRankings: ClubRanking[] = (clubsData || [])
      .filter((club) => club && club.id && club.total_likes > 0)
      .map((club, index) => {
        const leaderData = Array.isArray(club.users)
          ? club.users[0]
          : club.users;
        return {
          rank: index + 1,
          likes: club.total_likes || 0,
          memberCount: Array.isArray(club.club_members)
            ? club.club_members.length
            : 0,
          club: {
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
            leader: leaderData
              ? {
                  id: leaderData.id,
                  username: leaderData.username || "unknown",
                  display_name: leaderData.display_name || "Unknown Leader",
                  profile_image_url: leaderData.profile_image_url,
                  created_at: leaderData.created_at,
                  updated_at: leaderData.updated_at,
                }
              : {
                  id: club.leader_id,
                  username: "unknown",
                  display_name: "Unknown Leader",
                  profile_image_url: null,
                  created_at: club.created_at,
                  updated_at: club.updated_at,
                },
          },
        };
      });

    const leaderboardsData: LeaderboardsData = {
      cars: carRankings,
      owners: ownerRankings,
      clubs: clubRankings,
      meta: {
        generated_at: new Date().toISOString(),
        cache_key: `leaderboards_ssr_${Date.now()}`,
      },
    };

    console.log(
      `✅ SSR: Leaderboards data fetched in ${Date.now() - startTime}ms`
    );
    return leaderboardsData;
  } catch (error) {
    console.error("Error fetching leaderboards data:", error);
    throw new Error("Failed to fetch leaderboards data");
  }
}

export default async function LeaderboardsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; page?: string }>;
}) {
  const params = await searchParams;

  // Fetch leaderboards data using optimized RPC functions
  let leaderboardsData: LeaderboardsData | null = null;
  try {
    leaderboardsData = await getLeaderboardsDataSSR();
  } catch (error) {
    console.error("Failed to fetch leaderboards data on server:", error);
    // Return error state
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">
            Failed to load leaderboards
          </h2>
          <p className="text-muted-foreground mb-6">
            There was an error loading the leaderboards data.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold tracking-tight mb-4">
              Community Leaderboards
            </h1>
            <p className="text-xl text-muted-foreground">
              Top performers in the Car Scene NZ community
            </p>
          </div>

          <LeaderboardsView
            defaultTab={params.tab as "owners" | "clubs" | "cars"}
            leaderboardsData={leaderboardsData}
          />
        </div>
      </div>
    </div>
  );
}
