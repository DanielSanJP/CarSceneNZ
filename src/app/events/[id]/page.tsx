import { getEventById } from "@/lib/server/events";
import { notFound } from "next/navigation";
import { EventDetailView } from "@/components/events/display/event-detail-view";

// Force dynamic rendering since we use authentication/cookies
export const dynamic = "force-dynamic";

interface EventDetailPageProps {
  params: { id: string };
}

export default async function EventDetailPage({
  params,
}: EventDetailPageProps) {
  const { id } = await params;

  // Use pure optimized mode - let React Query handle all data fetching
  // Server-side data is only for validation and notFound() handling
  try {
    const event = await getEventById(id);

    if (!event) {
      notFound();
    }

    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto">
            <EventDetailView eventId={id} />
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error in EventDetailPage:", error);
    notFound();
  }
}
