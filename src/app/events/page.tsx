import { getAllEvents } from "@/lib/server/events";
import { EventsGallery } from "@/components/events";
import { getCurrentUser } from "@/lib/server/auth";

export default async function EventsPage() {
  // Fetch data on the server
  const [events, user] = await Promise.all([getAllEvents(), getCurrentUser()]);

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <EventsGallery events={events} user={user} />
      </div>
    </div>
  );
}
