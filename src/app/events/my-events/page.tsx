import { MyEventsView } from "@/components/events/my-events-view";
import { getUser } from "@/lib/auth";
import { getEventsByHost, getEventAttendeeCounts } from "@/lib/server/events";

export default async function MyEventsPage() {
  // Server-side auth check
  const user = await getUser();

  // Fetch user's events on server
  const userEvents = await getEventsByHost(user.id);

  // Get attendee counts for all events
  const eventIds = userEvents.map((event) => event.id);
  const attendeeCounts =
    eventIds.length > 0 ? await getEventAttendeeCounts(eventIds) : {};

  return <MyEventsView events={userEvents} attendeeCounts={attendeeCounts} />;
}
