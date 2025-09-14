import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 10, // 10 minutes - cache data longer for performance
      gcTime: 1000 * 60 * 30,    // 30 minutes - keep in memory longer
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnMount: false,      // Don't auto-refetch if we have cached data
      refetchOnReconnect: true,   // Refetch when connection restored
    },
    mutations: {
      retry: 1,
    },
  },
});

// Enhanced Query Keys for consistent caching across the app
export const queryKeys = {
  auth: {
    all: ['auth'] as const,
    currentUser: () => [...queryKeys.auth.all, 'currentUser'] as const,
  },
  home: {
    all: ['home'] as const,
    data: () => [...queryKeys.home.all, 'data'] as const,
  },
  events: {
    all: ['events'] as const,
    lists: () => [...queryKeys.events.all, 'list'] as const,
    list: (page: number, limit: number) => [...queryKeys.events.lists(), page, limit] as const,
    details: () => [...queryKeys.events.all, 'detail'] as const,
    detail: (eventId: string) => [...queryKeys.events.details(), eventId] as const,
    myEvents: (userId?: string) => [...queryKeys.events.all, 'myEvents', userId] as const,
    userStatuses: (eventIds: string[]) => [...queryKeys.events.all, 'userStatuses', eventIds] as const,
  },
  profile: {
    all: ['profile'] as const,
    user: (userId: string) => [...queryKeys.profile.all, 'user', userId] as const,
    followers: (userId: string) => [...queryKeys.profile.all, 'followers', userId] as const,
    following: (userId: string) => [...queryKeys.profile.all, 'following', userId] as const,
    cars: (userId: string) => [...queryKeys.profile.all, 'cars', userId] as const,
    clubs: (userId: string) => [...queryKeys.profile.all, 'clubs', userId] as const,
    leaderClubs: (userId: string) => [...queryKeys.profile.all, 'leader-clubs', userId] as const,
  },
  inbox: {
    all: ['inbox'] as const,
    messages: (userId: string) => [...queryKeys.inbox.all, 'messages', userId] as const,
    unreadCount: (userId: string) => [...queryKeys.inbox.all, 'unreadCount', userId] as const,
  },
} as const;
