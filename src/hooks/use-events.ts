import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Event } from '@/types/event';
import type { User } from '@/types/user';

export interface EventsData {
  events: Event[];
  userStatuses: Record<string, string>;
  currentUser: User | null;
  pagination: {
    page: number;
    limit: number;
    hasMore: boolean;
  };
}

export interface EventDetailData {
  event: Event;
  user: User | null;
  attendees: AttendeeData[];
  userStatus: string | null;
}

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

// Query keys for better cache management
export const eventsKeys = {
  all: ['events'] as const,
  lists: () => [...eventsKeys.all, 'list'] as const,
  list: (page: number, limit: number) => [...eventsKeys.lists(), page, limit] as const,
  details: () => [...eventsKeys.all, 'detail'] as const,
  detail: (eventId: string) => [...eventsKeys.details(), eventId] as const,
  myEvents: (userId?: string) => [...eventsKeys.all, 'myEvents', userId] as const,
};

// Get events data
async function getEventsData(page: number = 1, limit: number = 12): Promise<EventsData> {
  const response = await fetch(`/api/events?page=${page}&limit=${limit}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch events');
  }

  return response.json();
}

// Get event detail data
async function getEventDetailData(eventId: string): Promise<EventDetailData> {
  const response = await fetch(`/api/events/${eventId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch event details');
  }

  return response.json();
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
export function useEvents(page: number = 1, limit: number = 12) {
  return useQuery({
    queryKey: eventsKeys.list(page, limit),
    queryFn: () => getEventsData(page, limit),
    staleTime: 2 * 60 * 1000, // 2 minutes - events don't change as frequently
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false, // Don't refetch if we have cached data
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    networkMode: 'offlineFirst',
  });
}

// Hook to fetch event details with optimized settings
export function useEventDetail(eventId: string) {
  return useQuery({
    queryKey: eventsKeys.detail(eventId),
    queryFn: () => getEventDetailData(eventId),
    staleTime: 5 * 60 * 1000, // 5 minutes - event details are more static
    gcTime: 15 * 60 * 1000, // 15 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    networkMode: 'offlineFirst',
    enabled: !!eventId, // Only run query if eventId exists
  });
}

// Hook for event attendance mutations
export function useEventAttendance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ eventId, status }: { eventId: string; status: 'interested' | 'going' | 'remove' }) =>
      updateEventAttendance(eventId, status),
    onMutate: async ({ eventId, status }) => {
      // Cancel any outgoing refetches for events
      await queryClient.cancelQueries({ queryKey: eventsKeys.lists() });

      // Snapshot the previous values
      const previousEventsData = queryClient.getQueriesData({
        queryKey: eventsKeys.lists(),
      });

      // Optimistically update all events query caches
      queryClient.setQueriesData<EventsData>(
        { queryKey: eventsKeys.lists() },
        (oldData) => {
          if (!oldData) return oldData;

          return {
            ...oldData,
            events: oldData.events.map(event => {
              if (event.id === eventId) {
                // Update user status
                const newUserStatuses = { ...oldData.userStatuses };
                if (status === 'remove') {
                  delete newUserStatuses[eventId];
                } else {
                  newUserStatuses[eventId] = status;
                }

                // Calculate optimistic count changes
                const currentStatus = oldData.userStatuses[eventId];
                let attendeeCountChange = 0;
                let interestedCountChange = 0;

                // Calculate changes based on status transitions
                if (currentStatus === 'going' && status !== 'going') {
                  attendeeCountChange = -1;
                }
                if (currentStatus === 'interested' && status !== 'interested') {
                  interestedCountChange = -1;
                }
                if (status === 'going' && currentStatus !== 'going') {
                  attendeeCountChange = 1;
                }
                if (status === 'interested' && currentStatus !== 'interested') {
                  interestedCountChange = 1;
                }

                return {
                  ...event,
                  attendeeCount: Math.max(0, (event.attendeeCount || 0) + attendeeCountChange),
                  interestedCount: Math.max(0, (event.interestedCount || 0) + interestedCountChange),
                };
              }
              return event;
            }),
            userStatuses: status === 'remove' 
              ? Object.fromEntries(Object.entries(oldData.userStatuses).filter(([id]) => id !== eventId))
              : { ...oldData.userStatuses, [eventId]: status },
          };
        }
      );

      return { previousEventsData };
    },
    onError: (err, variables, context) => {
      // Revert the optimistic updates on error
      if (context?.previousEventsData) {
        context.previousEventsData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: () => {
      // Refetch events data to ensure consistency
      queryClient.invalidateQueries({ queryKey: eventsKeys.lists() });
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
async function getUserEventsData(): Promise<UserEventsData> {
  const response = await fetch('/api/events/my-events', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch user events');
  }

  return response.json();
}

// Hook to fetch user's events with optimized settings
export function useUserEvents() {
  return useQuery({
    queryKey: eventsKeys.myEvents(),
    queryFn: getUserEventsData,
    staleTime: 2 * 60 * 1000, // 2 minutes - user's own events might change
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    networkMode: 'offlineFirst',
  });
}
