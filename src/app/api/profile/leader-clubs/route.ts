import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userId = body?.userId;
    const startTime = Date.now();

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    console.log(`🚀 FETCH CACHE: Fetching leader clubs for user ${userId} via API route...`);

    // Get environment variables for native fetch
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error("❌ Missing Supabase environment variables");
      throw new Error("Server configuration error");
    }

    console.log(`🔍 DEBUG: Fetching leader clubs for user: ${userId}`);

    // Call Supabase RPC function using native fetch for caching
    const response = await fetch(
      `${supabaseUrl}/rest/v1/rpc/get_user_leader_clubs_optimized`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({
          user_uuid: userId,
        }),
        // Enable Next.js caching with 5 minute revalidation for leader clubs
        next: {
          revalidate: 300, // 5 minutes for leader clubs data
          tags: ["profile", "leader-clubs", `user-${userId}-leader-clubs`],
        },
      }
    );

    console.log(`🔍 DEBUG: Leader clubs RPC response status: ${response.status}`);

    if (!response.ok) {
      console.error(`❌ Leader clubs RPC failed: ${response.status} ${response.statusText}`);
      throw new Error(`Failed to fetch leader clubs: ${response.status}`);
    }

    const leaderClubsData = await response.json();

    console.log(`🔍 DEBUG: Leader clubs RPC returned ${leaderClubsData?.length || 0} clubs`);

    const endTime = Date.now();
    console.log(`✅ FETCH CACHE: User ${userId} leader clubs fetched and processed in ${endTime - startTime}ms`);

    // Format response to match expected LeaderClubsData interface
    const formattedResponse = {
      leaderClubs: leaderClubsData?.map((club: {
        club_id: string;
        club_name: string;
        club_description: string;
        club_banner_image_url: string | null;
        member_count: number;
      }) => ({
        id: club.club_id,
        name: club.club_name,
        description: club.club_description,
        image_url: club.club_banner_image_url,
        memberCount: club.member_count,
      })) || [],
      meta: {
        generated_at: new Date().toISOString(),
        cache_key: `leader_clubs_${userId}_${Date.now()}`,
      },
    };

    return NextResponse.json(formattedResponse);
  } catch (error) {
    console.error("❌ Error fetching leader clubs:", error);
    return NextResponse.json(
      { error: "Failed to fetch leader clubs" },
      { status: 500 }
    );
  }
}