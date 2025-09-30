import { EventsGallery } from "@/components/events";
import { toggleEventAttendanceAction } from "@/lib/actions";
import type { EventsData } from "@/types/event";
import { getAuthUser, getUserProfile } from "@/lib/auth";
import { createClient } from "@/lib/utils/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 300; // 5 minutes

// Helper function to get basic user info for SSR (cached via React cache)
async function getUserHints() {
  try {
    // Use cached auth check - this is fast due to React cache()
    const authUser = await getAuthUser();
    const user = authUser ? await getUserProfile(authUser.id) : null;

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
      `🔍 DEBUG: Fetching user statuses for ${eventIds.length} events via direct queries`
    );

    const supabase = await createClient();

    const { data: attendanceRecords, error } = await supabase
      .from("event_attendees")
      .select("event_id, status")
      .eq("user_id", userId)
      .in("event_id", eventIds);

    if (error) {
      console.error("Error fetching user event statuses:", error);
      return {};
    }

    // Convert array of {event_id, status} to {eventId: status} object
    const userStatuses: Record<string, string> = {};
    if (Array.isArray(attendanceRecords)) {
      attendanceRecords.forEach((record) => {
        userStatuses[record.event_id] = record.status;
      });
    }

    console.log(
      `✅ DEBUG: Fetched user statuses for ${
        Object.keys(userStatuses).length
      } events via direct queries`
    );

    return userStatuses;
  } catch (error) {
    console.error("Error in getUserEventStatuses:", error);
    return {};
  }
}

// Helper function to get events data using direct Supabase queries
async function getEventsData(page: number, limit: number): Promise<EventsData> {
  console.log(
    `🚀 FETCH CACHE: Fetching events page ${page} using direct queries...`
  );
  console.log(`🔍 DEBUG: Current time: ${new Date().toISOString()}`);
  console.log(`🔍 DEBUG: Revalidate setting: 300 seconds`);

  try {
    console.log(`🔍 DEBUG: About to call direct Supabase queries...`);

    // Use direct Supabase queries instead of API route
    const supabase = await createClient();
    const startTime = Date.now();
    const offset = (page - 1) * limit;

    console.log(
      `🚀 FETCH CACHE: Events direct query called - Page ${page}, Limit ${limit}`
    );

    // Get events with host information using direct query
    const { data: events, error: eventsError } = await supabase
      .from("events")
      .select(
        `
        id,
        host_id,
        title,
        description,
        poster_image_url,
        daily_schedule,
        location,
        created_at,
        updated_at,
        host:users!events_host_id_fkey(
          id,
          username,
          display_name,
          profile_image_url
        )
      `
      )
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (eventsError) {
      console.error("❌ Error fetching events:", eventsError);
      throw eventsError;
    }

    console.log(
      `🔍 DEBUG: Fetched ${events?.length || 0} events from database`
    );

    // Transform events to handle host relationship (Supabase returns arrays, we need single objects)
    const transformedEvents =
      events?.map((event) => ({
        ...event,
        host:
          Array.isArray(event.host) && event.host.length > 0
            ? event.host[0]
            : undefined,
      })) || [];

    const endTime = Date.now();
    console.log(
      `✅ FETCH CACHE: Events data processed in ${endTime - startTime}ms`
    );
    console.log(`🔍 DEBUG: getEventsData() returning data`);

    console.log(
      `📊 Final data - Events: ${transformedEvents.length}, Has more: ${
        (events?.length || 0) === limit
      }`
    );

    console.log(
      `✅ FETCH CACHE: Events fetched successfully - ${transformedEvents.length} events found`
    );

    // Return the events data in the correct format
    return {
      events: transformedEvents,
      pagination: {
        page: page,
        limit: limit,
        hasMore: (events?.length || 0) === limit,
      },
      userStatuses: {},
      currentUser: null,
    };
  } catch (error) {
    console.error("❌ Error fetching events data:", error);
    throw new Error("Failed to load events data");
  }
}

interface EventsPageProps {
  searchParams: Promise<{ page?: string }>;
}

// Cache this page for 5 minutes with ISR, then revalidate in the background
// (Already exported at top of file)

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

  return (
    <EventsGallery
      page={page}
      limit={limit}
      eventsData={ssrEventsData}
      attendEventAction={toggleEventAttendanceAction}
    />
  );
}
