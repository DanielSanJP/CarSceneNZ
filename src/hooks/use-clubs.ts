import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/utils/supabase/client';
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

// Get clubs gallery data (server-side function)
export async function getClubsGalleryData(filters: ClubsGalleryFilters = {}): Promise<ClubsGalleryData> {
  const supabase = createClient();

  const {
    search = null,
    location = null,
    club_type = null,
    sortBy = 'likes',
    page = 1,
    limit = 12
  } = filters;

  const offset = (page - 1) * limit;

  try {
    const { data, error } = await supabase.rpc('get_clubs_gallery', {
      search_term: search,
      location_filter: location,
      club_type_filter: club_type,
      sort_by: sortBy,
      result_limit: limit,
      result_offset: offset
    });

    if (error) {
      console.error('Error fetching clubs gallery data:', error);
      throw new Error('Failed to fetch clubs data');
    }

    return {
      clubs: data?.clubs || [],
      totalCount: data?.totalCount || 0,
      meta: {
        generated_at: new Date().toISOString(),
        cache_key: data?.meta?.cache_key || `clubs_gallery_${page}_${limit}`
      }
    };
  } catch (error) {
    console.error('Error fetching clubs gallery data:', error);
    throw new Error('Failed to fetch clubs data');
  }
}

// Get user's clubs data (server-side function)
export async function getUserClubsData(userId: string): Promise<UserClubsData> {
  const supabase = createClient();

  try {
    const { data, error } = await supabase.rpc('get_user_clubs', {
      user_id_param: userId,
    });

    if (error) {
      console.error('Error fetching user clubs data:', error);
      throw new Error('Failed to fetch user clubs data');
    }

    return {
      clubs: data?.clubs || [],
      total: data?.total || 0,
      meta: {
        generated_at: new Date().toISOString(),
        cache_key: data?.meta?.cache_key || `user_clubs_${userId}`
      }
    };
  } catch (error) {
    console.error('Error fetching user clubs data:', error);
    throw new Error('Failed to fetch user clubs data');
  }
}

// Get club detail data (server-side function)
export async function getClubDetailData(clubId: string): Promise<ClubDetailData> {
  const supabase = createClient();

  try {
    const { data: clubDetailResult, error } = await supabase.rpc('get_club_detail', {
      club_id_param: clubId,
    });

    if (error) {
      console.error('Error fetching club detail data:', error);
      throw new Error('Failed to fetch club details');
    }

    if (!clubDetailResult) {
      throw new Error('Club not found');
    }

    return {
      club: clubDetailResult.club,
      members: clubDetailResult.members || [],
      memberCount: clubDetailResult.memberCount || 0,
      meta: {
        generated_at: new Date().toISOString(),
        cache_key: `club_detail_${clubId}`
      }
    };
  } catch (error) {
    console.error('Error fetching club detail data:', error);
    throw new Error('Failed to fetch club details');
  }
}

// React Query hook for clubs gallery
export function useClubsGallery(filters: ClubsGalleryFilters = {}, initialData?: ClubsGalleryData | null) {
  return useQuery({
    queryKey: clubsKeys.gallery(filters),
    queryFn: () => getClubsGalleryData(filters),
    initialData: initialData || undefined,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

// React Query hook for user's clubs
export function useUserClubs(userId?: string, initialData?: UserClubsData | null) {
  return useQuery({
    queryKey: clubsKeys.userClubs(),
    queryFn: () => getUserClubsData(userId!),
    initialData: initialData || undefined,
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 3 * 60 * 1000, // 3 minutes
    refetchOnWindowFocus: false,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    enabled: !!userId,
  });
}

// React Query hook for club detail
export function useClubDetail(clubId: string, initialData?: ClubDetailData | null) {
  return useQuery({
    queryKey: clubsKeys.detail(clubId),
    queryFn: () => getClubDetailData(clubId),
    initialData: initialData || undefined,
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    enabled: !!clubId, // Only run if clubId is provided
  });
}
