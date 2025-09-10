import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getProfileData, 
  getLeaderClubs, 
  toggleFollow, 
  sendClubInvitation,
  type ProfileData
} from '@/lib/profile-api';

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
