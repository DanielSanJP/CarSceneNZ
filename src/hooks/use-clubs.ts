import { useQuery } from '@tanstack/react-query';
import type { Club } from '@/types/club';

// Clubs Gallery Data Interface
export interface ClubsGalleryData {
  clubs: Array<Club & { memberCount: number }>;
  totalCount: number;
  meta: {
    generated_at: string;
    cache_key: string;
  };
}

// User Clubs Data Interface
export interface UserClubsData {
  clubs: Array<{
    club: Club;
    role: string;
    joined_at: string;
    memberCount: number;
  }>;
  total: number;
  meta: {
    generated_at: string;
    cache_key: string;
  };
}

// Club Detail Data Interface
export interface ClubDetailData {
  club: Club;
  members: Array<{
    user: {
      id: string;
      username: string;
      display_name: string;
      profile_image_url?: string;
    };
    role: string;
    joined_at: string;
    total_cars: number;
    total_likes: number;
    most_liked_car_brand?: string;
    most_liked_car_model?: string;
    most_liked_car_likes: number;
  }>;
  memberCount: number;
  meta: {
    generated_at: string;
    cache_key: string;
  };
}

// Query keys for better cache management
export const clubsKeys = {
  all: ['clubs'] as const,
  galleries: () => [...clubsKeys.all, 'gallery'] as const,
  gallery: (filters: ClubsGalleryFilters) => [...clubsKeys.galleries(), filters] as const,
  details: () => [...clubsKeys.all, 'detail'] as const,
  detail: (clubId: string) => [...clubsKeys.details(), clubId] as const,
  userClubs: () => [...clubsKeys.all, 'user'] as const,
} as const;

// Filters interface for clubs gallery
export interface ClubsGalleryFilters {
  search?: string;
  location?: string;
  club_type?: string;
  sortBy?: string;
  page?: number;
  limit?: number;
}

// Get clubs gallery data
async function getClubsGalleryData(filters: ClubsGalleryFilters = {}): Promise<ClubsGalleryData> {
  const params = new URLSearchParams();
  
  if (filters.search) params.set('search', filters.search);
  if (filters.location) params.set('location', filters.location);
  if (filters.club_type) params.set('club_type', filters.club_type);
  if (filters.sortBy) params.set('sortBy', filters.sortBy);
  if (filters.page) params.set('page', filters.page.toString());
  if (filters.limit) params.set('limit', filters.limit.toString());

  const response = await fetch(`/api/clubs?${params.toString()}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch clubs gallery: ${response.status}`);
  }

  return response.json();
}

// Get user's clubs data
async function getUserClubsData(): Promise<UserClubsData> {
  const response = await fetch('/api/clubs/my-clubs', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch user clubs: ${response.status}`);
  }

  return response.json();
}

// Get club detail data
async function getClubDetailData(clubId: string): Promise<ClubDetailData> {
  const response = await fetch(`/api/clubs/${clubId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch club detail: ${response.status}`);
  }

  return response.json();
}

// React Query hook for clubs gallery
export function useClubsGallery(filters: ClubsGalleryFilters = {}) {
  return useQuery({
    queryKey: clubsKeys.gallery(filters),
    queryFn: () => getClubsGalleryData(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

// React Query hook for user's clubs
export function useUserClubs() {
  return useQuery({
    queryKey: clubsKeys.userClubs(),
    queryFn: getUserClubsData,
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 3 * 60 * 1000, // 3 minutes
    refetchOnWindowFocus: false,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

// React Query hook for club detail
export function useClubDetail(clubId: string) {
  return useQuery({
    queryKey: clubsKeys.detail(clubId),
    queryFn: () => getClubDetailData(clubId),
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    enabled: !!clubId, // Only run if clubId is provided
  });
}
