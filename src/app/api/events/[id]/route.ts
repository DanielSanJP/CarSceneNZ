import { NextRequest, NextResponse } from 'next/server';
import { getUserOptional } from '@/lib/auth';
import {
  getEventById,
  getEventAttendeesDetailed,
  getUserEventStatus,
} from '@/lib/server/events';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Get user if authenticated
    const user = await getUserOptional();
    
    // Get event details
    const event = await getEventById(id);
    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Get attendees and user status in parallel
    const [attendees, userStatus] = await Promise.all([
      getEventAttendeesDetailed(id),
      user ? getUserEventStatus(id, user.id) : Promise.resolve(null),
    ]);

    const eventDetailData = {
      event,
      user,
      attendees,
      userStatus,
    };

    return NextResponse.json(eventDetailData, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600', // 5 min cache, 10 min stale
      },
    });
  } catch (error) {
    console.error('Error fetching event details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch event details' },
      { status: 500 }
    );
  }
}