import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, eventIds } = body;

    console.log(`🔍 API: User statuses request - User: ${userId}, Events: ${eventIds?.length || 0}`);

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    if (!eventIds || !Array.isArray(eventIds) || eventIds.length === 0) {
      console.log("🔍 API: No event IDs provided, returning empty statuses");
      return NextResponse.json({ userStatuses: {} });
    }

    // Get Supabase config
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error("❌ Missing Supabase environment variables");
      throw new Error("Server configuration error");
    }

    // Create the filter for event_attendees table
    // Format: event_id=in.(uuid1,uuid2,uuid3)&user_id=eq.uuid
    const eventIdsFilter = eventIds.join(",");
    const url = `${supabaseUrl}/rest/v1/event_attendees?event_id=in.(${eventIdsFilter})&user_id=eq.${userId}&select=event_id,status`;

    console.log(`🔍 API: Querying URL: ${url}`);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`,
      },
      next: {
        revalidate: 30, // 30 second cache for user attendance data
        tags: ["event-attendees", `user-${userId}-attendees`],
      },
    });

    console.log(`🔍 API: Response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Supabase query failed: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`Failed to fetch user event statuses: ${response.status}`);
    }

    const attendanceRecords = await response.json();
    console.log(`🔍 API: Raw response:`, attendanceRecords);

    // Convert array of {event_id, status} to {eventId: status} object
    const userStatuses: Record<string, string> = {};
    if (Array.isArray(attendanceRecords)) {
      attendanceRecords.forEach((record: { event_id: string; status: string }) => {
        userStatuses[record.event_id] = record.status;
      });
    }

    console.log(`✅ API: Returning user statuses for ${Object.keys(userStatuses).length} events:`, userStatuses);

    return NextResponse.json({
      userStatuses,
      userId: userId,
    });
  } catch (error) {
    console.error("❌ Error in user-statuses API:", error);
    return NextResponse.json(
      { error: "Failed to fetch user event statuses" },
      { status: 500 }
    );
  }
}
