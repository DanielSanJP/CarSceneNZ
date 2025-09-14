import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    // Get userId and eventIds from request body (following event detail pattern)
    const body = await request.json();
    const { userId, eventIds } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    if (!eventIds || !Array.isArray(eventIds) || eventIds.length === 0) {
      return NextResponse.json({ userStatuses: {} });
    }

    // Get environment variables for native fetch
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error("❌ Missing Supabase environment variables");
      throw new Error("Server configuration error");
    }

    console.log(`🔍 DEBUG: Fetching user statuses for ${eventIds.length} events for user ${userId}`);

    // Build the query for event_attendees table using native fetch for caching
    const query = new URLSearchParams({
      select: "event_id,status",
      user_id: `eq.${userId}`,
      event_id: `in.(${eventIds.join(",")})`,
    });

    const response = await fetch(
      `${supabaseUrl}/rest/v1/event_attendees?${query}`,
      {
        headers: {
          "Content-Type": "application/json",
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          Prefer: "return=representation",
        },
        // Enable Next.js caching with shorter revalidation for user-specific data
        next: {
          revalidate: 60, // 1 minute cache for user attendance data
          tags: ["event-attendees", `user-${userId}-attendees`],
        },
      }
    );

    console.log(`🔍 DEBUG: User statuses fetch response status: ${response.status}`);

    if (!response.ok) {
      console.error(`❌ Failed to fetch user event statuses: ${response.status} ${response.statusText}`);
      throw new Error(`Failed to fetch user event statuses: ${response.status}`);
    }

    const statusData = await response.json();

    console.log(`🔍 DEBUG: Fetched ${statusData?.length || 0} user attendance records`);

    // Transform the data into the expected format
    const userStatuses = (statusData || []).reduce(
      (acc: Record<string, string>, item: { event_id: string; status: string }) => {
        acc[item.event_id] = item.status;
        return acc;
      },
      {}
    );

    console.log(`✅ User event statuses fetched successfully: ${Object.keys(userStatuses).length} events`);

    return NextResponse.json({
      userStatuses,
      userId: userId,
    });
  } catch (error) {
    console.error("❌ Error fetching user event statuses:", error);
    return NextResponse.json(
      { error: "Failed to fetch user event statuses" },
      { status: 500 }
    );
  }
}
