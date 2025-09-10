import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Event, EventsData, EventDetailData, EventAttendee } from '@/types/event';
import { createClient } from '@/lib/utils/supabase/client';

// Query keys for better cache management
export const eventsKeys = {
  all: ['events'] as const,
  lists: () => [...eventsKeys.all, 'list'] as const,
  list: (page: number, limit: number) => [...eventsKeys.lists(), page, limit] as const,
  details: () => [...eventsKeys.all, 'detail'] as const,
  detail: (eventId: string) => [...eventsKeys.details(), eventId] as const,
  myEvents: (userId?: string) => [...eventsKeys.all, 'myEvents', userId] as const,
};

// RPC result interface
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

// Attendee status interface
interface AttendeeStatus {
  event_id: string;
  status: string;
}

// Get events data
async function getEventsData(page: number = 1, limit: number = 12): Promise<EventsData> {
  const { createClient } = await import('@/lib/utils/supabase/client');
  const supabase = createClient();
  
  const offset = (page - 1) * limit;

  // Use optimized RPC function
  const { data: events, error } = await supabase.rpc('get_events_optimized', {
    page_limit: limit,
    page_offset: offset
  });

  if (error) {
    console.error('Events RPC error:', error);
    throw new Error(error.message || 'Failed to fetch events');
  }

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  
  // Get user statuses for all events if user is logged in
  let userStatuses: Record<string, string> = {};
  if (user && events?.length > 0) {
    const eventIds = (events as EventRPCResult[]).map(event => event.id);
    
    const { data: statusData } = await supabase
      .from('event_attendees')
      .select('event_id, status')
      .eq('user_id', user.id)
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
    daily_schedule: event.daily_schedule as Array<{
      date: string;
      start_time?: string;
      end_time?: string;
    }>,
    location: event.location,
    created_at: event.created_at,
    updated_at: event.updated_at,
    host: {
      id: event.host_id,
      username: event.host_username,
      display_name: event.host_display_name,
      profile_image_url: event.host_profile_image_url,
    },
    attendeeCount: Number(event.attendee_count),
    interestedCount: Number(event.interested_count),
  })) || [];

  return {
    events: transformedEvents,
    userStatuses,
    currentUser: user ? {
      id: user.id,
      username: user.user_metadata?.username || '',
      display_name: user.user_metadata?.display_name,
      profile_image_url: user.user_metadata?.profile_image_url,
    } : null,
    pagination: {
      page,
      limit,
      hasMore: transformedEvents.length === limit,
    }
  };
}

// Get event detail data
async function getEventDetailData(eventId: string): Promise<EventDetailData> {
  const { createClient } = await import('@/lib/utils/supabase/client');
  const supabase = createClient();
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  
  // Get event details
  const { data: event, error } = await supabase
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

  if (error || !event) {
    throw new Error('Event not found');
  }

  // Get attendees and user status in parallel
  const [attendeesResult, userStatusResult] = await Promise.all([
    supabase
      .from('event_attendees')
      .select(`
        id,
        status,
        event_id,
        user_id,
        created_at,
        updated_at,
        user:users!event_attendees_user_id_fkey (
          id,
          username,
          display_name,
          profile_image_url
        )
      `)
      .eq('event_id', eventId),
    user ? supabase
      .from('event_attendees')
      .select('status')
      .eq('event_id', eventId)
      .eq('user_id', user.id)
      .single() : Promise.resolve({ data: null, error: null })
  ]);

  // Define interface for attendee data
  interface AttendeeRow {
    id: string;
    event_id: string;
    user_id: string;
    status: string;
    created_at: string;
    updated_at: string;
    user: {
      id: string;
      username: string;
      display_name: string | null;
      profile_image_url: string | null;
    };
  }

  const attendees = (attendeesResult.data || []).map((attendee: unknown) => {
    const a = attendee as AttendeeRow;
    return {
      id: a.id,
      event_id: a.event_id,
      user_id: a.user_id,
      status: a.status,
      created_at: a.created_at,
      updated_at: a.updated_at,
      user: Array.isArray(a.user) ? a.user[0] : a.user,
    };
  }) as EventAttendee[];
  const userStatus = userStatusResult.data?.status || null;

  return {
    event,
    user: user ? {
      id: user.id,
      username: user.user_metadata?.username || '',
      display_name: user.user_metadata?.display_name,
      profile_image_url: user.user_metadata?.profile_image_url,
    } : null,
    attendees,
    userStatus,
  };
}

// Update event attendance
async function updateEventAttendance(eventId: string, status: 'interested' | 'going' | 'remove') {
  const response = await fetch('/api/events/attendance', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      eventId,
      status,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update attendance');
  }

  return response.json();
}

