import { EventDetailView } from "@/components/events/display/event-detail-view";

// Force dynamic rendering since we use authentication/cookies
export const dynamic = "force-dynamic";

interface EventDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function EventDetailPage({
  params,
}: EventDetailPageProps) {
  const { id } = await params;

  // Let the client component handle all data fetching through React Query + RPC
  // This follows the same pattern as other pages in the app
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <EventDetailView eventId={id} />
        </div>
      </div>
    </div>
  );
}
