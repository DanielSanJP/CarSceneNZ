import { MyEventsView } from "@/components/events/my-events-view";
import { getUser } from "@/lib/auth";
import { getUserEvents, getEventAttendeeCounts } from "@/lib/server/events";

// Force dynamic rendering for authentication
export const dynamic = "force-dynamic";

// Cache for 2 minutes since user's events don't change frequently
export const revalidate = 120;

export default async function MyEventsPage() {
  // Server-side auth check - redirects if not authenticated
  const user = await getUser();

  // Fetch user's events using optimized cached function
  const userEvents = await getUserEvents(user.id);

  // Get attendee counts for all events in parallel
  const eventIds = userEvents.map((event) => event.id);
  const attendeeCounts =
    eventIds.length > 0 ? await getEventAttendeeCounts(eventIds) : {};

  return <MyEventsView events={userEvents} attendeeCounts={attendeeCounts} />;
}
