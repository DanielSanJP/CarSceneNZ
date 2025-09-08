'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/utils/supabase/client';
import { InboxMessage } from '@/types/inbox';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface UseInboxRealtimeProps {
  userId: string;
  initialMessages: InboxMessage[];
  refreshMessages: () => Promise<void>;
  onNewMessage?: (message: InboxMessage) => void; // Callback for new message coordination
  refreshUnreadCount?: () => Promise<void>; // Trigger badge count refresh
}

export function useInboxRealtime({ userId, initialMessages, refreshMessages, onNewMessage, refreshUnreadCount }: UseInboxRealtimeProps) {
  const [messages, setMessages] = useState<InboxMessage[]>(initialMessages);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update local state when server provides new data
  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  // Realtime subscription using Broadcast for reliable messaging
  useEffect(() => {
    if (!userId) return;

    const supabase = createClient();
    let channel: RealtimeChannel;

    async function setupRealtime() {
      try {
        setError(null);

        // Create realtime channel using Broadcast for messaging
        channel = supabase
          .channel(`inbox-messages-${userId}`)
          .on(
            'broadcast',
            { event: 'new_message' },
            async (payload) => {
              console.log('New message broadcast received:', payload);
              
              // Only process if message is for this user
              if (payload.payload?.receiver_id === userId) {
                const messageData = payload.payload;
                
                try {
                  // Fetch complete message data with sender info
                  const { data: fullMessage, error } = await supabase
                    .from('messages')
                    .select(`
                      *,
                      sender:sender_id (
                        id,
                        username,
                        display_name,
                        profile_image_url
                      )
                    `)
                    .eq('id', messageData.id)
                    .single();

                  if (error) {
                    console.error('Error fetching broadcast message details:', error);
                    // Fallback to refresh
                    await refreshMessages();
                  } else if (fullMessage) {
                    // Add new message to top of list
                    setMessages(prev => {
                      // Prevent duplicates
                      const exists = prev.some(msg => msg.id === fullMessage.id);
                      if (exists) return prev;
                      
                      return [fullMessage as InboxMessage, ...prev];
                    });
                    
                    console.log('New message added via broadcast:', fullMessage);
                    
                    // Notify parent components
                    onNewMessage?.(fullMessage as InboxMessage);
                    refreshUnreadCount?.();
                  }
                } catch (error) {
                  console.error('Error processing broadcast message:', error);
                  await refreshMessages();
                }
              }
            }
          )
          .on(
            'broadcast',
            { event: 'message_deleted' },
            (payload) => {
              console.log('Message deletion broadcast received:', payload);
              
              if (payload.payload?.message_id) {
                setMessages(prev => prev.filter(msg => msg.id !== payload.payload.message_id));
                console.log('Message removed via broadcast:', payload.payload.message_id);
              }
            }
          )
          .on(
            'broadcast',
            { event: 'message_updated' },
            async (payload) => {
              console.log('Message update broadcast received:', payload);
              
              if (payload.payload?.message_id) {
                // Refresh the specific message or do a full refresh
                await refreshMessages();
              }
            }
          )
          .subscribe((status) => {
            console.log('Broadcast realtime status:', status);
            
            switch (status) {
              case 'SUBSCRIBED':
                setIsConnected(true);
                setError(null);
                console.log('✅ Successfully subscribed to real-time messaging');
                break;
              case 'CHANNEL_ERROR':
                setIsConnected(false);
                setError('Failed to connect to real-time updates');
                console.error('❌ Channel error in real-time messaging');
                break;
              case 'TIMED_OUT':
                setIsConnected(false);
                setError('Connection timed out');
                console.error('⏱️ Real-time connection timed out');
                break;
              case 'CLOSED':
                setIsConnected(false);
                console.log('🔌 Real-time connection closed');
                break;
              default:
                console.log('Unhandled realtime status:', status);
            }
          });

      } catch (err) {
        console.error('Error setting up broadcast realtime:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setIsConnected(false);
      }
    }

    setupRealtime();

    // Cleanup
    return () => {
      if (channel) {
        console.log('Cleaning up broadcast realtime subscription');
        supabase.removeChannel(channel);
      }
    };
  }, [userId, refreshMessages, onNewMessage, refreshUnreadCount]);

  return {
    messages,
    isConnected,
    error,
  };
}
