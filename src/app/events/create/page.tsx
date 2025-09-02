"use client";

import { useClientAuth } from "@/components/client-auth-provider";
import { CreateEventForm } from "@/components/events/create-event-form";

export default function CreateEventPage() {
  const { user } = useClientAuth();

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Access Denied</h1>
            <p className="text-muted-foreground mt-2">
              Please log in to create events.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <CreateEventForm />
      </div>
    </div>
  );
}
