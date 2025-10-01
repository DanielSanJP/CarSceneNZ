"use server";

import { createClient } from "@/lib/utils/supabase/server";
import { getAuthUser } from "@/lib/auth";
import { revalidateTag, revalidatePath } from "next/cache";

/**
 * Get inbox messages for the current user
 */
export async function getInboxMessages() {
  try {
    const currentUser = await getAuthUser();
    
    if (!currentUser) {
      return { success: false, error: "Authentication required" };
    }

    const userId = currentUser.id;
    console.log(`📬 Fetching inbox messages for user: ${userId}`);

    const supabase = await createClient();
    
    // Debug: Check if we have an authenticated user in this context
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    console.log(`🔍 SERVER ACTION AUTH - User: ${authUser?.id}, Error:`, authError);
    console.log(`🔍 SERVER ACTION - Requested userId: ${userId}`);
    console.log(`🔍 SERVER ACTION - Auth user matches requested: ${authUser?.id === userId}`);
    
    // Use direct query to get messages with related data
    const { data: messages, error } = await supabase
      .from('messages')
      .select(`
        id,
        sender_id,
        receiver_id,
        subject,
        message,
        message_type,
        club_id,
        created_at,
        updated_at,
        is_read,
        sender:users!messages_sender_id_fkey (
          id,
          username,
          display_name,
          profile_image_url
        ),
        club:clubs (
          id,
          name
        )
      `)
      .eq('receiver_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Query error:', error);
      return { success: false, error: `Query failed: ${error.message}` };
    }

    console.log(`✅ Retrieved ${messages?.length || 0} messages`);

    // Transform the data to handle Supabase's returns and add flat fields for compatibility
    const transformedMessages = messages?.map((msg) => {
      // Safely extract sender data (handle both array and object cases)
      const sender = Array.isArray(msg.sender) ? msg.sender[0] : msg.sender;
      const club = Array.isArray(msg.club) ? msg.club[0] : msg.club;
      
      return {
        ...msg,
        // Normalize nested objects
        sender: sender || null,
        club: club || null,
        // Add flat fields for backward compatibility
        sender_username: sender?.username || null,
        sender_display_name: sender?.display_name || null,
        sender_profile_image_url: sender?.profile_image_url || null,
        club_name: club?.name || null,
      };
    }) || [];

    return {
      success: true,
      messages: transformedMessages,
      meta: {
        generated_at: new Date().toISOString(),
        cache_key: `inbox_messages_${userId}`,
      },
    };

  } catch (error) {
    console.error("❌ Error fetching inbox messages:", error);
    return { success: false, error: "Failed to fetch inbox messages" };
  }
}

/**
 * Get unread message count for the current user
 */
export async function getUnreadCount() {
  try {
    const currentUser = await getAuthUser();
    
    if (!currentUser) {
      return { success: false, error: "Authentication required" };
    }
    
    const userId = currentUser.id;
    console.log(`🔢 Fetching unread count for user: ${userId}`);

    const supabase = await createClient();

    // Count unread messages using the is_read column
    const { count, error: countError } = await supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('receiver_id', userId)
      .eq('is_read', false);

    if (countError) {
      console.error('❌ Error counting unread messages:', countError);
      return { success: false, error: 'Failed to count unread messages' };
    }

    const unreadCount = count || 0;
    console.log(`✅ Unread count for user ${userId}: ${unreadCount}`);

    return {
      success: true,
      count: unreadCount,
      meta: {
        generated_at: new Date().toISOString(),
        cache_key: `unread_count_${userId}`,
        method: 'is_read_column',
      },
    };

  } catch (error) {
    console.error("❌ Error fetching unread count:", error);
    return { success: false, error: "Failed to fetch unread count" };
  }
}

/**
 * Mark all messages as read for the current user
 */
export async function markAllMessagesAsRead() {
  try {
    const currentUser = await getAuthUser();
    
    if (!currentUser) {
      return { success: false, error: "Authentication required" };
    }
    
    const userId = currentUser.id;
    console.log(`📨 Marking all unread messages as read for user: ${userId}`);

    const supabase = await createClient();

    // Mark all unread messages as read using the is_read column
    const { data, error } = await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('receiver_id', userId)
      .eq('is_read', false)
      .select('id');

    if (error) {
      console.error('❌ Error marking messages as read:', error);
      return { success: false, error: 'Failed to mark messages as read' };
    }

    const markedCount = data?.length || 0;
    console.log(`✅ Marked ${markedCount} messages as read for user ${userId}`);

    // Only broadcast and invalidate cache if messages were actually marked as read
    if (markedCount > 0) {
      try {
        // Get the actual unread count after marking messages as read
        const { count: currentUnreadCount } = await supabase
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .eq('receiver_id', userId)
          .eq('is_read', false);

        const realUnreadCount = currentUnreadCount || 0;

        // Broadcast the unread count change event with REAL count
        const channel = supabase.channel(`user:${userId}:unread`);
        
        await channel.send({
          type: 'broadcast',
          event: 'unread_count_changed',
          payload: {
            userId: userId,
            action: 'mark_read',
            messageType: 'bulk_mark_read',
            count: markedCount,
            unreadCount: realUnreadCount, // 👈 REAL DATABASE COUNT
            timestamp: new Date().toISOString(),
          },
        });

        console.log(`📡 Broadcasted unread count change for user ${userId}, real count: ${realUnreadCount}`);
      } catch (broadcastError) {
        console.error('❌ Error broadcasting unread count change:', broadcastError);
        // Don't fail the main operation if broadcast fails
      }

      // Only invalidate relevant caches when messages were actually updated
      revalidateTag('inbox');
      revalidatePath('/inbox');
      console.log(`🔄 Cache invalidated for user ${userId} after marking ${markedCount} messages as read`);
    } else {
      console.log(`ℹ️ No messages to mark as read for user ${userId} - skipping cache invalidation`);
    }

    return {
      success: true,
      markedCount,
      meta: {
        updated_at: new Date().toISOString(),
        cache_invalidated: true,
      },
    };

  } catch (error) {
    console.error("❌ Error marking messages as read:", error);
    return { success: false, error: "Failed to mark messages as read" };
  }
}