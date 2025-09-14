import { MyEventsView } from "@/components/events/my-events-view";
import { requireAuth, getUserProfile } from "@/lib/auth";
import type { Event } from "@/types/event";
import { getBaseUrl } from "@/lib/utils";

// Cache this page for 5 minutes, then revalidate in the background
export const revalidate = 300; // 5 minutes

export default async function MyEventsPage() {
  // Server-side auth check - redirects if not authenticated
  const authUser = await requireAuth();
  const user = await getUserProfile(authUser.id);

  if (!user) {
    throw new Error("Failed to load user profile");
  }

  console.log("� SSR CACHE: Fetching user events via cached API route...");
  const startTime = Date.now();

  // Use native fetch to call our cached API route
  const response = await fetch(`${getBaseUrl()}/api/events/my-events`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userId: user.id,
      pageLimit: 50,
      pageOffset: 0,
    }),
    // Leverage the API route's caching
    next: { revalidate: 60 },
  });

  if (!response.ok) {
    console.error(
      `❌ My events API route failed: ${response.status} ${response.statusText}`
    );
    throw new Error("Failed to load your events");
  }

  const userEventsData = await response.json();

  console.log(
    `✅ SSR CACHE: User events fetched via API route in ${
      Date.now() - startTime
    }ms`
  );

  // Transform RPC result to match Event interface with attendance counts
  const events: (Event & {
    attendee_count?: number;
    interested_count?: number;
  })[] =
    userEventsData?.map(
      (event: {
        id: string;
        title: string;
        description: string;
        poster_image_url: string | null;
        daily_schedule: Array<{
          date: string;
          start_time?: string;
          end_time?: string;
        }>;
        location: string;
        created_at: string;
        updated_at: string;
        attendee_count: number;
        interested_count: number;
      }) => ({
        id: event.id,
        host_id: user.id, // These are all user's events
        title: event.title,
        description: event.description,
        poster_image_url: event.poster_image_url || undefined,
        daily_schedule: event.daily_schedule,
        location: event.location,
        created_at: event.created_at,
        updated_at: event.updated_at,
        // Map to both camelCase (Event interface) and snake_case (component expects)
        attendeeCount: event.attendee_count || 0,
        interestedCount: event.interested_count || 0,
        attendee_count: event.attendee_count || 0,
        interested_count: event.interested_count || 0,
        host: {
          id: user.id,
          username: user.username,
          display_name: user.display_name || undefined,
          profile_image_url: user.profile_image_url || undefined,
        },
      })
    ) || [];

  return <MyEventsView events={events} userId={user.id} />;
}
