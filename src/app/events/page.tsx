import { getAllEvents } from "@/lib/server/events";
import { EventsGallery } from "@/components/events";
import { getUserOptional } from "@/lib/auth";

// Force dynamic rendering since we use authentication/cookies
export const dynamic = "force-dynamic";

export default async function EventsPage() {
  // Fetch data on the server
  const [events, user] = await Promise.all([getAllEvents(), getUserOptional()]);

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <EventsGallery events={events} user={user} />
      </div>
    </div>
  );
}
