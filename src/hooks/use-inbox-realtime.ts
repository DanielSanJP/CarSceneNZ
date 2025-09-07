'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/utils/supabase/client';
import { InboxMessage } from '@/types/inbox';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface UseInboxRealtimeProps {
  userId: string;
  initialMessages: InboxMessage[];
  refreshMessages: () => Promise<void>;
}

export function useInboxRealtime({ userId, initialMessages, refreshMessages }: UseInboxRealtimeProps) {
  const [messages, setMessages] = useState<InboxMessage[]>(initialMessages);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Update local state when server provides new data
  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  // Realtime subscription for notifications only
  useEffect(() => {
    if (!userId) return;

    const supabase = createClient();
    let channel: RealtimeChannel;

    async function setupRealtime() {
      try {
        setError(null);

        // Create realtime channel - this only listens for changes
        channel = supabase
          .channel('inbox-changes')
          .on(
            'postgres_changes',
            {
              event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
              schema: 'public',
              table: 'messages',
              filter: `receiver_id=eq.${userId}`, // Only changes for this user
            },
            async (payload) => {
              console.log('Message change detected:', payload.eventType, payload);
              
              // When any change happens, refresh data via server
              setIsRefreshing(true);
              try {
                await refreshMessages();
              } catch (err) {
                console.error('Error refreshing messages:', err);
                setError('Failed to refresh messages');
              } finally {
                setIsRefreshing(false);
              }
            }
          )
          .subscribe((status) => {
            console.log('Realtime status:', status);
            
            switch (status) {
              case 'SUBSCRIBED':
                setIsConnected(true);
                setError(null);
                break;
              case 'CHANNEL_ERROR':
                setIsConnected(false);
                setError('Failed to connect to real-time updates');
                break;
              case 'TIMED_OUT':
                setIsConnected(false);
                setError('Connection timed out');
                break;
              case 'CLOSED':
                setIsConnected(false);
                // Don't show error for intentional disconnections
                break;
              default:
                console.log('Unhandled realtime status:', status);
            }
          });

      } catch (err) {
        console.error('Error setting up realtime:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setIsConnected(false);
      }
    }

    setupRealtime();

    // Cleanup
    return () => {
      if (channel) {
        console.log('Cleaning up realtime subscription');
        supabase.removeChannel(channel);
      }
    };
  }, [userId, refreshMessages]);

  return {
    messages,
    isConnected,
    error,
    isRefreshing,
  };
}
