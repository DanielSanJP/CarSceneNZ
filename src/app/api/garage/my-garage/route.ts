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

    console.log(`🚀 FETCH CACHE: Fetching my garage for user ${userId} via API route...`);

    // Get environment variables for native fetch
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error("❌ Missing Supabase environment variables");
      throw new Error("Server configuration error");
    }

    console.log(`🔍 DEBUG: Fetching user garage for user: ${userId}`);

    // Call Supabase RPC function using native fetch for caching
    const response = await fetch(
      `${supabaseUrl}/rest/v1/rpc/get_user_garage_optimized`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({
          user_id_param: userId,
        }),
        // Enable Next.js caching with 60 second revalidation for user-specific data
        next: {
          revalidate: 60, // 60 seconds for user-specific data
          tags: ["garage", "user-garage", `user-${userId}-garage`],
        },
      }
    );

    console.log(`🔍 DEBUG: User garage RPC response status: ${response.status}`);

    if (!response.ok) {
      console.error(`❌ User garage RPC failed: ${response.status} ${response.statusText}`);
      throw new Error(`Failed to fetch user garage: ${response.status}`);
    }

    const userGarageData = await response.json();

    console.log(`🔍 DEBUG: User garage RPC returned ${userGarageData?.cars?.length || 0} cars`);

    const endTime = Date.now();
    console.log(`✅ FETCH CACHE: User ${userId} garage fetched and processed in ${endTime - startTime}ms`);

    return NextResponse.json(userGarageData);
  } catch (error) {
    console.error("❌ Error fetching user garage data:", error);
    return NextResponse.json(
      { error: "Failed to fetch user garage data" },
      { status: 500 }
    );
  }
}