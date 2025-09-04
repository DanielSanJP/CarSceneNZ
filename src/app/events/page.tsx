import { createClient } from "@/lib/utils/supabase/server";
import { EventsGallery } from "@/components/events";
import { getUserOptional } from "@/lib/auth";
import {
  getEventAttendeeCounts,
  getUserEventStatuses,
  attendEvent,
  unattendEvent,
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

export default async function EventsPage() {
  // Fetch events directly from database
  const supabase = await createClient();
  const { data: events, error } = await supabase
    .from("events")
    .select(
      `
      *,
      host:users!events_host_id_fkey (
        id,
        username,
        display_name,
        profile_image_url
      )
    `
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching events:", error);
  }

  // Get user (optional)
  const user = await getUserOptional();

  // Get attendee counts and user statuses for all events
  const eventIds = (events || []).map((event) => event.id);
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
          events={events || []}
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
