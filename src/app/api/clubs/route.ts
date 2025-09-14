import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const startTime = Date.now();
    console.log("🚀 FETCH CACHE: Fetching clubs gallery via API route...");

    // Get environment variables for native fetch
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error("❌ Missing Supabase environment variables");
      throw new Error("Server configuration error");
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || null;
    const location = searchParams.get("location") || null;
    const club_type = searchParams.get("club_type") || null;
    const sortBy = searchParams.get("sortBy") || "likes";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "12"), 50);
    const userId = searchParams.get("userId") || null;

    console.log(`🔍 DEBUG: Fetching clubs - Page ${page}, Limit ${limit}, Sort: ${sortBy}`);
    console.log(`🔍 DEBUG: Filters - Search: ${search}, Location: ${location}, Type: ${club_type}`);

    const offset = (page - 1) * limit;

    // Call Supabase RPC function using native fetch for caching
    const response = await fetch(
      `${supabaseUrl}/rest/v1/rpc/get_clubs_gallery`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({
          search_term: search,
          location_filter: location,
          club_type_filter: club_type,
          sort_by: sortBy,
          result_limit: limit,
          result_offset: offset,
          current_user_id: userId,
        }),
        // Enable Next.js caching with 5 minute revalidation
        next: {
          revalidate: 300, // 5 minutes
          tags: ["clubs", `clubs-page-${page}`, ...(userId ? [`user-${userId}-clubs`] : [])],
        },
      }
    );

    console.log(`🔍 DEBUG: Clubs RPC response status: ${response.status}`);

    if (!response.ok) {
      console.error(`❌ Clubs RPC failed: ${response.status} ${response.statusText}`);
      throw new Error(`Failed to fetch clubs: ${response.status}`);
    }

    const data = await response.json();
    console.log(`🔍 DEBUG: Clubs RPC returned data:`, {
      clubsCount: data?.clubs?.length || 0,
      pagination: data?.pagination
    });

    // Transform data to match ClubsGalleryData interface
    const clubsGalleryData = {
      clubs: data?.clubs || [],
      pagination: data?.pagination || {
        total: 0,
        page: page,
        limit: limit,
        totalPages: 0,
      },
      filters: {
        search: search || "",
        location: location || "",
        club_type: club_type || "",
        sortBy: sortBy,
      },
    };

    const endTime = Date.now();
    console.log(`✅ FETCH CACHE: Clubs gallery data fetched and processed in ${endTime - startTime}ms`);
    console.log(`📊 Final data - Clubs: ${clubsGalleryData.clubs.length}, Total: ${clubsGalleryData.pagination.total}`);

    return NextResponse.json(clubsGalleryData);
  } catch (error) {
    console.error("❌ Error fetching clubs gallery data:", error);
    return NextResponse.json(
      { error: "Failed to fetch clubs gallery data" },
      { status: 500 }
    );
  }
}