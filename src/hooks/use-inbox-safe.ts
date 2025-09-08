'use client';

import { useInbox } from '@/contexts/inbox-context';

/**
 * Hook to safely use inbox context with fallback values
 * Provides default values when context is not available
 */
export function useInboxSafe() {
  try {
    return useInbox();
  } catch {
    // Return safe default values if context is not available
    console.warn('useInbox called outside of InboxProvider, using defaults');
    return {
      unreadCount: 0,
      isConnected: false,
      error: null,
      refreshUnreadCount: async () => {},
      markAsRead: async () => {},
      setInboxPageActive: () => {},
    };
  }
}
