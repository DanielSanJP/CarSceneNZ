import { createClient } from '@/lib/utils/supabase/client'
import type { Event, EventAttendee } from '@/types/event'

export async function getAllEvents(): Promise<Event[]> {
  try {
    const supabase = createClient()

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
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error getting all events:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error getting all events:', error)
    return []
  }
}

export async function getEventById(eventId: string): Promise<Event | null> {
  try {
    const supabase = createClient()

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
      .single()

    if (error || !data) {
      console.error('Error getting event by ID:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error getting event by ID:', error)
    return null
  }
}

export async function getEventsByHost(hostId: string): Promise<Event[]> {
  try {
    const supabase = createClient()

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
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error getting events by host:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error getting events by host:', error)
    return []
  }
}

export async function createEvent(eventData: {
  host_id: string
  title: string
  description?: string
  poster_image_url?: string
  location?: string
  daily_schedule: Array<{
    date: string
    start_time?: string
    end_time?: string
  }>
}): Promise<Event | null> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('events')
      .insert({
        host_id: eventData.host_id,
        title: eventData.title,
        description: eventData.description,
        poster_image_url: eventData.poster_image_url,
        location: eventData.location,
        daily_schedule: eventData.daily_schedule,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating event:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error creating event:', error)
    return null
  }
}

export async function updateEvent(eventId: string, updates: {
  title?: string
  description?: string
  poster_image_url?: string
  location?: string
  daily_schedule?: Array<{
    date: string
    start_time?: string
    end_time?: string
  }>
}): Promise<Event | null> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('events')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', eventId)
      .select()
      .single()

    if (error) {
      console.error('Error updating event:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error updating event:', error)
    return null
  }
}

export async function deleteEvent(eventId: string): Promise<boolean> {
  try {
    const supabase = createClient()

    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', eventId)

    if (error) {
      console.error('Error deleting event:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error deleting event:', error)
    return false
  }
}

export async function getEventAttendees(eventId: string): Promise<EventAttendee[]> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('event_attendees')
      .select(`
        *,
        users!event_attendees_user_id_fkey (
          id,
          username,
          profile_image_url
        )
      `)
      .eq('event_id', eventId)

    if (error) {
      console.error('Error getting event attendees:', error)
      return []
    }

    return data?.map(attendee => ({
      id: attendee.id,
      event_id: attendee.event_id,
      user_id: attendee.user_id,
      status: attendee.status,
      created_at: attendee.created_at,
      user: {
        id: attendee.users.id,
        username: attendee.users.username,
        display_name: attendee.users.username,
        profile_image_url: attendee.users.profile_image_url,
      }
    })) || []
  } catch (error) {
    console.error('Error getting event attendees:', error)
    return []
  }
}

export async function attendEvent(eventId: string, userId: string, status: string = 'interested'): Promise<boolean> {
  try {
    const supabase = createClient()

    // Check if user already has an attendance record
    const { data: existingRecord } = await supabase
      .from('event_attendees')
      .select('id')
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .single()

    if (existingRecord) {
      // Update existing record
      const { error } = await supabase
        .from('event_attendees')
        .update({ status })
        .eq('event_id', eventId)
        .eq('user_id', userId)

      if (error) {
        console.error('Error updating event attendance:', error)
        return false
      }
    } else {
      // Insert new record
      const { error } = await supabase
        .from('event_attendees')
        .insert({
          event_id: eventId,
          user_id: userId,
          status: status,
        })

      if (error) {
        console.error('Error creating event attendance:', error)
        return false
      }
    }

    return true
  } catch (error) {
    console.error('Error attending event:', error)
    return false
  }
}

export async function unattendEvent(eventId: string, userId: string): Promise<boolean> {
  try {
    const supabase = createClient()

    const { error } = await supabase
      .from('event_attendees')
      .delete()
      .eq('event_id', eventId)
      .eq('user_id', userId)

    if (error) {
      console.error('Error unattending event:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error unattending event:', error)
    return false
  }
}

export async function getUserEventStatus(eventId: string, userId: string): Promise<string | null> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('event_attendees')
      .select('status')
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .single()

    if (error || !data) {
      return null
    }

    return data.status
  } catch (error) {
    console.error('Error getting user event status:', error)
    return null
  }
}
