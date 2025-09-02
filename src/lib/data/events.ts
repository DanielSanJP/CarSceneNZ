import { createClient } from '@/lib/utils/supabase/client'
import type { Event, EventAttendee } from '@/types/event'
import { updateEventImageFileName } from '@/lib/utils/upload-event-images'

export async function getAllEvents(): Promise<Event[]> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        users!events_host_id_fkey (
          id,
          username,
          profile_image_url
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error getting all events:', error)
      return []
    }

    return data?.map(event => ({
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
        id: event.users.id,
        username: event.users.username,
        display_name: event.users.username, // display_name not stored in users table
        profile_image_url: event.users.profile_image_url,
      }
    })) || []
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
        users!events_host_id_fkey (
          id,
          username,
          profile_image_url
        )
      `)
      .eq('id', eventId)
      .single()

    if (error || !data) {
      console.error('Error getting event by ID:', error)
      return null
    }

    return {
      id: data.id,
      host_id: data.host_id,
      title: data.title,
      description: data.description,
      poster_image_url: data.poster_image_url,
      daily_schedule: data.daily_schedule,
      location: data.location,
      created_at: data.created_at,
      updated_at: data.updated_at,
      host: {
        id: data.users.id,
        username: data.users.username,
        profile_image_url: data.users.profile_image_url,
      }
    }
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
        users!events_host_id_fkey (
          id,
          username,
          profile_image_url
        )
      `)
      .eq('host_id', hostId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error getting events by host:', error)
      return []
    }

    return data?.map(event => ({
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
        id: event.users.id,
        username: event.users.username,
        profile_image_url: event.users.profile_image_url,
      }
    })) || []
  } catch (error) {
    console.error('Error getting events by host:', error)
    return []
  }
}

export async function createEvent(eventData: Omit<Event, 'id' | 'created_at' | 'updated_at' | 'host'>): Promise<Event | null> {
  try {
    const supabase = createClient()

    let posterImageUrl = eventData.poster_image_url;

    // Handle poster image upload if it's a base64 string (legacy support)
    if (posterImageUrl && posterImageUrl.startsWith('data:image/')) {
      try {
        // Extract the base64 data and mime type
        const [mimeInfo, base64Data] = posterImageUrl.split(',');
        const mimeType = mimeInfo.split(':')[1].split(';')[0];

        // Convert base64 to buffer
        const buffer = Buffer.from(base64Data, 'base64');

        // Generate unique filename
        const fileName = `event_${eventData.host_id}_${Date.now()}.${mimeType.split('/')[1]}`;

        // Upload to Supabase storage
        const { error: uploadError } = await supabase.storage
          .from('events')
          .upload(fileName, buffer, {
            contentType: mimeType,
            upsert: false
          });

        if (uploadError) {
          console.error('Poster image upload error:', uploadError);
          posterImageUrl = undefined; // Continue without poster image if upload fails
        } else {
          // Get public URL
          const { data: urlData } = supabase.storage
            .from('events')
            .getPublicUrl(fileName);

          posterImageUrl = urlData.publicUrl;
        }
      } catch (error) {
        console.error('Error processing poster image:', error);
        posterImageUrl = undefined; // Continue without poster image if processing fails
      }
    }

    const { data, error } = await supabase
      .from('events')
      .insert({
        host_id: eventData.host_id,
        title: eventData.title,
        description: eventData.description,
        poster_image_url: posterImageUrl,
        daily_schedule: eventData.daily_schedule,
        location: eventData.location,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating event:', error)
      return null
    }

    // If we have a temp image URL, update the filename to use the actual event ID
    if (posterImageUrl && posterImageUrl.includes('temp_')) {
      try {
        const urlParts = posterImageUrl.split('/')
        const fileName = urlParts[urlParts.length - 1]
        const updatedUrl = await updateEventImageFileName(fileName, data.id)
        if (updatedUrl) {
          // Update the event record with the new URL
          await supabase
            .from('events')
            .update({ poster_image_url: updatedUrl })
            .eq('id', data.id)
        }
      } catch (error) {
        console.error('Error updating event image filename:', error)
        // Continue - the event is created, just with the temp filename
      }
    }

    return await getEventById(data.id)
  } catch (error) {
    console.error('Error creating event:', error)
    return null
  }
}

export async function updateEvent(eventId: string, updates: Partial<Omit<Event, 'id' | 'created_at' | 'updated_at' | 'host'>>): Promise<Event | null> {
  try {
    const supabase = createClient()

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { data, error } = await supabase
      .from('events')
      .update({
        title: updates.title,
        description: updates.description,
        poster_image_url: updates.poster_image_url,
        daily_schedule: updates.daily_schedule,
        location: updates.location,
        updated_at: new Date().toISOString(),
      })
      .eq('id', eventId)
      .select()
      .single()

    if (error) {
      console.error('Error updating event:', error)
      return null
    }

    return await getEventById(eventId)
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
        display_name: attendee.users.username, // display_name not stored in users table
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

    const { error } = await supabase
      .from('event_attendees')
      .upsert({
        event_id: eventId,
        user_id: userId,
        status: status,
      })

    if (error) {
      console.error('Error attending event:', error)
      return false
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
