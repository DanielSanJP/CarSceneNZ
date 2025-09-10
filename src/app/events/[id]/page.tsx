import { EventDetailView } from "@/components/events/display/event-detail-view";
import { getUserOptional } from "@/lib/auth";
import { createClient } from "@/lib/utils/supabase/server";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { EventDetailData, Event, EventAttendee } from "@/types/event";

// Cache this page for 5 minutes, then revalidate in the background
export const revalidate = 300; // 5 minutes

// Server action for event attendance
async function attendEventAction(
  eventId: string,
  status: "interested" | "going" | "remove"
) {
  "use server";

  const user = await getUserOptional();
  if (!user) {
    redirect("/login");
  }

  const supabase = await createClient();

  try {
    console.log(
      `🔄 Server Action: ${
        status === "remove" ? "Removing" : "Setting"
      } attendance for event ${eventId}, user ${user.id}, status: ${status}`
    );

    // Call the RPC function with correct parameter names
    const { data, error } = await supabase.rpc("toggle_event_attendance", {
      target_event_id: eventId,
      current_user_id: user.id,
      attendance_status: status,
    });

    if (error) {
      console.error("❌ Server Action Error:", error);
      return { success: false, error: error.message };
    }

    console.log("✅ Server Action Success:", data);

    // Revalidate pages that might show this event
    revalidatePath("/events");
    revalidatePath(`/events/${eventId}`);
    revalidatePath("/");

    return { success: true, data };
  } catch (error) {
    console.error("❌ Server Action Exception:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update attendance",
    };
  }
}

interface EventDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function EventDetailPage({
  params,
}: EventDetailPageProps) {
  const { id } = await params;

  // Get user (optional - not required to view event)
  const user = await getUserOptional();
  const supabase = await createClient();

  console.log(
    `🗄️ Next.js Cache: Fetching event ${id} details using optimized RPC...`
  );
  const startTime = Date.now();

  // Use optimized RPC function to get event details with attendee counts and user status
  const { data: eventDetailsData, error: eventError } = await supabase.rpc(
    "get_event_details_optimized",
    {
      target_event_id: id,
      current_user_id: user?.id || null,
    }
  );

  if (eventError || !eventDetailsData || eventDetailsData.length === 0) {
    console.error("Event not found:", eventError);
    notFound();
  }

  const eventDetail = eventDetailsData[0];

  // Fetch attendees using optimized RPC
  const { data: attendeesData } = await supabase.rpc(
    "get_event_attendees_optimized",
    {
      target_event_id: id,
      page_limit: 100, // Get up to 100 attendees
      page_offset: 0,
    }
  );

  console.log(
    `✅ Next.js Cache: Event ${id} details fetched in ${
      Date.now() - startTime
    }ms`
  );

  // Transform RPC data to match our EventDetailData interface
  const eventDetailData: EventDetailData = {
    event: {
      id: eventDetail.id,
      host_id: eventDetail.host_id,
      title: eventDetail.title,
      description: eventDetail.description,
      poster_image_url: eventDetail.poster_image_url || undefined,
      daily_schedule: eventDetail.daily_schedule,
      location: eventDetail.location,
      created_at: eventDetail.created_at,
      updated_at: eventDetail.updated_at,
      host: {
        id: eventDetail.host_id,
        username: eventDetail.host_username,
        display_name: eventDetail.host_display_name || undefined,
        profile_image_url: eventDetail.host_profile_image_url || undefined,
      },
      attendeeCount: Number(eventDetail.attendee_count) || 0,
      interestedCount: Number(eventDetail.interested_count) || 0,
    } as Event,
    user: user
      ? {
          id: user.id,
          username: user.username,
          display_name: user.display_name,
          profile_image_url: user.profile_image_url,
        }
      : null,
    attendees:
      attendeesData?.map(
        (attendee: {
          id: string;
          user_id: string;
          status: string;
          user_username: string;
          user_display_name?: string;
          user_profile_image_url?: string;
          attended_at: string;
        }) => ({
          id: attendee.id,
          event_id: id,
          user_id: attendee.user_id,
          status: attendee.status,
          created_at: attendee.attended_at,
          updated_at: attendee.attended_at,
          user: {
            id: attendee.user_id,
            username: attendee.user_username,
            display_name: attendee.user_display_name || undefined,
            profile_image_url: attendee.user_profile_image_url || undefined,
          },
        })
      ) || ([] as EventAttendee[]),
    userStatus: eventDetail.user_status || null,
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <EventDetailView
            eventDetailData={eventDetailData}
            attendEventAction={attendEventAction}
          />
        </div>
      </div>
    </div>
  );
}
