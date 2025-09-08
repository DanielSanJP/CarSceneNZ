'use client';

import { useEffect, useRef } from 'react';
import { useInboxSafe } from './use-inbox-safe';

/**
 * Hook for inbox pages that automatically manages read state
 * Handles auto-marking new messages as read when user is actively viewing inbox
 */
export function useInboxPageActive() {
  const { setInboxPageActive, markAsRead, unreadCount } = useInboxSafe();
  const previousUnreadCount = useRef(unreadCount);

  useEffect(() => {
    // Register as active inbox page
    setInboxPageActive(true);
    
    // Cleanup: unregister when component unmounts
    return () => {
      setInboxPageActive(false);
    };
  }, [setInboxPageActive]);

  // Auto-mark as read when unread count increases while on inbox page
  useEffect(() => {
    // Only trigger if count increased (new messages arrived)
    if (unreadCount > previousUnreadCount.current && unreadCount > 0) {
      console.log('New messages detected while on inbox page, auto-marking as read');
      // Small delay to ensure the message is fully processed
      const timer = setTimeout(() => {
        markAsRead();
      }, 500);
      
      return () => clearTimeout(timer);
    }
    
    previousUnreadCount.current = unreadCount;
  }, [unreadCount, markAsRead]);

  return {
    markAsRead,
  };
}
