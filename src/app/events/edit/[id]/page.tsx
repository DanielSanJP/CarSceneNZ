import { redirect } from "next/navigation";
import { EditEventForm } from "@/components/events/edit-event-form";
import { getUser } from "@/lib/dal";
import { getEventById } from "@/lib/data/events";

interface EditEventPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditEventPage({ params }: EditEventPageProps) {
  // Server-side auth check
  const user = await getUser();
  if (!user) {
    redirect("/login");
  }

  const { id: eventId } = await params;

  if (!eventId) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Event Not Found</h1>
            <p className="text-muted-foreground mt-2">
              The event you&apos;re looking for doesn&apos;t exist.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Server-side permission check
  const event = await getEventById(eventId);
  if (!event) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Event Not Found</h1>
            <p className="text-muted-foreground mt-2">
              The event you&apos;re looking for doesn&apos;t exist.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (event.host_id !== user.id) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Access Denied</h1>
            <p className="text-muted-foreground mt-2">
              You don&apos;t have permission to edit this event.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <EditEventForm eventId={eventId} />
      </div>
    </div>
  );
}
