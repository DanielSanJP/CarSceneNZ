import { EventDetailView } from "@/components/events/display/event-detail-view";
import { toggleEventAttendanceAction } from "@/lib/actions";
import { notFound } from "next/navigation";
import type { EventDetailData } from "@/types/event";
import { getAuthUser, getUserProfile } from "@/lib/auth";
import { createClient } from "@/lib/utils/supabase/server";

// Cache this page for 5 minutes, then revalidate in the background
export const revalidate = 300; // 5 minutes

// Helper function to get event details using direct Supabase queries
async function getEventDetailData(
  eventId: string,
  userId?: string
): Promise<EventDetailData> {
  const startTime = Date.now();

  console.log(
    `🚀 FETCH CACHE: Fetching event ${eventId} details using direct queries...`
  );

  const supabase = await createClient();

  try {
    // Get event details with host information
    const { data: eventData, error: eventError } = await supabase
      .from("events")
      .select(
        `
        id,
        host_id,
        title,
        description,
        poster_image_url,
        daily_schedule,
        location,
        created_at,
        updated_at,
        host:users!events_host_id_fkey(
          id,
          username,
          display_name,
          profile_image_url
        )
      `
      )
      .eq("id", eventId)
      .single();

    if (eventError || !eventData) {
      throw new Error("Event not found");
    }

    console.log(`🔍 DEBUG: Found event: ${eventData.title}`);

    // Get attendees with user information
    const { data: attendeesData, error: attendeesError } = await supabase
      .from("event_attendees")
      .select(
        `
        id,
        event_id,
        user_id,
        status,
        created_at,
        updated_at,
        user:users!event_attendees_user_id_fkey(
          id,
          username,
          display_name,
          profile_image_url
        )
      `
      )
      .eq("event_id", eventId)
      .order("created_at", { ascending: false });

    if (attendeesError) {
      console.error("❌ Error fetching attendees:", attendeesError);
      throw attendeesError;
    }

    // Get user's attendance status if userId is provided
    let userStatus: string | null = null;
    if (userId) {
      const { data: userAttendance } = await supabase
        .from("event_attendees")
        .select("status")
        .eq("event_id", eventId)
        .eq("user_id", userId)
        .single();

      userStatus = userAttendance?.status || null;
    }

    // Transform data to match EventDetailData interface
    const host = Array.isArray(eventData.host)
      ? eventData.host[0]
      : eventData.host;

    // Get attendee counts for the event
    const goingCount =
      attendeesData?.filter((a) => a.status === "going").length || 0;
    const interestedCount =
      attendeesData?.filter((a) => a.status === "interested").length || 0;

    const eventDetailData = {
      event: {
        id: eventData.id,
        host_id: eventData.host_id,
        title: eventData.title,
        description: eventData.description,
        poster_image_url: eventData.poster_image_url,
        daily_schedule: eventData.daily_schedule,
        location: eventData.location,
        created_at: eventData.created_at,
        updated_at: eventData.updated_at,
        host: host
          ? {
              id: host.id,
              username: host.username,
              display_name: host.display_name,
              profile_image_url: host.profile_image_url,
            }
          : undefined,
        attendeeCount: goingCount,
        interestedCount: interestedCount,
      },
      user: userId
        ? {
            id: userId,
            username: "",
            display_name: undefined,
            profile_image_url: undefined,
          }
        : null,
      attendees:
        attendeesData?.map((attendee) => {
          const user = Array.isArray(attendee.user)
            ? attendee.user[0]
            : attendee.user;
          return {
            id: attendee.id,
            event_id: attendee.event_id,
            user_id: attendee.user_id,
            status: attendee.status as "interested" | "going" | "approved",
            created_at: attendee.created_at,
            updated_at: attendee.updated_at,
            user: user
              ? {
                  id: user.id,
                  username: user.username,
                  display_name: user.display_name,
                  profile_image_url: user.profile_image_url,
                }
              : undefined,
          };
        }) || [],
      userStatus: userStatus,
    };

    const endTime = Date.now();
    console.log(
      `✅ FETCH CACHE: Event ${eventId} details fetched in ${
        endTime - startTime
      }ms`
    );

    console.log(
      `📊 Final data - Event: ${eventDetailData.event.title}, Attendees: ${eventDetailData.attendees.length}, User Status: ${eventDetailData.userStatus}`
    );

    return eventDetailData;
  } catch (error) {
    console.error("❌ Error fetching event details:", error);
    throw error;
  }
}

interface EventDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function EventDetailPage({
  params,
}: EventDetailPageProps) {
  const { id } = await params;

  try {
    // Get user directly in server component (like events page does)
    const authUser = await getAuthUser();
    const user = authUser ? await getUserProfile(authUser.id) : null;

    // Get event details using our cached API route
    const eventDetailData = await getEventDetailData(id, user?.id);

    // Add user data to the response (API route doesn't handle user context)
    const completeEventDetailData: EventDetailData = {
      ...eventDetailData,
      user: user
        ? {
            id: user.id,
            username: user.username,
            display_name: user.display_name,
            profile_image_url: user.profile_image_url,
          }
        : null,
    };

    return (
      <>
        <EventDetailView
          eventDetailData={completeEventDetailData}
          attendEventAction={toggleEventAttendanceAction}
        />
      </>
    );
  } catch (error) {
    console.error("Error loading event:", error);
    notFound();
  }
}
