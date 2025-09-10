import { getUserOptional } from "@/lib/auth";
import { createClient } from "@/lib/utils/supabase/server";
import { EventsGallery } from "@/components/events";
import type { EventsData } from "@/types/event";
import { revalidatePath } from "next/cache";
import { getUser } from "@/lib/auth";

// Server action for event attendance - directly in this file
async function attendEventAction(
  eventId: string,
  status: "interested" | "going" | "remove"
) {
  "use server";

  try {
    const user = await getUser();
    if (!user) {
      return { success: false, error: "Authentication required" };
    }

    const supabase = await createClient();

    // Call the RPC function with correct parameter names
    const { data: result, error } = await supabase.rpc(
      "toggle_event_attendance",
      {
        target_event_id: eventId,
        current_user_id: user.id,
        attendance_status: status,
      }
    );

    if (error) {
      console.error("Event attendance RPC error:", error);
      return { success: false, error: "Failed to update attendance" };
    }

    if (!result || result.length === 0) {
      return { success: false, error: "No response from attendance update" };
    }

    // Revalidate the events page to show updated data
    revalidatePath("/events");
    revalidatePath(`/events/${eventId}`);
    revalidatePath("/");

    return { success: true };
  } catch (error) {
    console.error("Server action error:", error);
    return { success: false, error: "Server error occurred" };
  }
}

// Define type for RPC result
type EventRPCResult = {
  id: string;
  host_id: string;
  title: string;
  description: string;
  poster_image_url: string | null;
  daily_schedule: { date: string; start_time?: string; end_time?: string }[];
  location: string;
  created_at: string;
  updated_at: string;
  host_username: string;
  host_display_name: string | null;
  host_profile_image_url: string | null;
  attendee_count: number;
  interested_count: number;
};

interface EventsPageProps {
  searchParams: Promise<{ page?: string }>;
}

// Cache this page for 5 minutes with ISR, then revalidate in the background
export const revalidate = 300; // 5 minutes

// Alternative: Generate static pages for first few pages
export async function generateStaticParams() {
  // Pre-generate first 3 pages at build time
  return [{ page: "1" }, { page: "2" }, { page: "3" }];
}

export default async function EventsPage({ searchParams }: EventsPageProps) {
  // Await searchParams before accessing properties (Next.js 15 requirement)
  const resolvedSearchParams = await searchParams;

  // Get page from search params, default to 1
  const page = Number(resolvedSearchParams.page) || 1;
  const limit = 12; // Show 12 events per page
  const offset = (page - 1) * limit;

  // Get user (optional - not required to view events)
  const user = await getUserOptional();
  const supabase = await createClient();

  console.log(
    `🗄️ Next.js Cache: Fetching events page ${page} directly from database...`
  );
  const startTime = Date.now();

  // Fetch initial events data directly in server component with Next.js caching
  const { data: events, error } = (await supabase.rpc("get_events_optimized", {
    page_limit: limit,
    page_offset: offset,
  })) as { data: EventRPCResult[] | null; error: Error | null };

  if (error) {
    console.error("Events RPC error:", error);
    throw new Error("Failed to load events");
  }

  // Get user statuses for all events if user is logged in
  let userStatuses: Record<string, string> = {};
  if (user && events && events.length > 0) {
    const eventIds = events.map((event: EventRPCResult) => event.id);

    const { data: statusData } = await supabase
      .from("event_attendees")
      .select("event_id, status")
      .eq("user_id", user.id)
      .in("event_id", eventIds);

    if (statusData) {
      userStatuses = statusData.reduce((acc: Record<string, string>, item) => {
        acc[item.event_id] = item.status;
        return acc;
      }, {});
    }
  }

  console.log(
    `✅ Next.js Cache: Events fetched in ${Date.now() - startTime}ms`
  );

  // Transform events data to match our EventsData interface
  const eventsData: EventsData = {
    events:
      events?.map((event: EventRPCResult) => ({
        id: event.id,
        host_id: event.host_id,
        title: event.title,
        description: event.description,
        poster_image_url: event.poster_image_url || undefined,
        daily_schedule: event.daily_schedule,
        location: event.location,
        created_at: event.created_at,
        updated_at: event.updated_at,
        host: {
          id: event.host_id,
          username: event.host_username,
          display_name: event.host_display_name || undefined,
          profile_image_url: event.host_profile_image_url || undefined,
        },
        attendeeCount: Number(event.attendee_count),
        interestedCount: Number(event.interested_count),
      })) || [],
    userStatuses,
    currentUser: user
      ? {
          id: user.id,
          username: user.username,
          display_name: user.display_name,
          profile_image_url: user.profile_image_url,
        }
      : null,
    pagination: {
      page,
      limit,
      hasMore: (events?.length || 0) === limit,
    },
  };

  return (
    <EventsGallery
      page={page}
      limit={limit}
      eventsData={eventsData}
      attendEventAction={attendEventAction}
    />
  );
}
