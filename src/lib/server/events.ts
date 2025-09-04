// import 'server-only';
import { cache } from 'react';
import { createClient } from '@/lib/utils/supabase/server';
import type { Event } from '@/types/event';

/**
 * Get event by ID with caching - server-only version
 */
export const getEventById = cache(async (eventId: string): Promise<Event | null> => {
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
      console.error('Error getting event by id:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error getting event by id:', error);
    return null;
  }
});

export const getEventAttendees = cache(async (eventId: string) => {
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

  return data;
});

export const getEventsByHost = cache(async (hostId: string) => {
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
    .eq('host_id', hostId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching events by host:', error);
    return [];
  }

  return data;
});

export async function attendEvent(eventId: string, userId: string, status: 'interested' | 'going' | 'approved') {
  const supabase = await createClient();
  
  // First, check if the user already has an attendance record for this event
  const { data: existingRecord } = await supabase
    .from('event_attendees')
    .select('id')
    .eq('event_id', eventId)
    .eq('user_id', userId)
    .single();

  let result;
  
  if (existingRecord) {
    // Update existing record
    const { data, error } = await supabase
      .from('event_attendees')
      .update({
        status: status,
        updated_at: new Date().toISOString(),
      })
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .select();
      
    if (error) {
      console.error('Error updating event attendance:', error);
      throw error;
    }
    result = data;
  } else {
    // Create new record
    const { data, error } = await supabase
      .from('event_attendees')
      .insert({
        event_id: eventId,
        user_id: userId,
        status: status,
      })
      .select();
      
    if (error) {
      console.error('Error creating event attendance:', error);
      throw error;
    }
    result = data;
  }

  return result;
}

export async function unattendEvent(eventId: string, userId: string) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('event_attendees')
    .delete()
    .eq('event_id', eventId)
    .eq('user_id', userId);

  if (error) {
    console.error('Error removing event attendance:', error);
    throw error;
  }
}

export const getUserEventStatus = cache(async (eventId: string, userId: string) => {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('event_attendees')
    .select('status')
    .eq('event_id', eventId)
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No record found, user hasn't responded
      return null;
    }
    console.error('Error fetching user event status:', error);
    return null;
  }

  return data.status;
});

export async function createEvent(eventData: Partial<Event>) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('events')
    .insert(eventData)
    .select()
    .single();

  if (error) {
    console.error('Error creating event:', error);
    throw error;
  }

  return data;
}

export async function updateEvent(id: string, eventData: Partial<Event>) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('events')
    .update(eventData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating event:', error);
    throw error;
  }

  return data;
}

export async function deleteEvent(id: string) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting event:', error);
    throw error;
  }
}

/**
 * Get attendee counts for multiple events
 * Returns a record with event IDs as keys and count objects as values
 */
export const getEventAttendeeCounts = cache(async (eventIds: string[]) => {
  if (eventIds.length === 0) return {};
  
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("event_attendees")
    .select("event_id, status")
    .in("event_id", eventIds);
    
  if (error) {
    console.error("Error fetching attendee counts:", error);
    return {};
  }
  
  // Group by event_id and count by status
  const counts: Record<string, { interested: number; going: number; total: number }> = {};
  
  eventIds.forEach(id => {
    counts[id] = { interested: 0, going: 0, total: 0 };
  });
  
  data?.forEach(attendee => {
    if (counts[attendee.event_id]) {
      counts[attendee.event_id].total++;
      if (attendee.status === "interested") {
        counts[attendee.event_id].interested++;
      } else if (attendee.status === "going" || attendee.status === "approved") {
        counts[attendee.event_id].going++;
      }
    }
  });
  
  return counts;
});

/**
 * Get user status for multiple events
 * Returns a record with event IDs as keys and user status as values
 */
export const getUserEventStatuses = cache(async (eventIds: string[], userId: string) => {
  if (eventIds.length === 0 || !userId) return {};
  
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("event_attendees")
    .select("event_id, status")
    .eq("user_id", userId)
    .in("event_id", eventIds);
    
  if (error) {
    console.error("Error fetching user event statuses:", error);
    return {};
  }
  
  // Convert to record format
  const statuses: Record<string, string> = {};
  data?.forEach(attendee => {
    statuses[attendee.event_id] = attendee.status;
  });
  
  return statuses;
});

// Define the types for server action returns
export interface AttendeeData {
  id: string;
  status: "interested" | "going" | "approved";
  user: {
    id: string;
    username: string;
    display_name?: string;
    profile_image_url?: string;
  };
}

interface SupabaseAttendeeResponse {
  id: string;
  status: string;
  user:
    | {
        id: string;
        username: string;
        display_name?: string;
        profile_image_url?: string;
      }
    | {
        id: string;
        username: string;
        display_name?: string;
        profile_image_url?: string;
      }[];
}

/**
 * Get detailed attendee data for a single event
 */
export async function getEventAttendeesDetailed(eventId: string): Promise<AttendeeData[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("event_attendees")
    .select(
      `
      id,
      status,
      user:users!event_attendees_user_id_fkey (
        id,
        username,
        display_name,
        profile_image_url
      )
    `
    )
    .eq("event_id", eventId);

  if (error) {
    console.error("Error fetching event attendees:", error);
    return [];
  }

  // Transform the data to match our AttendeeData interface
  const transformedData: AttendeeData[] = (data || []).map(
    (item: SupabaseAttendeeResponse) => ({
      id: item.id,
      status: item.status as "interested" | "going" | "approved",
      user: Array.isArray(item.user) ? item.user[0] : item.user,
    })
  );

  return transformedData;
}
