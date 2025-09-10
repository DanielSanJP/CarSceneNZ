import { NextRequest, NextResponse } from 'next/server';
import { getUserOptional } from '@/lib/auth';
import { createClient } from '@/lib/utils/supabase/server';
import type { Event } from '@/types/event';

async function getEventById(eventId: string): Promise<Event | null> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        host:users!events_host_id_fkey (
          id,
          username,
          display_name,
          profile_image_url
        )
      `)
      .eq('id', eventId)
      .single();

    if (error || !data) {
      return null;
    }

    return data;
  } catch {
    return null;
  }
}

async function getEventAttendeesDetailed(eventId: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('event_attendees')
    .select(`
      id,
      status,
      user:users!event_attendees_user_id_fkey (
        id,
        username,
        display_name,
        profile_image_url
      )
    `)
    .eq('event_id', eventId);

  if (error) {
    console.error('Error fetching event attendees:', error);
    return [];
  }

  return data || [];
}

async function getUserEventStatus(eventId: string, userId: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('event_attendees')
    .select('status')
    .eq('event_id', eventId)
    .eq('user_id', userId)
    .single();

  if (error) {
    return null;
  }

  return data?.status || null;
}

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