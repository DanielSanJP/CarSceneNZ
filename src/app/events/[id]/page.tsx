import { getUserOptional } from "@/lib/auth";
import {
  getEventById,
  attendEvent,
  unattendEvent,
  getEventAttendeesDetailed,
  getUserEventStatus,
  type AttendeeData,
} from "@/lib/server/events";
import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { EventDetailView } from "@/components/events/display/event-detail-view";

// Force dynamic rendering since we use authentication/cookies
export const dynamic = "force-dynamic";

// Server actions for event attendance
async function attendEventAction(
  eventId: string,
  userId: string,
  status: "interested" | "going" | "approved"
) {
  "use server";

  try {
    const data = await attendEvent(eventId, userId, status);
    revalidatePath(`/events/${eventId}`);
    return data;
  } catch (error) {
    console.error("Error updating event attendance:", error);
    throw new Error("Failed to update attendance");
  }
}

async function unattendEventAction(eventId: string, userId: string) {
  "use server";

  try {
    await unattendEvent(eventId, userId);
    revalidatePath(`/events/${eventId}`);
  } catch (error) {
    console.error("Error removing event attendance:", error);
    throw new Error("Failed to remove attendance");
  }
}

async function getEventAttendeesAction(
  eventId: string
): Promise<AttendeeData[]> {
  "use server";

  return await getEventAttendeesDetailed(eventId);
}

async function getUserEventStatusAction(eventId: string, userId: string) {
  "use server";

  return await getUserEventStatus(eventId, userId);
}

interface EventDetailPageProps {
  params: { id: string };
}

export default async function EventDetailPage({
  params,
}: EventDetailPageProps) {
  const { id } = await params;
  const [user, event] = await Promise.all([
    getUserOptional(),
    getEventById(id),
  ]);

  if (!event) {
    notFound();
  }

  // Get initial attendees and user status
  const [attendees, userStatus] = await Promise.all([
    getEventAttendeesAction(id),
    user ? getUserEventStatusAction(id, user.id) : Promise.resolve(null),
  ]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <EventDetailView
            event={event}
            user={user}
            initialAttendees={attendees}
            initialUserStatus={userStatus}
            attendEventAction={attendEventAction}
            unattendEventAction={unattendEventAction}
            getEventAttendeesAction={getEventAttendeesAction}
            getUserEventStatusAction={getUserEventStatusAction}
          />
        </div>
      </div>
    </div>
  );
}
