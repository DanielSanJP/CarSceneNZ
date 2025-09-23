'use server';

import { getAuthUser } from '@/lib/auth';
import { createClient } from '@/lib/utils/supabase/server';
import { revalidateTag, revalidatePath } from 'next/cache';

export async function toggleEventAttendanceAction(eventId: string, status?: "interested" | "going" | "remove") {
  try {
    // Get user authentication
    const authUser = await getAuthUser();
    if (!authUser) {
      return { success: false, error: "Authentication required" };
    }

    if (!eventId) {
      return { success: false, error: "Event ID is required" };
    }

    const supabase = await createClient();

    console.log(`🔄 Server Action: Updating attendance for event ${eventId}, user ${authUser.id}, status: ${status || 'toggle'}`);

    // 1. Check if user is already attending this event
    const { data: existingAttendance, error: checkError } = await supabase
      .from('event_attendees')
      .select('id')
      .eq('event_id', eventId)
      .eq('user_id', authUser.id)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('❌ Error checking existing attendance:', checkError);
      return { success: false, error: 'Failed to check attendance status' };
    }

    let isAttending = false;
    let newAttendeeCount = 0;

    // If status is 'remove' or if already attending and no specific status, remove attendance
    if (status === 'remove' || (existingAttendance && !status)) {
      if (existingAttendance) {
        const { error: deleteError } = await supabase
          .from('event_attendees')
          .delete()
          .eq('id', existingAttendance.id);

        if (deleteError) {
          console.error('❌ Error removing attendance:', deleteError);
          return { success: false, error: 'Failed to leave event' };
        }

        console.log(`👋 User left event ${eventId}`);
        isAttending = false;
      }
    } else {
      // Add or update attendance (interested/going are both treated as attending)
      if (!existingAttendance) {
        const { error: insertError } = await supabase
          .from('event_attendees')
          .insert({
            event_id: eventId,
            user_id: authUser.id,
            status: status || 'going' // Default to 'going' if no status specified
          });

        if (insertError) {
          console.error('❌ Error adding attendance:', insertError);
          return { success: false, error: 'Failed to join event' };
        }

        console.log(`🎉 User joined event ${eventId} with status ${status || 'going'}`);
        isAttending = true;
      } else {
        // Update existing attendance status
        const { error: updateError } = await supabase
          .from('event_attendees')
          .update({ status: status || 'going' })
          .eq('id', existingAttendance.id);

        if (updateError) {
          console.error('❌ Error updating attendance:', updateError);
          return { success: false, error: 'Failed to update attendance' };
        }

        console.log(`🔄 Updated event ${eventId} attendance status to ${status || 'going'}`);
        isAttending = true;
      }
    }

    // 2. Get updated attendee count
    const { count: attendeeCount, error: countError } = await supabase
      .from('event_attendees')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', eventId);

    if (countError) {
      console.error('❌ Error getting attendee count:', countError);
      return { success: false, error: 'Failed to get updated attendee count' };
    }

    newAttendeeCount = attendeeCount || 0;

    console.log(`✅ Event ${eventId} attendee count: ${newAttendeeCount}`);

    // Server Actions immediately invalidate both Data Cache AND Router Cache
    revalidatePath('/events/[id]', 'page');
    revalidatePath(`/events/${eventId}`);
    revalidatePath('/events');
    revalidatePath('/events/my-events');
    revalidatePath('/'); // Homepage might show attending events
    
    revalidateTag(`event-${eventId}`);
    revalidateTag('events');
    revalidateTag('event-attendees'); // Revalidate user-statuses API cache
    revalidateTag(`user-${authUser.id}-attendees`); // Revalidate user-specific attendance cache
    revalidateTag(`user-${authUser.id}-events`); // Revalidate user-specific events cache
    revalidateTag('my-events'); // Revalidate my-events cache tag
    revalidateTag('home-data'); // Revalidate home data cache tag
    
    console.log(`🔄 Server Action: Cache invalidated for event ${eventId} attendance toggle`);

    return { 
      success: true, 
      isAttending, 
      attendeeCount: newAttendeeCount 
    };

  } catch (error) {
    console.error('❌ Error in toggle event attendance action:', error);
    return { success: false, error: 'Internal server error' };
  }
}