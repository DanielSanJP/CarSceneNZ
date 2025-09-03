// import 'server-only';
import { cache } from 'react';
import { createClient } from '@/lib/utils/supabase/server';
import type { Event } from '@/types/event';

/**
 * Get all events with caching - server-only version
 */
export const getAllEvents = cache(async (): Promise<Event[]> => {
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
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error getting all events:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error getting all events:', error);
    return [];
  }
});

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
  
  const { data, error } = await supabase
    .from('event_attendees')
    .upsert({
      event_id: eventId,
      user_id: userId,
      status: status,
    })
    .select();

  if (error) {
    console.error('Error updating event attendance:', error);
    throw error;
  }

  return data;
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
