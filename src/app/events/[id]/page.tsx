import { getUserOptional } from "@/lib/auth";
import { getEventById } from "@/lib/server/events";
import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { EventDetailView } from "@/components/events/display/event-detail-view";
import { createClient } from "@/lib/utils/supabase/server";

// Force dynamic rendering since we use authentication/cookies
export const dynamic = "force-dynamic";

// Define the types for server action returns
interface AttendeeData {
  id: string;
  status: "interested" | "going" | "approved";
  user: {
    id: string;
    username: string;
    display_name?: string;
    profile_image_url?: string;
  };
}

interface SupabaseAttendeeResponse {
  id: string;
  status: string;
  user:
    | {
        id: string;
        username: string;
        display_name?: string;
        profile_image_url?: string;
      }
    | {
        id: string;
        username: string;
        display_name?: string;
        profile_image_url?: string;
      }[];
}

// Server actions for event attendance
async function attendEventAction(
  eventId: string,
  userId: string,
  status: "interested" | "going" | "approved"
) {
  "use server";

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("event_attendees")
    .upsert({
      event_id: eventId,
      user_id: userId,
      status: status,
    })
    .select();

  if (error) {
    console.error("Error updating event attendance:", error);
    throw new Error("Failed to update attendance");
  }

  revalidatePath(`/events/${eventId}`);
  return data;
}

async function unattendEventAction(eventId: string, userId: string) {
  "use server";

  const supabase = await createClient();

  const { error } = await supabase
    .from("event_attendees")
    .delete()
    .eq("event_id", eventId)
    .eq("user_id", userId);

  if (error) {
    console.error("Error removing event attendance:", error);
    throw new Error("Failed to remove attendance");
  }

  revalidatePath(`/events/${eventId}`);
}

async function getEventAttendeesAction(
  eventId: string
): Promise<AttendeeData[]> {
  "use server";

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("event_attendees")
    .select(
      `
      id,
      status,
      user:users!event_attendees_user_id_fkey (
        id,
        username,
        display_name,
        profile_image_url
      )
    `
    )
    .eq("event_id", eventId);

  if (error) {
    console.error("Error fetching event attendees:", error);
    return [];
  }

  // Transform the data to match our AttendeeData interface
  const transformedData: AttendeeData[] = (data || []).map(
    (item: SupabaseAttendeeResponse) => ({
      id: item.id,
      status: item.status as "interested" | "going" | "approved",
      user: Array.isArray(item.user) ? item.user[0] : item.user,
    })
  );

  return transformedData;
}

async function getUserEventStatusAction(eventId: string, userId: string) {
  "use server";

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("event_attendees")
    .select("status")
    .eq("event_id", eventId)
    .eq("user_id", userId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      // No record found, user hasn't responded
      return null;
    }
    console.error("Error fetching user event status:", error);
    return null;
  }

  return data.status;
}

interface EventDetailPageProps {
  params: { id: string };
}

export default async function EventDetailPage({
  params,
}: EventDetailPageProps) {
  const [user, event] = await Promise.all([
    getUserOptional(),
    getEventById(params.id),
  ]);

  if (!event) {
    notFound();
  }

  // Get initial attendees and user status
  const [attendees, userStatus] = await Promise.all([
    getEventAttendeesAction(params.id),
    user ? getUserEventStatusAction(params.id, user.id) : Promise.resolve(null),
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
