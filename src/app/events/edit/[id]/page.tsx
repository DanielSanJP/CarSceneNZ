"use client";

import { useParams } from "next/navigation";
import { EditEventForm } from "@/components/events/edit-event-form";

export default function EditEventPage() {
  const params = useParams();
  const eventId = params?.id as string;

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

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <EditEventForm eventId={eventId} />
      </div>
    </div>
  );
}