// Hook to fetch events with optimized settings
export function useEvents(page: number = 1, limit: number = 12, initialData?: EventsData | null) {
  return useQuery({
    queryKey: eventsKeys.list(page, limit),
    queryFn: () => getEventsData(page, limit),
    staleTime: 15 * 60 * 1000, // 15 minutes - events change infrequently
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false, // Don't refetch if we have cached data
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    networkMode: 'offlineFirst',
    initialData: initialData || undefined, // Use server-provided data as initial data
  });
}

// Hook to fetch event details with optimized settings
export function useEventDetail(eventId: string, initialData?: EventDetailData | null) {
  return useQuery({
    queryKey: eventsKeys.detail(eventId),
    queryFn: () => getEventDetailData(eventId),
    staleTime: 10 * 60 * 1000, // 10 minutes - event details are very static
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    networkMode: 'offlineFirst',
    enabled: !!eventId, // Only run query if eventId exists
    initialData: initialData || undefined, // Use server-provided data as initial data
  });
}

// Hook for event attendance mutations
export function useEventAttendance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ eventId, status }: { eventId: string; status: 'interested' | 'going' | 'remove' }) =>
      updateEventAttendance(eventId, status),
    onSuccess: (data, variables) => {
      // Update the cache with the actual server response
      if (data.success) {
        // Update events list cache with new counts and user status
        queryClient.setQueriesData<EventsData>(
          { queryKey: eventsKeys.lists() },
          (oldData) => {
            if (!oldData) return oldData;

            return {
              ...oldData,
              events: oldData.events.map(event => {
                if (event.id === variables.eventId) {
                  return {
                    ...event,
                    attendeeCount: data.attendeeCount,
                    interestedCount: data.interestedCount,
                  };
                }
                return event;
              }),
              userStatuses: data.userStatus 
                ? { ...oldData.userStatuses, [variables.eventId]: data.userStatus }
                : Object.fromEntries(Object.entries(oldData.userStatuses).filter(([id]) => id !== variables.eventId)),
            };
          }
        );

        // Update event detail cache with new counts and user status
        queryClient.setQueryData<EventDetailData>(
          eventsKeys.detail(variables.eventId),
          (oldData) => {
            if (!oldData) return oldData;

            return {
              ...oldData,
              userStatus: data.userStatus || null,
              event: {
                ...oldData.event,
                attendeeCount: data.attendeeCount,
                interestedCount: data.interestedCount,
              }
            };
          }
        );
      }
    },
    onError: (error) => {
      console.error('Event attendance error:', error);
    },
  });
}

// Hook to prefetch events data (useful for navigation)
export function usePrefetchEvents() {
  const queryClient = useQueryClient();

  return (page: number = 1, limit: number = 12) => {
    queryClient.prefetchQuery({
      queryKey: eventsKeys.list(page, limit),
      queryFn: () => getEventsData(page, limit),
      staleTime: 2 * 60 * 1000, // 2 minutes
      gcTime: 5 * 60 * 1000, // 5 minutes for prefetched data
    });
  };
}

// Hook for preloading events on hover (performance optimization)
export function useEventsPreloader() {
  const prefetch = usePrefetchEvents();
  
  return {
    preloadEvents: (page: number = 1, limit: number = 12) => {
      // Add small delay to avoid excessive prefetching
      const timeoutId = setTimeout(() => {
        prefetch(page, limit);
      }, 300);
      
      return () => clearTimeout(timeoutId);
    }
  };
}

// User Events Data Interface
export interface UserEventsData {
  events: Event[];
  total: number;
  meta: {
    generated_at: string;
    cache_key: string;
  };
}

// Get user's events data
export async function getUserEventsData(userId: string): Promise<UserEventsData> {
  const supabase = createClient();
  
  const { data, error } = await supabase.rpc('get_user_events_optimized', {
    user_id_param: userId,
  });

  if (error) {
    console.error('Error fetching user events:', error);
    throw new Error('Failed to fetch user events');
  }

  if (!data) {
    throw new Error('No user events data returned');
  }

  return data;
}

// Hook to fetch user's events with optimized settings
export function useUserEvents(userId?: string, initialData?: UserEventsData | null) {
  return useQuery({
    queryKey: eventsKeys.myEvents(userId),
    queryFn: async () => {
      if (!userId) {
        throw new Error('User ID is required to fetch user events');
      }
      return getUserEventsData(userId);
    },
    initialData: initialData || undefined,
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes - user's own events might change
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    networkMode: 'offlineFirst',
  });
}
