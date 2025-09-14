import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const userId = body?.userId;
    const startTime = Date.now();

    console.log(`🚀 FETCH CACHE: Fetching event ${id} details via API route...`);

    // Get environment variables for direct Supabase fetch
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error("❌ Missing Supabase environment variables");
      throw new Error("Server configuration error");
    }

    // Fetch event details using native fetch for caching
    const eventDetailsResponse = await fetch(
      `${supabaseUrl}/rest/v1/rpc/get_event_details_optimized`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({
          target_event_id: id,
          current_user_id: userId || null,
        }),
        // Enable Next.js caching with 5 minute revalidation
        next: {
          revalidate: 300, // 5 minutes
          tags: ["events", `event-${id}`],
        },
      }
    );

    if (!eventDetailsResponse.ok) {
      console.error(`❌ Event details RPC failed: ${eventDetailsResponse.status}`);
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    const eventDetailsData = await eventDetailsResponse.json();
    const eventDetail = eventDetailsData?.[0];

    if (!eventDetail) {
      console.error("❌ No event details found in RPC response");
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Fetch attendees using native fetch for caching
    const attendeesResponse = await fetch(
      `${supabaseUrl}/rest/v1/rpc/get_event_attendees_optimized`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({
          target_event_id: id,
          page_limit: 100,
          page_offset: 0,
        }),
        // Enable Next.js caching
        next: {
          revalidate: 300, // 5 minutes
          tags: ["events", `event-${id}`, "attendees"],
        },
      }
    );

    let attendeesData = [];
    if (attendeesResponse.ok) {
      attendeesData = await attendeesResponse.json();
    }

    // Transform data to match EventDetailData interface
    const eventDetailData = {
      event: {
        id: eventDetail.id,
        host_id: eventDetail.host_id,
        title: eventDetail.title,
        description: eventDetail.description,
        poster_image_url: eventDetail.poster_image_url || undefined,
        daily_schedule: eventDetail.daily_schedule,
        location: eventDetail.location,
        created_at: eventDetail.created_at,
        updated_at: eventDetail.updated_at,
        host: {
          id: eventDetail.host_id,
          username: eventDetail.host_username,
          display_name: eventDetail.host_display_name || undefined,
          profile_image_url: eventDetail.host_profile_image_url || undefined,
        },
        attendeeCount: Number(eventDetail.attendee_count) || 0,
        interestedCount: Number(eventDetail.interested_count) || 0,
      },
      user: null, // User data is handled in the server component
      attendees:
        attendeesData?.map((attendee: {
          id: string;
          user_id: string;
          status: string;
          user_username: string;
          user_display_name?: string;
          user_profile_image_url?: string;
          attended_at: string;
        }) => ({
          id: attendee.id,
          event_id: id,
          user_id: attendee.user_id,
          status: attendee.status,
          created_at: attendee.attended_at,
          updated_at: attendee.attended_at,
          user: {
            id: attendee.user_id,
            username: attendee.user_username,
            display_name: attendee.user_display_name || undefined,
            profile_image_url: attendee.user_profile_image_url || undefined,
          },
        })) || [],
      userStatus: eventDetail.user_status || null,
    };

    const endTime = Date.now();
    console.log(
      `✅ FETCH CACHE: Event ${id} details fetched and processed in ${
        endTime - startTime
      }ms`
    );

    return NextResponse.json(eventDetailData);
  } catch (error) {
    console.error("❌ Error fetching event details:", error);
    return NextResponse.json(
      { error: "Failed to load event details" },
      { status: 500 }
    );
  }
}