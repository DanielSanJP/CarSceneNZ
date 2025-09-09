import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes (was cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnMount: true,
    },
    mutations: {
      retry: 1,
    },
  },
});

// Query Keys for consistent caching
export const queryKeys = {
  profile: {
    all: ['profile'] as const,
    user: (userId: string) => [...queryKeys.profile.all, 'user', userId] as const,
    followers: (userId: string) => [...queryKeys.profile.all, 'followers', userId] as const,
    following: (userId: string) => [...queryKeys.profile.all, 'following', userId] as const,
    cars: (userId: string) => [...queryKeys.profile.all, 'cars', userId] as const,
    clubs: (userId: string) => [...queryKeys.profile.all, 'clubs', userId] as const,
    leaderClubs: (userId: string) => [...queryKeys.profile.all, 'leader-clubs', userId] as const,
  },
} as const;
