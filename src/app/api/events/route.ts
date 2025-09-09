import { NextRequest, NextResponse } from 'next/server';
import { getUserOptional } from '@/lib/auth';
import { createClient } from '@/lib/utils/supabase/server';

interface EventRPCResult {
  id: string;
  host_id: string;
  title: string;
  description: string;
  poster_image_url: string;
  daily_schedule: unknown;
  location: string;
  created_at: string;
  updated_at: string;
  host_username: string;
  host_display_name: string;
  host_profile_image_url: string;
  attendee_count: number;
  interested_count: number;
}

interface AttendeeStatus {
  event_id: string;
  status: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const offset = (page - 1) * limit;

    const currentUser = await getUserOptional();
    const supabase = await createClient();

    // Use optimized RPC function
    const { data: events, error } = await supabase.rpc('get_events_optimized', {
      page_limit: limit,
      page_offset: offset
    });

    if (error) {
      console.error('Events RPC error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch events' },
        { status: 500 }
      );
    }

    // Get user statuses for all events if user is logged in
    let userStatuses: Record<string, string> = {};
    if (currentUser && events?.length > 0) {
      const eventIds = (events as EventRPCResult[]).map(event => event.id);
      
      const { data: statusData } = await supabase
        .from('event_attendees')
        .select('event_id, status')
        .eq('user_id', currentUser.id)
        .in('event_id', eventIds);

      if (statusData) {
        userStatuses = (statusData as AttendeeStatus[]).reduce((acc: Record<string, string>, item: AttendeeStatus) => {
          acc[item.event_id] = item.status;
          return acc;
        }, {});
      }
    }

    // Transform events data to match expected format
    const transformedEvents = (events as EventRPCResult[])?.map((event: EventRPCResult) => ({
      id: event.id,
      host_id: event.host_id,
      title: event.title,
      description: event.description,
      poster_image_url: event.poster_image_url,
      daily_schedule: event.daily_schedule,
      location: event.location,
      created_at: event.created_at,
      updated_at: event.updated_at,
      host: {
        id: event.host_id,
        username: event.host_username,
        display_name: event.host_display_name,
        profile_image_url: event.host_profile_image_url,
      },
      // Include attendee counts
      attendeeCount: Number(event.attendee_count),
      interestedCount: Number(event.interested_count),
    })) || [];

    // Set cache headers for better performance
    const response = NextResponse.json({
      events: transformedEvents,
      userStatuses,
      currentUser,
      pagination: {
        page,
        limit,
        hasMore: transformedEvents.length === limit, // Simple check for more pages
      }
    });

    // Cache for 1 minute for public data, 30 seconds for user-specific data
    const cacheTime = currentUser ? 30 : 60;
    response.headers.set('Cache-Control', `public, max-age=${cacheTime}, stale-while-revalidate=300`);

    return response;

  } catch (error) {
    console.error('Error in events API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
