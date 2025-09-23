// Simplified User Events API - Direct queries instead of RPC

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/utils/supabase/server";
import type { Event } from "@/types/event";

// Add cache configuration for this API route
export const revalidate = 60; // 1 minute cache

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userId = body?.userId;
    const pageLimit = body?.pageLimit || 50;
    const pageOffset = body?.pageOffset || 0;
    const filter = body?.filter || 'all'; // 'all', 'hosting', 'going', 'interested'
    const startTime = Date.now();

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    console.log(`🚀 FETCH CACHE: Fetching my events for user ${userId} with filter '${filter}' via direct queries...`);

    const supabase = await createClient();

    let hostedEvents: Event[] = [];
    let attendedEvents: Event[] = [];

    // Get events where user is the host (if filter allows)
    if (filter === 'all' || filter === 'hosting') {
      const { data: hostedEventsData, error: hostedError } = await supabase
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
        .eq('host_id', userId)
        .order('created_at', { ascending: false });

      if (hostedError) {
        console.error("❌ Error fetching hosted events:", hostedError);
        throw hostedError;
      }

      hostedEvents = (hostedEventsData || []) as unknown as Event[];
    }

    // Get events where user is an attendee (if filter allows)
    if (filter === 'all' || filter === 'going' || filter === 'interested') {
      let attendeeQuery = supabase
        .from('event_attendees')
        .select('event_id')
        .eq('user_id', userId);

      // Filter by attendance status if specific status requested
      if (filter === 'going') {
        attendeeQuery = attendeeQuery.eq('status', 'going');
      } else if (filter === 'interested') {
        attendeeQuery = attendeeQuery.eq('status', 'interested');
      }

      const { data: attendedEventIds, error: attendedError } = await attendeeQuery;

      if (attendedError) {
        console.error("❌ Error fetching attended event IDs:", attendedError);
        throw attendedError;
      }

      if (attendedEventIds && attendedEventIds.length > 0) {
        const eventIds = attendedEventIds.map(a => a.event_id);
        const { data: attendedEventsData, error: attendedEventsError } = await supabase
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
          .in('id', eventIds)
          .order('created_at', { ascending: false });

        if (attendedEventsError) {
          console.error("❌ Error fetching attended events:", attendedEventsError);
          throw attendedEventsError;
        }

        attendedEvents = (attendedEventsData || []) as unknown as Event[];
      }
    }

    // Combine and deduplicate events (user might host events they also attend)
    const allEvents = [...(hostedEvents || []), ...attendedEvents];
    const uniqueEvents = allEvents.filter((event, index, arr) => 
      arr.findIndex(e => e.id === event.id) === index
    );

    // Apply pagination to combined results
    const paginatedEvents = uniqueEvents.slice(pageOffset, pageOffset + pageLimit);

    // Get attendee counts for all events
    const eventIds = paginatedEvents.map(event => event.id);
    const attendeeCounts: Record<string, { going: number; interested: number }> = {};

    if (eventIds.length > 0) {
      const { data: attendeeCountData } = await supabase
        .from('event_attendees')
        .select('event_id, status')
        .in('event_id', eventIds);

      // Count attendees per event by status
      attendeeCountData?.forEach(attendee => {
        if (!attendeeCounts[attendee.event_id]) {
          attendeeCounts[attendee.event_id] = { going: 0, interested: 0 };
        }
        if (attendee.status === 'going') {
          attendeeCounts[attendee.event_id].going++;
        } else if (attendee.status === 'interested') {
          attendeeCounts[attendee.event_id].interested++;
        }
      });
    }

    // Transform events data
    const transformedEvents = paginatedEvents.map(event => {
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
    });

    console.log(`🔍 DEBUG: Filter '${filter}' - Found ${hostedEvents?.length || 0} hosted and ${attendedEvents.length} attended events`);
    console.log(`🔍 DEBUG: Total unique events: ${uniqueEvents.length}, paginated: ${transformedEvents.length}`);

    const endTime = Date.now();
    console.log(`✅ FETCH CACHE: User ${userId} events (filter: ${filter}) fetched and processed in ${endTime - startTime}ms`);

    return NextResponse.json(transformedEvents, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        'Cache-Tags': `events,event-attendees,user-${userId}-events,my-events`, // Add cache tags for proper invalidation
      }
    });
  } catch (error) {
    console.error("❌ Error fetching user events data:", error);
    return NextResponse.json(
      { error: "Failed to fetch user events data" },
      { status: 500 }
    );
  }
}