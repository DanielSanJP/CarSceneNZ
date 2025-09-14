import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userId = body?.userId;
    const pageLimit = body?.pageLimit || 50;
    const pageOffset = body?.pageOffset || 0;
    const startTime = Date.now();

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    console.log(`🚀 FETCH CACHE: Fetching my events for user ${userId} via API route...`);

    // Get environment variables for native fetch
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error("❌ Missing Supabase environment variables");
      throw new Error("Server configuration error");
    }

    console.log(`🔍 DEBUG: Fetching user events for user: ${userId}, limit: ${pageLimit}, offset: ${pageOffset}`);

    // Call Supabase RPC function using native fetch for caching
    const response = await fetch(
      `${supabaseUrl}/rest/v1/rpc/get_user_events_optimized`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({
          target_user_id: userId,
          page_limit: pageLimit,
          page_offset: pageOffset,
        }),
        // Enable Next.js caching with 60 second revalidation for user-specific data
        next: {
          revalidate: 60, // 60 seconds for user-specific data
          tags: ["events", "user-events", `user-${userId}-events`],
        },
      }
    );

    console.log(`🔍 DEBUG: User events RPC response status: ${response.status}`);

    if (!response.ok) {
      console.error(`❌ User events RPC failed: ${response.status} ${response.statusText}`);
      throw new Error(`Failed to fetch user events: ${response.status}`);
    }

    const userEventsData = await response.json();

    console.log(`🔍 DEBUG: User events RPC returned ${userEventsData?.length || 0} events`);

    const endTime = Date.now();
    console.log(`✅ FETCH CACHE: User ${userId} events fetched and processed in ${endTime - startTime}ms`);

    return NextResponse.json(userEventsData);
  } catch (error) {
    console.error("❌ Error fetching user events data:", error);
    return NextResponse.json(
      { error: "Failed to fetch user events data" },
      { status: 500 }
    );
  }
}