import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json();
    const { id: usernameOrId } = await context.params;
    const currentUserId = body?.currentUserId;
    const startTime = Date.now();

    if (!usernameOrId) {
      return NextResponse.json(
        { error: "Username or ID is required" },
        { status: 400 }
      );
    }

    console.log(`🚀 FETCH CACHE: Fetching profile data for ${usernameOrId} via API route...`);

    // Get environment variables for native fetch
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error("❌ Missing Supabase environment variables");
      throw new Error("Server configuration error");
    }

    console.log(`🔍 DEBUG: Fetching profile for: ${usernameOrId}, currentUser: ${currentUserId || 'none'}`);

    // Check if the input looks like a UUID (36 characters with hyphens)
    const isUUID =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        usernameOrId
      );

    let requestBody;
    if (isUUID) {
      requestBody = {
        target_user_id_param: usernameOrId,
        current_user_id_param: currentUserId || null,
      };
    } else {
      requestBody = {
        username_param: usernameOrId,
        current_user_id_param: currentUserId || null,
      };
    }

    // Call Supabase RPC function using native fetch for caching
    const response = await fetch(
      `${supabaseUrl}/rest/v1/rpc/get_profile_data_optimized`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify(requestBody),
        // Enable Next.js caching with 5 minute revalidation for profile data
        next: {
          revalidate: 300, // 5 minutes for profile data
          tags: ["profile", `profile-${usernameOrId}`, currentUserId ? `user-${currentUserId}-profile` : "public-profile"],
        },
      }
    );

    console.log(`🔍 DEBUG: Profile RPC response status: ${response.status}`);

    if (!response.ok) {
      console.error(`❌ Profile RPC failed: ${response.status} ${response.statusText}`);
      throw new Error(`Failed to fetch profile data: ${response.status}`);
    }

    const profileData = await response.json();

    console.log(`🔍 DEBUG: Profile RPC returned data successfully`);

    const endTime = Date.now();
    console.log(`✅ FETCH CACHE: Profile ${usernameOrId} data fetched and processed in ${endTime - startTime}ms`);

    // Format response to match expected interface
    const formattedResponse = {
      profileData,
      meta: {
        generated_at: new Date().toISOString(),
        cache_key: `profile_${usernameOrId}_${currentUserId || 'public'}_${Date.now()}`,
      },
    };

    return NextResponse.json(formattedResponse);
  } catch (error) {
    console.error("❌ Error fetching profile data:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile data" },
      { status: 500 }
    );
  }
}