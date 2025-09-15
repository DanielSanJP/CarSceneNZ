// Simplified Event Detail API - Direct queries instead of RPC

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/utils/supabase/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const userId = body?.userId;
    const startTime = Date.now();

    console.log(`🚀 FETCH CACHE: Fetching event ${id} details via direct queries...`);

    const supabase = await createClient();

    // Get event details with host information
    const { data: eventData, error: eventError } = await supabase
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
      .eq('id', id)
      .single();

    if (eventError || !eventData) {
      console.error("❌ Error fetching event:", eventError);
      if (eventError?.code === 'PGRST116') {
        return NextResponse.json(
          { error: "Event not found" },
          { status: 404 }
        );
      }
      throw eventError;
    }

    console.log(`🔍 DEBUG: Found event: ${eventData.title}`);

    // Get attendees with user information
    const { data: attendeesData, error: attendeesError } = await supabase
      .from('event_attendees')
      .select(`
        id,
        event_id,
        user_id,
        status,
        created_at,
        updated_at,
        user:users!event_attendees_user_id_fkey(
          id,
          username,
          display_name,
          profile_image_url
        )
      `)
      .eq('event_id', id)
      .order('created_at', { ascending: false });

    if (attendeesError) {
      console.error("❌ Error fetching attendees:", attendeesError);
      throw attendeesError;
    }

    // Get user's attendance status if userId is provided
    let userStatus: string | null = null;
    if (userId) {
      const { data: userAttendance } = await supabase
        .from('event_attendees')
        .select('status')
        .eq('event_id', id)
        .eq('user_id', userId)
        .single();

      userStatus = userAttendance?.status || null;
    }

    // Transform data to match EventDetailData interface
    const host = Array.isArray(eventData.host) ? eventData.host[0] : eventData.host;

    // Get attendee counts for the event
    const goingCount = attendeesData?.filter(a => a.status === 'going').length || 0;
    const interestedCount = attendeesData?.filter(a => a.status === 'interested').length || 0;

    const eventDetailData = {
      event: {
        id: eventData.id,
        host_id: eventData.host_id,
        title: eventData.title,
        description: eventData.description,
        poster_image_url: eventData.poster_image_url,
        daily_schedule: eventData.daily_schedule,
        location: eventData.location,
        created_at: eventData.created_at,
        updated_at: eventData.updated_at,
        host: host ? {
          id: host.id,
          username: host.username,
          display_name: host.display_name,
          profile_image_url: host.profile_image_url
        } : undefined,
        attendeeCount: goingCount,
        interestedCount: interestedCount,
      },
      user: userId ? {
        id: userId,
        username: '', // This would need to be fetched if needed
        display_name: undefined,
        profile_image_url: undefined
      } : null,
      attendees: attendeesData?.map(attendee => {
        const user = Array.isArray(attendee.user) ? attendee.user[0] : attendee.user;
        return {
          id: attendee.id,
          event_id: attendee.event_id,
          user_id: attendee.user_id,
          status: attendee.status as 'interested' | 'going' | 'approved',
          created_at: attendee.created_at,
          updated_at: attendee.updated_at,
          user: user ? {
            id: user.id,
            username: user.username,
            display_name: user.display_name,
            profile_image_url: user.profile_image_url
          } : undefined
        };
      }) || [],
      userStatus: userStatus
    };

    const endTime = Date.now();
    console.log(
      `✅ FETCH CACHE: Event ${id} details fetched and processed in ${
        endTime - startTime
      }ms`
    );

    console.log(`📊 Final data - Event: ${eventDetailData.event.title}, Attendees: ${eventDetailData.attendees.length}, User Status: ${eventDetailData.userStatus}`);

    return NextResponse.json(eventDetailData);
  } catch (error) {
    console.error("❌ Error fetching event details:", error);
    return NextResponse.json(
      { error: "Failed to load event details" },
      { status: 500 }
    );
  }
}