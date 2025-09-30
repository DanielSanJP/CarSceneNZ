import { MyEventsTabNavigation } from "@/components/events/my-events-tab-navigation";
import { requireAuth, getUserProfile } from "@/lib/auth";
import type { Event } from "@/types/event";
import { createClient } from "@/lib/utils/supabase/server";

// Cache this page for 5 minutes, then revalidate in the background
export const revalidate = 300; // 5 minutes

interface MyEventsPageProps {
  searchParams: Promise<{
    tab?: string;
  }>;
}

export default async function MyEventsPage({
  searchParams,
}: MyEventsPageProps) {
  // Server-side auth check - redirects if not authenticated
  const authUser = await requireAuth();
  const user = await getUserProfile(authUser.id);

  if (!user) {
    throw new Error("Failed to load user profile");
  }

  // Await searchParams before accessing properties
  const params = await searchParams;

  // Determine which tab to show - default to 'hosting'
  const activeTab =
    (params.tab as "hosting" | "going" | "interested") || "hosting";

  console.log(
    `🚀 SSR CACHE: Fetching user events for tab '${activeTab}' via direct queries...`
  );
  const startTime = Date.now();

  // Fetch events for all tabs using direct Supabase queries
  const fetchEventsForTab = async (filter: string): Promise<Event[]> => {
    const supabase = await createClient();
    const pageLimit = 50;
    const pageOffset = 0;

    let hostedEvents: Event[] = [];
    let attendedEvents: Event[] = [];

    // Get events where user is the host (if filter allows)
    if (filter === "all" || filter === "hosting") {
      const { data: hostedEventsData, error: hostedError } = await supabase
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
        .eq("host_id", user.id)
        .order("created_at", { ascending: false });

      if (hostedError) {
        console.error("❌ Error fetching hosted events:", hostedError);
        throw hostedError;
      }

      hostedEvents = (hostedEventsData || []) as unknown as Event[];
    }

    // Get events where user is an attendee (if filter allows)
    if (filter === "all" || filter === "going" || filter === "interested") {
      let attendeeQuery = supabase
        .from("event_attendees")
        .select("event_id")
        .eq("user_id", user.id);

      // Filter by attendance status if specific status requested
      if (filter === "going") {
        attendeeQuery = attendeeQuery.eq("status", "going");
      } else if (filter === "interested") {
        attendeeQuery = attendeeQuery.eq("status", "interested");
      }

      const { data: attendedEventIds, error: attendedError } =
        await attendeeQuery;

      if (attendedError) {
        console.error("❌ Error fetching attended event IDs:", attendedError);
        throw attendedError;
      }

      if (attendedEventIds && attendedEventIds.length > 0) {
        const eventIds = attendedEventIds.map((a) => a.event_id);
        const { data: attendedEventsData, error: attendedEventsError } =
          await supabase
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
            .in("id", eventIds)
            .order("created_at", { ascending: false });

        if (attendedEventsError) {
          console.error(
            "❌ Error fetching attended events:",
            attendedEventsError
          );
          throw attendedEventsError;
        }

        attendedEvents = (attendedEventsData || []) as unknown as Event[];
      }
    }

    // Combine and deduplicate events (user might host events they also attend)
    const allEvents = [...(hostedEvents || []), ...attendedEvents];
    const uniqueEvents = allEvents.filter(
      (event, index, arr) => arr.findIndex((e) => e.id === event.id) === index
    );

    // Apply pagination to combined results
    const paginatedEvents = uniqueEvents.slice(
      pageOffset,
      pageOffset + pageLimit
    );

    // Get attendee counts for all events
    const eventIds = paginatedEvents.map((event) => event.id);
    const attendeeCounts: Record<
      string,
      { going: number; interested: number }
    > = {};

    if (eventIds.length > 0) {
      const { data: attendeeCountData } = await supabase
        .from("event_attendees")
        .select("event_id, status")
        .in("event_id", eventIds);

      // Count attendees per event by status
      attendeeCountData?.forEach((attendee) => {
        if (!attendeeCounts[attendee.event_id]) {
          attendeeCounts[attendee.event_id] = { going: 0, interested: 0 };
        }
        if (attendee.status === "going") {
          attendeeCounts[attendee.event_id].going++;
        } else if (attendee.status === "interested") {
          attendeeCounts[attendee.event_id].interested++;
        }
      });
    }

    // Transform events data
    const transformedEvents = paginatedEvents.map((event) => {
      const host = Array.isArray(event.host) ? event.host[0] : event.host;
      const counts = attendeeCounts[event.id] || { going: 0, interested: 0 };

      return {
        id: event.id,
        host_id: event.host_id,
        title: event.title,
        description: event.description,
        poster_image_url: event.poster_image_url,
        daily_schedule: event.daily_schedule,
        location: event.location,
        created_at: event.created_at,
        updated_at: event.updated_at,
        host: host
          ? {
              id: host.id,
              username: host.username,
              display_name: host.display_name,
              profile_image_url: host.profile_image_url,
            }
          : undefined,
        attendeeCount: counts.going,
        interestedCount: counts.interested,
      };
    });

    console.log(
      `🔍 DEBUG: Filter '${filter}' - Found ${
        hostedEvents?.length || 0
      } hosted and ${attendedEvents.length} attended events`
    );
    console.log(
      `🔍 DEBUG: Total unique events: ${uniqueEvents.length}, paginated: ${transformedEvents.length}`
    );

    return transformedEvents;
  };

  // Fetch events for all tabs
  const [hostingEventsData, goingEventsData, interestedEventsData] =
    await Promise.all([
      fetchEventsForTab("hosting"),
      fetchEventsForTab("going"),
      fetchEventsForTab("interested"),
    ]);

  console.log(
    `✅ SSR CACHE: User events fetched via direct queries in ${
      Date.now() - startTime
    }ms`
  );

  // Transform events data
  const transformEvents = (eventsData: Event[]): Event[] => {
    return (
      eventsData?.map((event: Event) => {
        const host = Array.isArray(event.host) ? event.host[0] : event.host;

        return {
          id: event.id,
          host_id: event.host_id,
          title: event.title,
          description: event.description,
          poster_image_url: event.poster_image_url || undefined,
          daily_schedule: event.daily_schedule,
          location: event.location,
          created_at: event.created_at,
          updated_at: event.updated_at,
          attendeeCount: event.attendeeCount || 0,
          interestedCount: event.interestedCount || 0,
          host: host
            ? {
                id: host.id,
                username: host.username,
                display_name: host.display_name || undefined,
                profile_image_url: host.profile_image_url || undefined,
              }
            : undefined,
        };
      }) || []
    );
  };

  const hostingEvents = transformEvents(hostingEventsData);
  const goingEvents = transformEvents(goingEventsData);
  const interestedEvents = transformEvents(interestedEventsData);

  return (
    <MyEventsTabNavigation
      currentUser={user}
      defaultTab={activeTab}
      hostingEvents={hostingEvents}
      goingEvents={goingEvents}
      interestedEvents={interestedEvents}
    />
  );
}
