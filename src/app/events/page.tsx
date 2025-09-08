import { EventsGallery } from "@/components/events";
import { getUserOptional } from "@/lib/auth";
import {
  getEventAttendeeCounts,
  getUserEventStatuses,
  attendEvent,
  unattendEvent,
  getEventsPaginated,
} from "@/lib/server/events";
import { revalidatePath } from "next/cache";

// Force dynamic rendering since we use authentication/cookies
export const dynamic = "force-dynamic";

// Server actions for the gallery
async function attendEventAction(
  eventId: string,
  userId: string,
  status: "interested" | "going" | "approved"
) {
  "use server";

  try {
    await attendEvent(eventId, userId, status);
    revalidatePath("/events");
    return { success: true };
  } catch (error) {
    console.error("Error updating event attendance:", error);
    return { success: false, error: "Failed to update attendance" };
  }
}

async function unattendEventAction(eventId: string, userId: string) {
  "use server";

  try {
    await unattendEvent(eventId, userId);
    revalidatePath("/events");
    return { success: true };
  } catch (error) {
    console.error("Error removing event attendance:", error);
    return { success: false, error: "Failed to remove attendance" };
  }
}

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; limit?: string }>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page || "1");
  const limit = parseInt(params.limit || "12"); // Default 12 events per page

  // Use optimized cached events fetching
  const events = await getEventsPaginated({
    page,
    limit,
    includeHost: true,
  });

  // Get user (optional)
  const user = await getUserOptional();

  // Get attendee counts and user statuses for all events
  const eventIds = events.map((event) => event.id);
  const [attendeeCounts, userEventStatuses] = await Promise.all([
    eventIds.length > 0
      ? getEventAttendeeCounts(eventIds)
      : Promise.resolve({}),
    user && eventIds.length > 0
      ? getUserEventStatuses(eventIds, user.id)
      : Promise.resolve({}),
  ]);

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <EventsGallery
          events={events}
          user={user}
          attendeeCounts={attendeeCounts}
          userEventStatuses={userEventStatuses}
          attendEventAction={attendEventAction}
          unattendEventAction={unattendEventAction}
        />
      </div>
    </div>
  );
}
