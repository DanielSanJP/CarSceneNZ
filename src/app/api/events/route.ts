// Simplified Events Gallery API - Direct queries instead of RPC

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/utils/supabase/server";

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  // Get search params for pagination
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '12');
  const userId = searchParams.get('userId') || null;
  const offset = (page - 1) * limit;
  
  console.log(`🚀 FETCH CACHE: Events API route called - Page ${page}, Limit ${limit}`);

  try {
    const supabase = await createClient();

    // Get events with host information using direct query
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select(`
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
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (eventsError) {
      console.error("❌ Error fetching events:", eventsError);
      throw eventsError;
    }

    console.log(`🔍 DEBUG: Fetched ${events?.length || 0} events from database`);

    // Get attendee counts for all events in parallel
    const eventIds = events?.map(event => event.id) || [];
    const attendeeCounts: Record<string, { going: number; interested: number }> = {};
    const userStatuses: Record<string, string> = {};

    if (eventIds.length > 0) {
      // Get attendee counts for all events
      const { data: attendeeData } = await supabase
        .from('event_attendees')
        .select('event_id, status')
        .in('event_id', eventIds);

      // Count attendees per event by status
      attendeeData?.forEach(attendee => {
        if (!attendeeCounts[attendee.event_id]) {
          attendeeCounts[attendee.event_id] = { going: 0, interested: 0 };
        }
        if (attendee.status === 'going') {
          attendeeCounts[attendee.event_id].going++;
        } else if (attendee.status === 'interested') {
          attendeeCounts[attendee.event_id].interested++;
        }
      });

      // Get user's attendance status if userId is provided
      if (userId) {
        const { data: userAttendanceData } = await supabase
          .from('event_attendees')
          .select('event_id, status')
          .eq('user_id', userId)
          .in('event_id', eventIds);

        userAttendanceData?.forEach(attendance => {
          userStatuses[attendance.event_id] = attendance.status;
        });
      }
    }

    // Transform events data to match interface
    const transformedEvents = events?.map(event => {
      const host = Array.isArray(event.host) ? event.host[0] : event.host;
      const counts = attendeeCounts[event.id] || { going: 0, interested: 0 };
      
      return {
        id: event.id,
        host_id: event.host_id,
        title: event.title,
        description: event.description,
        poster_image_url: event.poster_image_url,
        daily_schedule: event.daily_schedule,
        location: event.location,
        created_at: event.created_at,
        updated_at: event.updated_at,
        host: host ? {
          id: host.id,
          username: host.username,
          display_name: host.display_name,
          profile_image_url: host.profile_image_url,
        } : undefined,
        attendeeCount: counts.going,
        interestedCount: counts.interested,
      };
    }) || [];

    const eventsData = {
      events: transformedEvents,
      userStatuses,
      currentUser: null, // This could be populated if needed
      pagination: {
        page,
        limit,
        hasMore: (events?.length || 0) === limit,
      },
    };

    const endTime = Date.now();
    console.log(`✅ FETCH CACHE: Events data processed in ${endTime - startTime}ms`);
    console.log(`📊 Final data - Events: ${eventsData.events.length}, Has more: ${eventsData.pagination.hasMore}`);

    return NextResponse.json(eventsData, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=1800',
      },
    });

  } catch (error) {
    console.error("❌ Events API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}