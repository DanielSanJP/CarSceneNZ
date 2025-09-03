// import 'server-only';
import { cache } from 'react';
import { createClient } from '@/lib/utils/supabase/server';
import type { Message } from '@/types/message';

/**
 * Get all messages with caching - server-only version
 */
export const getAllMessages = cache(async (): Promise<Message[]> => {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:users!messages_sender_id_fkey (
          id,
          username,
          display_name,
          profile_image_url
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error getting all messages:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error getting all messages:', error);
    return [];
  }
});
