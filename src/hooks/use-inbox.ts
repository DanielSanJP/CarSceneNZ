import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/utils/supabase/client';
import { useEffect, useState } from 'react';
import type { InboxMessage } from '@/types/inbox';
import type { RealtimeChannel } from '@supabase/supabase-js';

// Inbox Messages Data Interface
export interface InboxMessagesData {
  messages: InboxMessage[];
  meta: {
    generated_at: string;
    cache_key: string;
  };
}

// Unread Count Data Interface  
export interface UnreadCountData {
  count: number;
  meta: {
    generated_at: string;
    cache_key: string;
  };
}

/**
 * Hook to fetch user's inbox messages with React Query
 */
export function useInboxMessages() {
  return useQuery({
    queryKey: ['inbox', 'messages'],
    queryFn: async (): Promise<InboxMessagesData> => {
      const supabase = createClient();
      
      // Call RPC function directly for optimized performance
      const { data, error } = await supabase.rpc('get_user_inbox_messages');
      
      if (error) {
        console.error('Error fetching inbox messages:', error);
        throw new Error(`Failed to fetch inbox messages: ${error.message}`);
      }

      return {
        messages: data || [],
        meta: {
          generated_at: new Date().toISOString(),
          cache_key: `inbox_messages_${Date.now()}`,
        },
      };
    },
    staleTime: 30 * 1000, // 30 seconds (frequent updates for messaging)
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch unread message count with React Query
 */
export function useUnreadCount() {
  return useQuery({
    queryKey: ['inbox', 'unread-count'],
    queryFn: async (): Promise<UnreadCountData> => {
      const supabase = createClient();
      
      // Call RPC function directly for optimized performance
      const { data, error } = await supabase.rpc('get_unread_message_count');
      
      if (error) {
        console.error('Error fetching unread count:', error);
        throw new Error(`Failed to fetch unread count: ${error.message}`);
      }

      return {
        count: data || 0,
        meta: {
          generated_at: new Date().toISOString(),
          cache_key: `unread_count_${Date.now()}`,
        },
      };
    },
    staleTime: 10 * 1000, // 10 seconds (very frequent for real-time feel)
    gcTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 30 * 1000, // Auto-refresh every 30 seconds
  });
}

/**
 * Hook to mark inbox as read with optimistic updates
 */
export function useMarkInboxAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/inbox/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to mark inbox as read');
      }

      return response.json();
    },
    onMutate: async () => {
      // Optimistically set unread count to 0
      await queryClient.cancelQueries({ queryKey: ['inbox', 'unread-count'] });
      
      const previousCount = queryClient.getQueryData(['inbox', 'unread-count']);
      
      queryClient.setQueryData(['inbox', 'unread-count'], (old: UnreadCountData | undefined) => {
        if (!old) return old;
        return {
          ...old,
          count: 0,
          meta: {
            ...old.meta,
            generated_at: new Date().toISOString(),
          },
        };
      });

      return { previousCount };
    },
    onError: (err, variables, context) => {
      // Revert optimistic update on error
      if (context?.previousCount) {
        queryClient.setQueryData(['inbox', 'unread-count'], context.previousCount);
      }
      console.error('Error marking inbox as read:', err);
    },
    onSuccess: () => {
      // Invalidate to get fresh data
      queryClient.invalidateQueries({ queryKey: ['inbox', 'unread-count'] });
    },
  });
}

/**
 * Enhanced real-time hook that works with React Query
 */
export function useInboxRealtime() {
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    let messageChannel: RealtimeChannel | null = null;
    let badgeChannel: RealtimeChannel | null = null;

    const setupRealtime = async () => {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Set up message updates channel
        messageChannel = supabase.channel(`inbox-messages-${user.id}`);
        messageChannel
          .on('broadcast', { event: 'new_message' }, () => {
            // Invalidate messages query to fetch fresh data
            queryClient.invalidateQueries({ queryKey: ['inbox', 'messages'] });
            queryClient.invalidateQueries({ queryKey: ['inbox', 'unread-count'] });
          })
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              setIsConnected(true);
              setError(null);
            } else if (status === 'CHANNEL_ERROR') {
              setError('Message channel connection failed');
              setIsConnected(false);
            }
          });

        // Set up badge updates channel
        badgeChannel = supabase.channel(`inbox-badges-${user.id}`);
        badgeChannel
          .on('broadcast', { event: 'new_message_badge' }, () => {
            // Invalidate unread count query for badge updates
            queryClient.invalidateQueries({ queryKey: ['inbox', 'unread-count'] });
          })
          .subscribe((status) => {
            if (status !== 'SUBSCRIBED' && status === 'CHANNEL_ERROR') {
              setError('Badge channel connection failed');
            }
          });

      } catch (error) {
        console.error('Error setting up realtime:', error);
        setError('Failed to setup real-time connection');
        setIsConnected(false);
      }
    };

    setupRealtime();

    // Cleanup function
    return () => {
      if (messageChannel) {
        messageChannel.unsubscribe();
      }
      if (badgeChannel) {
        badgeChannel.unsubscribe();
      }
      setIsConnected(false);
      setError(null);
    };
  }, [queryClient]);

  return { isConnected, error };
}

/**
 * Hook for handling join request actions with optimistic updates
 */
export function useHandleJoinRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      messageId, 
      action, 
      clubId, 
      senderId 
    }: { 
      messageId: string; 
      action: 'approve' | 'reject'; 
      clubId: string; 
      senderId: string; 
    }) => {
      // Call server action via API route for consistency
      const response = await fetch('/api/inbox/handle-join-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId, action, clubId, senderId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to handle join request');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate messages to reflect changes
      queryClient.invalidateQueries({ queryKey: ['inbox', 'messages'] });
      queryClient.invalidateQueries({ queryKey: ['clubs'] }); // Update club member counts
    },
    onError: (error) => {
      console.error('Error handling join request:', error);
    },
  });
}

/**
 * Hook for handling club invitation actions with optimistic updates
 */
export function useHandleClubInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      messageId, 
      action, 
      clubId, 
      inviterId 
    }: { 
      messageId: string; 
      action: 'accept' | 'reject'; 
      clubId: string; 
      inviterId: string; 
    }) => {
      // Call server action via API route for consistency
      const response = await fetch('/api/inbox/handle-invitation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId, action, clubId, inviterId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to handle invitation');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate messages and user clubs to reflect changes
      queryClient.invalidateQueries({ queryKey: ['inbox', 'messages'] });
      queryClient.invalidateQueries({ queryKey: ['clubs', 'user-clubs'] }); // Update user's clubs
      queryClient.invalidateQueries({ queryKey: ['clubs'] }); // Update club member counts
    },
    onError: (error) => {
      console.error('Error handling club invitation:', error);
    },
  });
}
