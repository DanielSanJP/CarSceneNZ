import { MyEventsView } from "@/components/events/my-events-view";
import { getUser } from "@/lib/auth";
import { getEventsByHost } from "@/lib/server/events";

export default async function MyEventsPage() {
  // Server-side auth check
  const user = await getUser();

  // Fetch user's events on server
  const userEvents = await getEventsByHost(user.id);

  return <MyEventsView events={userEvents} />;
}
