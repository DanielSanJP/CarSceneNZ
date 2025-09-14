import { EventsGallery } from "@/components/events";
import type { EventsData } from "@/types/event";
import { getUserOptional } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Helper function to get basic user info for SSR (cached via React cache)
async function getUserHints() {
  try {
    // Use cached auth check - this is fast due to React cache()
    const user = await getUserOptional();

    if (!user) {
      return {
        isLoggedIn: false,
        userId: null,
        userInfo: null,
      };
    }

    return {
      isLoggedIn: true,
      userId: user.id,
      userInfo: {
        id: user.id,
        username: user.username,
        display_name: user.display_name,
        profile_image_url: user.profile_image_url,
      },
    };
  } catch (error) {
    console.error("Error getting user hints:", error);
    return {
      isLoggedIn: false,
      userId: null,
      userInfo: null,
    };
  }
}

// Helper function to get user event statuses (only if user is logged in)
async function getUserEventStatuses(userId: string, eventIds: string[]) {
  if (!userId || eventIds.length === 0) {
    return {};
  }

  try {
    console.log(
      `🔍 DEBUG: Fetching user statuses for ${eventIds.length} events via cached API route`
    );

    // Use our cached API route with the same pattern as event detail
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const response = await fetch(`${baseUrl}/api/events/user-statuses`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: userId,
        eventIds: eventIds,
      }),
      // Enable Next.js caching with short revalidation for SSR
      next: {
        revalidate: 60, // 1 minute cache for user attendance data
        tags: ["event-attendees", `user-${userId}-attendees`],
      },
    });

    if (!response.ok) {
      console.error(
        "Error fetching user event statuses via API:",
        response.status
      );
      return {};
    }

    const data = await response.json();
    console.log(
      `✅ DEBUG: Fetched user statuses for ${
        Object.keys(data.userStatuses || {}).length
      } events via cached API`
    );

    return data.userStatuses || {};
  } catch (error) {
    console.error("Error in getUserEventStatuses:", error);
    return {};
  }
}

// Helper function to get events data using the same logic as our API route
async function getEventsData(page: number, limit: number): Promise<EventsData> {
  const startTime = Date.now();

  console.log(
    `🚀 FETCH CACHE: Fetching events page ${page} using API route logic...`
  );
  console.log(`🔍 DEBUG: Current time: ${new Date().toISOString()}`);
  console.log(`🔍 DEBUG: Revalidate setting: 300 seconds`);

  try {
    // Get environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error("❌ Missing Supabase environment variables");
      throw new Error("Server configuration error");
    }

    console.log(`🔍 DEBUG: Using Supabase URL: ${supabaseUrl}`);
    console.log(`🔍 DEBUG: About to call Supabase RPC with native fetch...`);

    const offset = (page - 1) * limit;

    // Call Supabase RPC function using native fetch - this enables Next.js caching!
    const eventsResponse = await fetch(
      `${supabaseUrl}/rest/v1/rpc/get_events_optimized`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({
          page_limit: limit,
          page_offset: offset,
        }),
        // Enable Next.js caching with 5 minute revalidation
        next: {
          revalidate: 300, // 5 minutes
          tags: ["events"],
        },
      }
    );

    console.log(`🔍 DEBUG: Fetch response status: ${eventsResponse.status}`);
    console.log(`🔍 DEBUG: Fetch cache headers:`, {
      cacheControl: eventsResponse.headers.get("cache-control"),
      age: eventsResponse.headers.get("age"),
    });

    if (!eventsResponse.ok) {
      console.error(
        `❌ Events RPC failed: ${eventsResponse.status} ${eventsResponse.statusText}`
      );
      throw new Error(`Failed to fetch events: ${eventsResponse.status}`);
    }

    console.log(`🔍 DEBUG: Supabase RPC call completed`);
    const events = await eventsResponse.json();
    console.log(`🔍 DEBUG: getEventsData() returning data`);

    // Define type for RPC result (same as API route)
    type EventRPCResult = {
      id: string;
      host_id: string;
      title: string;
      description: string;
      poster_image_url: string | null;
      daily_schedule: {
        date: string;
        start_time?: string;
        end_time?: string;
      }[];
      location: string;
      created_at: string;
      updated_at: string;
      host_username: string;
      host_display_name: string | null;
      host_profile_image_url: string | null;
      attendee_count: number;
      interested_count: number;
    };

    // Transform events data to match our EventsData interface (same as API route)
    const eventsData: EventsData = {
      events:
        events?.map((event: EventRPCResult) => ({
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
      userStatuses: {}, // Will be populated separately
      currentUser: null, // Will be populated separately
      pagination: {
        page,
        limit,
        hasMore: (events?.length || 0) === limit,
      },
    };

    const endTime = Date.now();
    console.log(
      `✅ FETCH CACHE: Events data fetched and processed in ${
        endTime - startTime
      }ms`
    );

    return eventsData;
  } catch (error) {
    console.error("❌ Error fetching events data:", error);
    throw new Error("Failed to load events data");
  }
}

interface EventsPageProps {
  searchParams: Promise<{ page?: string }>;
}

// Cache this page for 5 minutes with ISR, then revalidate in the background
export const revalidate = 300; // 5 minutes

// Alternative: Generate static pages for first few pages
export async function generateStaticParams() {
  // Pre-generate first 3 pages at build time
  return [{ page: "1" }, { page: "2" }, { page: "3" }];
}

export default async function EventsPage({ searchParams }: EventsPageProps) {
  // Await searchParams before accessing properties (Next.js 15 requirement)
  const resolvedSearchParams = await searchParams;

  // Get page from search params, default to 1
  const page = Number(resolvedSearchParams.page) || 1;
  const limit = 12; // Show 12 events per page

  console.log(`🔍 DEBUG: EventsPage component is executing`);
  console.log(`🔍 DEBUG: Page ${page}, Limit ${limit}`);
  console.log(`🔍 DEBUG: About to call getEventsData()`);

  // Only fetch events data - no user logic for faster rendering
  const eventsData = await getEventsData(page, limit);

  console.log(
    `✅ DEBUG: getEventsData() completed, events count: ${eventsData.events.length}`
  );
  console.log(`🔍 DEBUG: About to return EventsGallery component`);

  // Get user hints for SSR (fast due to React cache)
  const userHints = await getUserHints();

  console.log(`🔍 DEBUG: User hints - logged in: ${userHints.isLoggedIn}`);

  // If user is logged in, get their event statuses for better SSR
  let userEventStatuses = {};
  if (
    userHints.isLoggedIn &&
    userHints.userId &&
    eventsData.events.length > 0
  ) {
    const eventIds = eventsData.events.map((event) => event.id);
    userEventStatuses = await getUserEventStatuses(userHints.userId, eventIds);
    console.log(
      `🔍 DEBUG: Fetched user statuses for ${
        Object.keys(userEventStatuses).length
      } events`
    );
  }

  // Prepare SSR data with user information
  const ssrEventsData: EventsData = {
    events: eventsData.events,
    userStatuses: userEventStatuses, // Include SSR user statuses
    currentUser: userHints.userInfo, // Include SSR user info
    pagination: eventsData.pagination,
  };

  return <EventsGallery page={page} limit={limit} eventsData={ssrEventsData} />;
}
