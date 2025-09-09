import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import type { Event } from '@/types/event';
import type { Car } from '@/types/car';
import type { User } from '@/types/user';

// Extended types for home page data
export interface HomeEvent extends Event {
  host?: {
    id: string;
    username: string;
    display_name?: string;
    profile_image_url?: string;
  };
  attendeeCount?: number;
  interestedCount?: number;
}

export interface HomeCar extends Car {
  owner?: {
    id: string;
    username: string;
    display_name?: string;
    profile_image_url?: string;
  };
}

export interface HomeClub {
  id: string;
  name: string;
  description?: string;
  logo_url?: string;
  banner_url?: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  leader_id: string;
  leader?: {
    id: string;
    username: string;
    display_name?: string;
    profile_image_url?: string;
  };
  member_count?: number;
}

export interface HomeUser extends User {
  car_count?: number;
  followers_count?: number;
}

export interface HomeData {
  events: HomeEvent[];
  cars: HomeCar[];
  clubs: HomeClub[];
  users: HomeUser[];
  stats: {
    total_events: number;
    total_cars: number;
    total_clubs: number;
    total_users: number;
  };
  meta: {
    generated_at: string;
    cache_key: string;
  };
}

// Query keys for better cache management
export const homeKeys = {
  all: ['home'] as const,
  data: () => [...homeKeys.all, 'data'] as const,
};

// Get home page data
async function getHomeData(): Promise<HomeData> {
  const response = await fetch('/api/home', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch home page data');
  }

  return response.json();
}

// Hook to fetch home page data with optimized settings
export function useHomeData() {
  return useQuery({
    queryKey: homeKeys.data(),
    queryFn: getHomeData,
    staleTime: 5 * 60 * 1000, // 5 minutes - home page data changes less frequently
    gcTime: 15 * 60 * 1000, // 15 minutes - keep cached longer
    refetchOnWindowFocus: false,
    refetchOnMount: false, // Don't refetch if we have cached data
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    networkMode: 'offlineFirst',
  });
}

// Hook for prefetching home data (useful for navigation)
export function usePrefetchHomeData() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.prefetchQuery({
      queryKey: homeKeys.data(),
      queryFn: getHomeData,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes for prefetched data
    });
  };
}

// Hook for preloading home data on hover (performance optimization)
export function useHomeDataPreloader() {
  const prefetch = usePrefetchHomeData();
  
  return {
    preloadHomeData: () => {
      // Add small delay to avoid excessive prefetching
      const timeoutId = setTimeout(() => {
        prefetch();
      }, 300);
      
      return () => clearTimeout(timeoutId);
    }
  };
}

// Utility hook to get processed data for specific sections
export function useHomeDataProcessed() {
  const { data: homeData, ...queryResult } = useHomeData();

  const processedData = useMemo(() => {
    if (!homeData) return null;

    // Process upcoming events (filter for future dates and sort)
    const upcomingEvents = homeData.events
      .filter((event) => {
        if (!event.daily_schedule || event.daily_schedule.length === 0) return false;
        return new Date(event.daily_schedule[0].date) > new Date();
      })
      .sort((a, b) => {
        if (!a.daily_schedule?.[0] || !b.daily_schedule?.[0]) return 0;
        return new Date(a.daily_schedule[0].date).getTime() - new Date(b.daily_schedule[0].date).getTime();
      })
      .slice(0, 3);

    // Process featured cars (sort by likes, take top 3)
    const featuredCars = homeData.cars
      .sort((a, b) => (b.total_likes || 0) - (a.total_likes || 0))
      .slice(0, 3);

    // Create users map for quick lookups
    const usersMap = homeData.users.reduce((map, user) => {
      map[user.id] = user;
      return map;
    }, {} as Record<string, HomeUser>);

    return {
      ...homeData,
      upcomingEvents,
      featuredCars,
      usersMap,
    };
  }, [homeData]);

  return {
    ...queryResult,
    data: processedData,
    rawData: homeData,
  };
}
