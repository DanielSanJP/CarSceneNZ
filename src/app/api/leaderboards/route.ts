import { NextRequest, NextResponse } from "next/server";

// Define types for RPC results
type CarRPCResult = {
  id: string;
  owner_id: string;
  brand: string;
  model: string;
  year: number;
  images: string[];
  total_likes: number;
  created_at: string;
  updated_at: string;
  owner_username: string;
  owner_display_name: string | null;
  owner_profile_image_url: string | null;
  owner_created_at: string;
  owner_updated_at: string;
};

type OwnerRPCResult = {
  id: string;
  username: string;
  display_name: string | null;
  profile_image_url: string | null;
  created_at: string;
  updated_at: string;
  total_likes: number;
  car_count: number;
};

type ClubRPCResult = {
  id: string;
  name: string;
  description: string | null;
  banner_image_url: string | null;
  calculated_total_likes: number; // From club_stats view
  leader_id: string;
  club_type: string;
  location: string;
  created_at: string;
  updated_at: string;
  member_count: number; // From club_stats view
  total_cars: number; // From club_stats view
};

export async function GET(request: NextRequest) {
  try {
    const startTime = Date.now();
    console.log("🚀 FETCH CACHE: Fetching leaderboards data via API route...");

    // Get environment variables for native fetch
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error("❌ Missing Supabase environment variables");
      throw new Error("Server configuration error");
    }

    // Get limit from query parameters (default 200 for comprehensive leaderboards)
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "200"), 200);

    console.log(`🔍 DEBUG: Fetching top ${limit} entries for each leaderboard`);

    // Fetch all three leaderboards in parallel using native fetch for caching
    const [carsResponse, ownersResponse, clubsResponse] = await Promise.all([
      // Top Cars RPC
      fetch(`${supabaseUrl}/rest/v1/rpc/get_top_cars`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({
          result_limit: limit,
        }),
        next: {
          revalidate: 300, // 5 minutes cache
          tags: ["leaderboards", "cars", "garage"],
        },
      }),

      // Top Owners RPC
      fetch(`${supabaseUrl}/rest/v1/rpc/get_top_owners`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({
          result_limit: limit,
        }),
        next: {
          revalidate: 300, // 5 minutes cache
          tags: ["leaderboards", "owners", "users"],
        },
      }),

      // Top Clubs - Use club_stats view for accurate total_likes
      fetch(`${supabaseUrl}/rest/v1/club_stats?select=*&order=calculated_total_likes.desc&limit=${limit}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
        next: {
          revalidate: 300, // 5 minutes cache
          tags: ["leaderboards", "clubs"],
        },
      }),
    ]);

    // Check all responses
    if (!carsResponse.ok) {
      console.error(`❌ Cars RPC failed: ${carsResponse.status} ${carsResponse.statusText}`);
      throw new Error(`Failed to fetch cars leaderboard: ${carsResponse.status}`);
    }

    if (!ownersResponse.ok) {
      console.error(`❌ Owners RPC failed: ${ownersResponse.status} ${ownersResponse.statusText}`);
      throw new Error(`Failed to fetch owners leaderboard: ${ownersResponse.status}`);
    }

    if (!clubsResponse.ok) {
      console.error(`❌ Clubs RPC failed: ${clubsResponse.status} ${clubsResponse.statusText}`);
      throw new Error(`Failed to fetch clubs leaderboard: ${clubsResponse.status}`);
    }

    // Parse all responses
    const [carsData, ownersData, clubsData] = await Promise.all([
      carsResponse.json(),
      ownersResponse.json(),
      clubsResponse.json(),
    ]);

    console.log(`🔍 DEBUG: Raw data lengths - Cars: ${carsData?.length || 0}, Owners: ${ownersData?.length || 0}, Clubs: ${clubsData?.length || 0}`);

    // For clubs, we need to fetch leader data separately since club_stats view doesn't include it
    const leaderIds = clubsData?.map((club: ClubRPCResult) => club.leader_id).filter(Boolean) || [];
    const leadersMap: Record<string, { id: string; username: string; display_name?: string; profile_image_url?: string }> = {};
    
    if (leaderIds.length > 0) {
      const leadersResponse = await fetch(`${supabaseUrl}/rest/v1/users?select=id,username,display_name,profile_image_url&id=in.(${leaderIds.join(',')})`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      });
      
      if (leadersResponse.ok) {
        const leadersData = await leadersResponse.json();
        leadersData?.forEach((leader: { id: string; username: string; display_name?: string; profile_image_url?: string }) => {
          leadersMap[leader.id] = leader;
        });
      }
    }

    // Transform data to match LeaderboardsData interface
    const leaderboardsData = {
      cars: (carsData || []).map((car: CarRPCResult, index: number) => ({
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
          owner: {
            id: car.owner_id,
            username: car.owner_username || "unknown",
            display_name: car.owner_display_name || "Unknown User",
            profile_image_url: car.owner_profile_image_url,
            created_at: car.owner_created_at,
            updated_at: car.owner_updated_at,
          },
        },
      })),
      
      owners: (ownersData || []).map((owner: OwnerRPCResult, index: number) => ({
        rank: index + 1,
        totalLikes: owner.total_likes || 0,
        carCount: owner.car_count || 0,
        owner: {
          id: owner.id,
          username: owner.username,
          display_name: owner.display_name || owner.username,
          profile_image_url: owner.profile_image_url,
          created_at: owner.created_at,
          updated_at: owner.updated_at,
        },
      })),
      
      clubs: (clubsData || []).map((club: ClubRPCResult, index: number) => {
        const leader = leadersMap[club.leader_id];
        return {
          rank: index + 1,
          likes: club.calculated_total_likes || 0, // Use calculated value from club_stats view
          memberCount: club.member_count || 0,
          club: {
            id: club.id,
            name: club.name,
            description: club.description,
            banner_image_url: club.banner_image_url,
            total_likes: club.calculated_total_likes || 0, // Use calculated value from club_stats view
            leader_id: club.leader_id,
            club_type: club.club_type,
            location: club.location,
            created_at: club.created_at,
            updated_at: club.updated_at,
            leader: leader ? {
              id: leader.id,
              username: leader.username,
              display_name: leader.display_name || leader.username,
              profile_image_url: leader.profile_image_url,
              created_at: club.created_at, // Use club's created_at as fallback
              updated_at: club.updated_at, // Use club's updated_at as fallback
            } : {
              id: club.leader_id,
              username: "unknown",
              display_name: "Unknown Leader",
              profile_image_url: null,
              created_at: club.created_at,
              updated_at: club.updated_at,
            },
          },
        };
      }),
      
      meta: {
        generated_at: new Date().toISOString(),
        cache_key: `leaderboards_${limit}_${Date.now()}`,
      },
    };

    const endTime = Date.now();
    console.log(`✅ FETCH CACHE: Leaderboards data fetched and processed in ${endTime - startTime}ms`);
    console.log(`📊 Final counts - Cars: ${leaderboardsData.cars.length}, Owners: ${leaderboardsData.owners.length}, Clubs: ${leaderboardsData.clubs.length}`);

    return NextResponse.json(leaderboardsData);
  } catch (error) {
    console.error("❌ Error fetching leaderboards data:", error);
    return NextResponse.json(
      { error: "Failed to fetch leaderboards data" },
      { status: 500 }
    );
  }
}