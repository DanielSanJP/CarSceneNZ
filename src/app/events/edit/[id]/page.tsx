import { redirect, notFound } from "next/navigation";
import { EditEventForm } from "@/components/events/edit-event-form";
import { getUser } from "@/lib/auth";
import { getEventById } from "@/lib/server/events";

interface EditEventPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditEventPage({ params }: EditEventPageProps) {
  // Server-side auth check
  const user = await getUser();

  const { id: eventId } = await params;

  if (!eventId) {
    notFound();
  }

  // Server-side permission check
  const event = await getEventById(eventId);
  if (!event) {
    notFound();
  }

  if (event.host_id !== user.id) {
    redirect("/events");
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <EditEventForm event={event} user={user} />
      </div>
    </div>
  );
}
