import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  // Get search params for pagination
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '12');
  const offset = (page - 1) * limit;
  
  console.log(`🚀 FETCH CACHE: Events API route called - Page ${page}, Limit ${limit}`);

  try {
    // Get environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error("❌ Missing Supabase environment variables");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    console.log(`🔍 DEBUG: Using Supabase URL: ${supabaseUrl}`);
    
    // Call Supabase RPC function using native fetch
    const eventsResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/get_events_optimized`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({
        page_limit: limit,
        page_offset: offset,
      }),
      // Enable Next.js caching with 5 minute revalidation (same as page revalidate)
      next: { 
        revalidate: 300, // 5 minutes
        tags: ['events'] 
      },
    });

    if (!eventsResponse.ok) {
      console.error(`❌ Events RPC failed: ${eventsResponse.status} ${eventsResponse.statusText}`);
      return NextResponse.json(
        { error: "Failed to fetch events" },
        { status: 500 }
      );
    }

    const events = await eventsResponse.json();
    console.log(`✅ FETCH CACHE: Events RPC completed successfully (${events?.length || 0} events)`);

    // Get user from auth header if present
    const authHeader = request.headers.get('authorization');
    const userStatuses: Record<string, string> = {};
    const currentUser = null;

    if (authHeader && events && events.length > 0) {
      try {
        // Extract user ID from auth header or session
        // For now, we'll skip user-specific data in the cached response
        // This can be fetched separately on the client side if needed
        console.log(`🔍 DEBUG: Auth header present, but skipping user-specific data for caching`);
      } catch (error) {
        console.error("Error processing auth:", error);
        // Continue without user data
      }
    }

    // Define type for RPC result
    type EventRPCResult = {
      id: string;
      host_id: string;
      title: string;
      description: string;
      poster_image_url: string | null;
      daily_schedule: { date: string; start_time?: string; end_time?: string }[];
      location: string;
      created_at: string;
      updated_at: string;
      host_username: string;
      host_display_name: string | null;
      host_profile_image_url: string | null;
      attendee_count: number;
      interested_count: number;
    };

    // Transform events data to match our EventsData interface
    const eventsData = {
      events: events?.map((event: EventRPCResult) => ({
        id: event.id,
        host_id: event.host_id,
        title: event.title,
        description: event.description,
        poster_image_url: event.poster_image_url || undefined,
        daily_schedule: event.daily_schedule,
        location: event.location,
        created_at: event.created_at,
        updated_at: event.updated_at,
        host: {
          id: event.host_id,
          username: event.host_username,
          display_name: event.host_display_name || undefined,
          profile_image_url: event.host_profile_image_url || undefined,
        },
        attendeeCount: Number(event.attendee_count),
        interestedCount: Number(event.interested_count),
      })) || [],
      userStatuses,
      currentUser,
      pagination: {
        page,
        limit,
        hasMore: (events?.length || 0) === limit,
      },
    };

    const endTime = Date.now();
    console.log(`✅ FETCH CACHE: Events data processed in ${endTime - startTime}ms`);

    return NextResponse.json(eventsData, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=1800',
      },
    });

  } catch (error) {
    console.error("❌ Events API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}