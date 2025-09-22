import { MyEventsTabNavigation } from "@/components/events/my-events-tab-navigation";
import { requireAuth, getUserProfile } from "@/lib/auth";
import type { Event } from "@/types/event";
import { getBaseUrl } from "@/lib/utils";

// Cache this page for 5 minutes, then revalidate in the background
export const revalidate = 300; // 5 minutes

interface MyEventsPageProps {
  searchParams: {
    tab?: string;
  };
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

  // Determine which tab to show - default to 'hosting'
  const activeTab =
    (searchParams.tab as "hosting" | "going" | "interested") || "hosting";

  console.log(
    `🚀 SSR CACHE: Fetching user events for tab '${activeTab}' via cached API route...`
  );
  const startTime = Date.now();

  // Fetch events for all tabs to enable client-side switching
  const fetchEventsForTab = async (filter: string) => {
    const response = await fetch(`${getBaseUrl()}/api/events/my-events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: user.id,
        pageLimit: 50,
        pageOffset: 0,
        filter: filter,
      }),
      // Leverage the API route's caching
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      console.error(
        `❌ My events API route failed for filter '${filter}': ${response.status} ${response.statusText}`
      );
      return [];
    }

    return await response.json();
  };

  // Fetch events for all tabs
  const [hostingEventsData, goingEventsData, interestedEventsData] =
    await Promise.all([
      fetchEventsForTab("hosting"),
      fetchEventsForTab("going"),
      fetchEventsForTab("interested"),
    ]);

  console.log(
    `✅ SSR CACHE: User events fetched via API route in ${
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
