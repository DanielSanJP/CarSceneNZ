import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { page, limit, userId } = body;
    const startTime = Date.now();

    console.log(`🚀 FETCH CACHE: Fetching garage page ${page} via API route...`);

    // Get environment variables for direct Supabase fetch
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error("❌ Missing Supabase environment variables");
      throw new Error("Server configuration error");
    }

    // Fetch garage data using native fetch for caching
    const garageResponse = await fetch(
      `${supabaseUrl}/rest/v1/rpc/get_garage_gallery_optimized`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({
          page_num: page,
          page_limit: limit,
          user_id_param: userId || null,
        }),
        // Enable Next.js caching with 5 minute revalidation
        next: {
          revalidate: 300, // 5 minutes
          tags: ["garage", `garage-page-${page}`],
        },
      }
    );

    if (!garageResponse.ok) {
      console.error(`❌ Garage RPC failed: ${garageResponse.status}`);
      return NextResponse.json(
        { error: "Failed to fetch garage data" },
        { status: garageResponse.status }
      );
    }

    const garageData = await garageResponse.json();

    if (!garageData) {
      return NextResponse.json(
        { error: "No garage data found" },
        { status: 404 }
      );
    }

    const endTime = Date.now();
    console.log(
      `✅ FETCH CACHE: Garage page ${page} fetched and processed in ${
        endTime - startTime
      }ms`
    );

    return NextResponse.json({
      cars: garageData.cars,
      pagination: garageData.pagination,
      meta: garageData.meta,
    });
  } catch (error) {
    console.error("❌ Error fetching garage data:", error);
    return NextResponse.json(
      { error: "Failed to load garage data" },
      { status: 500 }
    );
  }
}