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
  const hasMarkedInitialAsRead = useRef(false);

  useEffect(() => {
    // Register as active inbox page
    setInboxPageActive(true);
    
    // Mark existing unread messages as read when first visiting the page
    if (unreadCount > 0 && !hasMarkedInitialAsRead.current) {
      console.log('Marking existing unread messages as read on inbox page load');
      markAsRead();
      hasMarkedInitialAsRead.current = true;
    }
    
    // Cleanup: unregister when component unmounts
    return () => {
      setInboxPageActive(false);
    };
  }, [setInboxPageActive, markAsRead, unreadCount]);

  // Auto-mark as read when unread count increases while on inbox page
  useEffect(() => {
    // Only trigger if count increased (new messages arrived) and we've already handled initial read
    if (unreadCount > previousUnreadCount.current && unreadCount > 0 && hasMarkedInitialAsRead.current) {
      console.log('New messages detected while on inbox page, auto-marking as read');
      // Immediate marking - no delay needed since message is already in list
      markAsRead();
    }
    
    previousUnreadCount.current = unreadCount;
  }, [unreadCount, markAsRead]);

  return {
    markAsRead,
  };
}
