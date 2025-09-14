import { NextRequest, NextResponse } from "next/server";
import { getUserOptional } from "@/lib/auth";
import { revalidatePath, revalidateTag } from "next/cache";

export async function POST(request: NextRequest) {
  try {
    // Get the current user
    const user = await getUserOptional();
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Parse the request body
    const { eventId, status } = await request.json();

    if (!eventId || !status) {
      return NextResponse.json(
        { error: "Event ID and status are required" },
        { status: 400 }
      );
    }

    if (!["interested", "going", "remove"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be 'interested', 'going', or 'remove'" },
        { status: 400 }
      );
    }

    // For attendance actions, we need direct Supabase access since this modifies data
    const { createClient } = await import("@/lib/utils/supabase/server");
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
      return NextResponse.json(
        { error: "Failed to update attendance" },
        { status: 500 }
      );
    }

    if (!result || result.length === 0) {
      return NextResponse.json(
        { error: "No response from attendance update" },
        { status: 500 }
      );
    }

    // Comprehensive revalidation to ensure all cached data is updated
    
    // 1. Revalidate specific paths
    revalidatePath("/events"); // Events list page
    revalidatePath(`/events/${eventId}`); // Specific event page
    revalidatePath("/events/my-events"); // My events page - shows attendance counts
    revalidatePath("/"); // Homepage (might show event previews)
    
    // 2. Revalidate by cache tags to invalidate all cached events data
    revalidateTag("events"); // This will invalidate all fetch requests tagged with "events"
    revalidateTag("user-events"); // This will invalidate ALL user events caches (my-events for all users)
    revalidateTag(`event-${eventId}`); // Invalidate specific event detail cache
    revalidateTag("attendees"); // Invalidate attendees cache
    revalidateTag("event-attendees"); // Invalidate user event statuses cache
    revalidateTag(`user-${user.id}-attendees`); // Invalidate specific user attendance cache
    
    // 3. Use nuclear option to ensure my-events pages update
    revalidatePath("/", "layout"); // Revalidates entire app from root layout

    console.log(`✅ Revalidated all events cache after attendance update for event ${eventId}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Event attendance API error:", error);
    return NextResponse.json(
      { error: "Server error occurred" },
      { status: 500 }
    );
  }
}