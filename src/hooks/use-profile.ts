import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/utils/supabase/client';
import type { User } from '@/types/user';
import type { Car } from '@/types/car';
import type { Club } from '@/types/club';

// Define UserProfile interface
export interface UserProfile extends User {
  followersCount: number;
  followingCount: number;
  carsCount: number;
  clubsCount: number;
  eventsCount: number;
}

export interface ProfileData {
  profileUser: UserProfile;
  userCars: Car[];
  followers: User[];
  following: User[];
  userClubs: Array<{
    club: Club;
    role: string;
    joined_at: string;
    memberCount: number;
  }>;
  isFollowing: boolean;
  currentUser: User | null;
}

export interface LeaderClubsData {
  leaderClubs: Array<{
    id: string;
    name: string;
    description: string;
    image_url: string | null;
    memberCount: number;
  } | null>;
}

// Direct Supabase functions for profile data
export async function getProfileData(userId: string): Promise<ProfileData> {
  const supabase = createClient();

  try {
    // Use the optimized RPC function for main profile data
    // Note: current_user_id will be null for client-side calls, server-side will handle properly
    const { data: profileData, error: profileError } = await supabase.rpc(
      'get_user_profile_optimized',
      {
        target_user_id: userId,
        current_user_id: null // Client-side doesn't know current user, server-side will handle this
      }
    );

    if (profileError || !profileData?.[0]) {
      throw new Error(profileError?.message || 'Profile not found');
    }

    const profile = profileData[0];

    // Get additional data in parallel using optimized RPC functions
    const [
      { data: cars },
      { data: followers },
      { data: following },
      { data: clubs }
    ] = await Promise.all([
      supabase.rpc('get_user_cars_optimized', { user_id_param: userId }),
      supabase.rpc('get_user_followers_optimized', { user_id_param: userId }),
      supabase.rpc('get_user_following_optimized', { user_id_param: userId }),
      supabase.rpc('get_user_clubs_optimized', { user_id_param: userId })
    ]);

    // Define interface for club RPC result
    interface ClubRPCResult {
      club_id: string;
      club_name: string;
      club_description: string;
      club_banner_image_url?: string;
      club_type: string;
      club_location?: string;
      club_leader_id: string;
      club_total_likes: number;
      club_created_at: string;
      club_updated_at: string;
      leader_id: string;
      leader_username: string;
      leader_display_name: string;
      leader_profile_image_url?: string;
      role: string;
      joined_at: string;
      member_count: number;
    }

    // Transform the data to match our interface
    const result: ProfileData = {
      profileUser: {
        id: profile.id,
        username: profile.username,
        display_name: profile.display_name,
        email: profile.email,
        profile_image_url: profile.profile_image_url,
        created_at: profile.created_at,
        updated_at: profile.updated_at,
        followersCount: profile.followers_count || 0,
        followingCount: profile.following_count || 0,
        carsCount: profile.cars_count || 0,
        clubsCount: profile.clubs_count || 0,
        eventsCount: profile.events_count || 0,
      },
      userCars: cars || [],
      followers: followers || [],
      following: following || [],
      userClubs: clubs ? clubs.map((clubData: ClubRPCResult) => ({
        club: {
          id: clubData.club_id,
          name: clubData.club_name,
          description: clubData.club_description,
          banner_image_url: clubData.club_banner_image_url,
          club_type: clubData.club_type,
          location: clubData.club_location,
          leader_id: clubData.club_leader_id,
          total_likes: clubData.club_total_likes,
          created_at: clubData.club_created_at,
          updated_at: clubData.club_updated_at,
          leader: {
            id: clubData.leader_id,
            username: clubData.leader_username,
            display_name: clubData.leader_display_name,
            profile_image_url: clubData.leader_profile_image_url,
          },
        },
        role: clubData.role,
        joined_at: clubData.joined_at,
        memberCount: clubData.member_count || 0,
      })) : [],
      isFollowing: profile.is_following || false,
      currentUser: null, // Client-side doesn't have current user info, server-side will populate
    };

    return result;
  } catch (error) {
    console.error('Error fetching profile data:', error);
    throw new Error('Failed to fetch profile data');
  }
}

// Get leader clubs data
export async function getLeaderClubs(): Promise<LeaderClubsData> {
  const supabase = createClient();

  const { data: leaderClubsData, error } = await supabase
    .rpc('get_leader_clubs_optimized');

  if (error) {
    console.error('Error fetching leader clubs:', error);
    throw new Error('Failed to fetch leader clubs');
  }

  return { leaderClubs: leaderClubsData || [] };
}

