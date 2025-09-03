import { getCurrentUser } from "@/lib/server/auth";
import { getEventById } from "@/lib/server/events";
import { notFound } from "next/navigation";
import { EventDetailView } from "@/components/events/display/event-detail-view";

interface EventDetailPageProps {
  params: { id: string };
}

export default async function EventDetailPage({
  params,
}: EventDetailPageProps) {
  const [user, event] = await Promise.all([
    getCurrentUser(),
    getEventById(params.id),
  ]);

  if (!event) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <EventDetailView event={event} user={user} />
        </div>
      </div>
    </div>
  );
}
