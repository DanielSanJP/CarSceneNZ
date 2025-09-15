// Simplified Event Attendance API - Direct queries instead of RPC

import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { createClient } from "@/lib/utils/supabase/server";
import { revalidateTag, revalidatePath } from "next/cache";

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

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

    const supabase = await createClient();

    console.log(`🔄 Toggle event attendance: ${status} for event ${eventId} by user ${authUser.id}`);

    let newStatus = null;
    let attendeeCount = 0;
    let interestedCount = 0;

    if (status === "remove") {
      // Remove attendance - simple delete
      const { error: deleteError } = await supabase
        .from('event_attendees')
        .delete()
        .eq('event_id', eventId)
        .eq('user_id', authUser.id);

      if (deleteError) {
        console.error("Error removing attendance:", deleteError);
        throw deleteError;
      }

      console.log("✅ Attendance removed");

    } else {
      // Check if user already has attendance for this event
      const { data: existingAttendance } = await supabase
        .from('event_attendees')
        .select('id, status')
        .eq('event_id', eventId)
        .eq('user_id', authUser.id)
        .single();

      if (existingAttendance) {
        // Update existing attendance
        const { error: updateError } = await supabase
          .from('event_attendees')
          .update({ 
            status: status,
            updated_at: new Date().toISOString()
          })
          .eq('event_id', eventId)
          .eq('user_id', authUser.id);

        if (updateError) {
          console.error("Error updating attendance:", updateError);
          throw updateError;
        }

        console.log(`✅ Attendance updated to: ${status}`);
      } else {
        // Create new attendance
        const { error: insertError } = await supabase
          .from('event_attendees')
          .insert({
            event_id: eventId,
            user_id: authUser.id,
            status: status
          });

        if (insertError) {
          console.error("Error creating attendance:", insertError);
          throw insertError;
        }

        console.log(`✅ New attendance created: ${status}`);
      }

      newStatus = status;
    }

    // Get updated counts - simple aggregation query
    const { data: attendees } = await supabase
      .from('event_attendees')
      .select('status')
      .eq('event_id', eventId);

    if (attendees) {
      attendeeCount = attendees.filter(a => a.status === 'going').length;
      interestedCount = attendees.filter(a => a.status === 'interested').length;
    }

    console.log(`✅ Event attendance updated - going: ${attendeeCount}, interested: ${interestedCount}`);

    // Comprehensive revalidation to ensure all cached data is updated
    revalidateTag("events"); // This will invalidate all fetch requests tagged with "events"
    revalidateTag("user-events"); // This will invalidate ALL user events caches (my-events for all users)
    revalidateTag(`event-${eventId}`); // Invalidate specific event detail cache
    revalidateTag("attendees"); // Invalidate attendees cache
    revalidateTag("event-attendees"); // Invalidate user event statuses cache
    revalidateTag(`user-${authUser.id}-attendees`); // Invalidate specific user attendance cache
    
    revalidatePath("/events"); // Events list page
    revalidatePath(`/events/${eventId}`); // Specific event page
    revalidatePath("/events/my-events"); // My events page - shows attendance counts
    revalidatePath("/"); // Homepage (might show event previews)

    console.log(`✅ Revalidated all events cache after attendance update for event ${eventId}`);

    return NextResponse.json({
      success: true,
      userStatus: newStatus,
      attendeeCount,
      interestedCount,
      message: status === "remove" ? "Attendance removed" : `Status updated to ${status}`
    });

  } catch (error) {
    console.error("❌ Error updating event attendance:", error);
    return NextResponse.json(
      { error: "Failed to update attendance" },
      { status: 500 }
    );
  }
}