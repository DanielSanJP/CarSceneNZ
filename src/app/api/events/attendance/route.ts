import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';
import { createClient } from '@/lib/utils/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { eventId, status } = await request.json();

    if (!eventId || !status) {
      return NextResponse.json(
        { error: 'Event ID and status are required' },
        { status: 400 }
      );
    }

    if (!['interested', 'going', 'remove'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be "interested", "going", or "remove"' },
        { status: 400 }
      );
    }

    // Use optimized RPC function
    const supabase = await createClient();
    const { data: result, error } = await supabase.rpc('toggle_event_attendance', {
      target_event_id: eventId,
      current_user_id: currentUser.id,
      attendance_status: status
    });

    if (error || !result?.[0]?.success) {
      console.error('Event attendance RPC error:', error);
      return NextResponse.json(
        { error: 'Failed to update event attendance' },
        { status: 500 }
      );
    }

    const attendanceResult = result[0];

    return NextResponse.json({
      success: true,
      userStatus: attendanceResult.user_status,
      newAttendeeCount: attendanceResult.new_attendee_count,
      newInterestedCount: attendanceResult.new_interested_count,
    });

  } catch (error) {
    console.error('Error in event attendance API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