// Follow/unfollow user
export async function toggleFollow(targetUserId: string, action: 'follow' | 'unfollow') {
  const response = await fetch('/api/profile/follow', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      targetUserId,
      action,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || `Failed to ${action} user`);
  }

  return response.json();
}

// Send club invitation
export async function sendClubInvitation(
  targetUserId: string,
  clubId: string,
  message?: string
) {
  const response = await fetch('/api/profile/clubs', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      targetUserId,
      clubId,
      message,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to send club invitation');
  }

  return response.json();
}

// Query keys for better cache management
export const profileKeys = {
  all: ['profile'] as const,
  profile: (userId: string) => [...profileKeys.all, 'detail', userId] as const,
  leaderClubs: (userId?: string) => [...profileKeys.all, 'leaderClubs', userId] as const,
};

// Hook to fetch profile data with optimized settings
export function useProfile(userId: string, initialData?: ProfileData) {
  return useQuery({
    queryKey: profileKeys.profile(userId),
    queryFn: () => getProfileData(userId),
    initialData,
    staleTime: 5 * 60 * 1000, // 5 minutes - aggressive caching for profile data
    gcTime: 15 * 60 * 1000, // 15 minutes - keep in memory longer
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnMount: false, // Don't refetch if we have cached data
    retry: 2, // Reasonable retry count
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    // Use cache-first strategy for better perceived performance
    networkMode: 'offlineFirst',
  });
}

// Hook to fetch leader clubs (only for authenticated users)
export function useLeaderClubs(enabled: boolean = true) {
  return useQuery({
    queryKey: profileKeys.leaderClubs(),
    queryFn: getLeaderClubs,
    enabled,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  });
}

// Hook for follow/unfollow mutations
export function useFollowToggle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ targetUserId, action }: { targetUserId: string; action: 'follow' | 'unfollow' }) =>
      toggleFollow(targetUserId, action),
    onMutate: async ({ targetUserId, action }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: profileKeys.profile(targetUserId) });

      // Snapshot the previous value
      const previousProfile = queryClient.getQueryData<ProfileData>(
        profileKeys.profile(targetUserId)
      );

      // Optimistically update the cache
      if (previousProfile) {
        const isFollowing = action === 'follow';
        const followersCountChange = isFollowing ? 1 : -1;

        queryClient.setQueryData<ProfileData>(
          profileKeys.profile(targetUserId),
          {
            ...previousProfile,
            isFollowing,
            profileUser: {
              ...previousProfile.profileUser,
              followersCount: previousProfile.profileUser.followersCount + followersCountChange,
            },
          }
        );
      }

      return { previousProfile };
    },
    onError: (err, { targetUserId }, context) => {
      // Revert the optimistic update on error
      if (context?.previousProfile) {
        queryClient.setQueryData(
          profileKeys.profile(targetUserId),
          context.previousProfile
        );
      }
    },
    onSettled: (data, error, { targetUserId }) => {
      // Refetch the profile data to ensure consistency
      queryClient.invalidateQueries({ queryKey: profileKeys.profile(targetUserId) });
    },
  });
}

// Hook for sending club invitations
export function useClubInvitation() {
  return useMutation({
    mutationFn: ({ 
      targetUserId, 
      clubId, 
      message 
    }: { 
      targetUserId: string; 
      clubId: string; 
      message?: string; 
    }) => sendClubInvitation(targetUserId, clubId, message),
    onSuccess: () => {
      // Invalidate any relevant queries if needed
      // For now, we'll just show success feedback
    },
  });
}

// Hook to prefetch profile data (useful for navigation)
export function usePrefetchProfile() {
  const queryClient = useQueryClient();

  return (userId: string) => {
    queryClient.prefetchQuery({
      queryKey: profileKeys.profile(userId),
      queryFn: () => getProfileData(userId),
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // Keep prefetched data for 10 minutes
    });
  };
}

// Hook for preloading profiles on hover (performance optimization)
export function useProfilePreloader() {
  const prefetch = usePrefetchProfile();
  
  return {
    preloadProfile: (userId: string) => {
      // Add small delay to avoid excessive prefetching on quick hovers
      const timeoutId = setTimeout(() => {
        prefetch(userId);
      }, 300);
      
      return () => clearTimeout(timeoutId);
    }
  };
}
