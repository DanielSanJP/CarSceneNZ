'use client';

import { queryClient } from '@/lib/react-query';
import { queryKeys } from '@/lib/react-query';

/**
 * Utility functions for invalidating inbox-related cache
 * Use these when you know messages have been sent/received to force immediate updates
 */

export const inboxCacheUtils = {
  /**
   * Invalidate unread count for a specific user
   * Call this when you send a message or know someone received a message
   */
  invalidateUnreadCount: (userId: string) => {
    console.log(`🔄 Invalidating unread count cache for user: ${userId}`);
    queryClient.invalidateQueries({
      queryKey: queryKeys.inbox.unreadCount(userId),
    });
  },

  /**
   * Invalidate inbox messages for a specific user
   * Call this when you know new messages have been received
   */
  invalidateInboxMessages: (userId: string) => {
    console.log(`🔄 Invalidating inbox messages cache for user: ${userId}`);
    queryClient.invalidateQueries({
      queryKey: queryKeys.inbox.messages(userId),
    });
  },

  /**
   * Invalidate all inbox data for a specific user
   * Call this for major inbox events (join club, leave club, etc.)
   */
  invalidateAllInboxData: (userId: string) => {
    console.log(`🔄 Invalidating all inbox cache for user: ${userId}`);
    queryClient.invalidateQueries({
      queryKey: queryKeys.inbox.all,
    });
  },

  /**
   * Force refetch unread count immediately (bypasses cache)
   * Use when you need instant updates
   */
  forceRefetchUnreadCount: async (userId: string) => {
    console.log(`⚡ Force refetching unread count for user: ${userId}`);
    await queryClient.refetchQueries({
      queryKey: queryKeys.inbox.unreadCount(userId),
    });
  },

  /**
   * Optimistically update unread count
   * Use for immediate UI feedback before API calls complete
   */
  setUnreadCountOptimistic: (userId: string, count: number) => {
    console.log(`⚡ Setting optimistic unread count: ${count} for user: ${userId}`);
    queryClient.setQueryData(
      queryKeys.inbox.unreadCount(userId),
      count
    );
  },
};