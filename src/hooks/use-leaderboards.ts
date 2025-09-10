import { useQuery } from '@tanstack/react-query';
import type { CarRanking, OwnerRanking, ClubRanking } from '@/types/leaderboard';

// Leaderboards Data Interface
export interface LeaderboardsData {
  cars: CarRanking[];
  owners: OwnerRanking[];
  clubs: ClubRanking[];
  meta: {
    generated_at: string;
    cache_key: string;
  };
}

// Query keys for better cache management
export const leaderboardsKeys = {
  all: ['leaderboards'] as const,
  data: () => [...leaderboardsKeys.all, 'data'] as const,
} as const;

// Get leaderboards data
async function getLeaderboardsData(): Promise<LeaderboardsData> {
  const response = await fetch('/api/leaderboards', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch leaderboards: ${response.status}`);
  }

  return response.json();
}

// React Query hook for leaderboards data
export function useLeaderboards() {
  return useQuery({
    queryKey: leaderboardsKeys.data(),
    queryFn: getLeaderboardsData,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}
