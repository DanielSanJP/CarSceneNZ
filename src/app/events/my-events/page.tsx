import { MyEventsView } from "@/components/events/my-events-view";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/utils/supabase/server";
import type { Event } from "@/types/event";

// Cache this page for 5 minutes, then revalidate in the background
export const revalidate = 300; // 5 minutes

export default async function MyEventsPage() {
  // Server-side auth check - redirects if not authenticated
  const user = await getUser();
  const supabase = await createClient();

  console.log("🗄️ Next.js Cache: Fetching user events using optimized RPC...");
  const startTime = Date.now();

  // Use optimized RPC function for better performance
  const { data: userEventsData, error } = await supabase.rpc(
    "get_user_events_optimized",
    {
      target_user_id: user.id,
      page_limit: 50, // Get up to 50 events
      page_offset: 0,
    }
  );

  if (error) {
    console.error("User events RPC error:", error);
    throw new Error("Failed to load your events");
  }

  console.log(
    `✅ Next.js Cache: User events fetched in ${Date.now() - startTime}ms`
  );

  // Transform RPC result to match Event interface
  const events: Event[] =
    userEventsData?.map(
      (event: {
        id: string;
        title: string;
        description: string;
        poster_image_url: string | null;
        daily_schedule: Array<{
          date: string;
          start_time?: string;
          end_time?: string;
        }>;
        location: string;
        created_at: string;
        updated_at: string;
        attendee_count: number;
        interested_count: number;
      }) => ({
        id: event.id,
        host_id: user.id, // These are all user's events
        title: event.title,
        description: event.description,
        poster_image_url: event.poster_image_url || undefined,
        daily_schedule: event.daily_schedule,
        location: event.location,
        created_at: event.created_at,
        updated_at: event.updated_at,
        host: {
          id: user.id,
          username: user.username,
          display_name: user.display_name || undefined,
          profile_image_url: user.profile_image_url || undefined,
        },
      })
    ) || [];

  return <MyEventsView events={events} userId={user.id} />;
}
