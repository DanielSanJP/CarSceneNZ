"use server";

import { createClient } from "@/lib/utils/supabase/server";
import { getAuthUser } from "@/lib/auth";
import { revalidateTag, revalidatePath } from "next/cache";
import type { MessageWithRecipient } from "@/types/message";

/**
 * Get inbox messages for the current user using new messaging system
 */
export async function getInboxMessages() {
  try {
    const currentUser = await getAuthUser();
    
    if (!currentUser) {
      return { success: false, error: 'Authentication required' };
    }

    const userId = currentUser.id;

    const supabase = await createClient();
    
    // Use the new inbox_messages view for clean querying
    const { data: messages, error } = await supabase
      .from('inbox_messages')
      .select('*')
      .eq('recipient_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching inbox messages:', error);
      return { success: false, error: 'Failed to fetch inbox messages' };
    }

    // Transform the data to match InboxMessage interface
    const transformedMessages: MessageWithRecipient[] = messages?.map((msg) => ({
      id: msg.id,
      sender_id: msg.sender_id,
      recipient_id: msg.recipient_id,
      subject: msg.subject,
      message: msg.message,
      message_type: msg.message_type,
      club_id: msg.club_id,
      is_read: msg.is_read,
      read_at: msg.read_at,
      created_at: msg.created_at,
      updated_at: msg.updated_at,
      // Flat sender fields
      sender_username: msg.sender_username,
      sender_display_name: msg.sender_display_name,
      sender_profile_image_url: msg.sender_profile_image_url,
      // Club info
      club_name: msg.club_name,
      // Nested sender for backward compatibility
      sender: {
        id: msg.sender_id,
        username: msg.sender_username,
        display_name: msg.sender_display_name,
        profile_image_url: msg.sender_profile_image_url,
      },
    })) || [];

    return {
      success: true,
      data: transformedMessages,
    };

  } catch (error) {
    console.error("Error fetching inbox messages:", error);
    return { success: false, error: "Failed to fetch inbox messages" };
  }
}

/**
 * Get unread message count for the current user using new system
 */
export async function getUnreadCount() {
  try {
    const currentUser = await getAuthUser();
    
    if (!currentUser) {
      return { success: false, error: 'Authentication required' };
    }
    
    const userId = currentUser.id;

    const supabase = await createClient();

    // Use the new get_unread_count function
    const { data, error } = await supabase
      .rpc('get_unread_count', { p_recipient_id: userId });

    if (error) {
      console.error('Error fetching unread count:', error);
      return { success: false, error: 'Failed to fetch unread count' };
    }

    return {
      success: true,
      count: data || 0,
    };

  } catch (error) {
    console.error("Error fetching unread count:", error);
    return { success: false, error: "Failed to fetch unread count" };
  }
}

/**
 * Mark all messages as read for the current user using new system
 */
export async function markAllMessagesAsRead() {
  try {
    const currentUser = await getAuthUser();
    
    if (!currentUser) {
      return { success: false, error: 'Authentication required' };
    }
    
    const userId = currentUser.id;

    const supabase = await createClient();

    // Use the new mark_all_messages_read function
    const { data: markedCount, error } = await supabase
      .rpc('mark_all_messages_read', { p_recipient_id: userId });

    if (error) {
      console.error('Error marking messages as read:', error);
      return { success: false, error: 'Failed to mark messages as read' };
    }

    // Only broadcast and invalidate cache if messages were actually marked as read
    if ((markedCount || 0) > 0) {
      // Revalidate caches
      revalidateTag('inbox');
      revalidatePath('/inbox');
      
      return {
        success: true,
        markedCount: markedCount || 0,
        message: `Marked ${markedCount} messages as read`,
        meta: {
          processed_at: new Date().toISOString(),
          user_id: userId,
        },
      };
    } else {
      return {
        success: true,
        markedCount: 0,
        message: 'No unread messages to mark as read',
        meta: {
          processed_at: new Date().toISOString(),
          user_id: userId,
        },
      };
    }

  } catch (error) {
    console.error("Error marking all messages as read:", error);
    return { success: false, error: "Failed to mark all messages as read" };
  }
}

/**
 * Mark a specific message as read for the current user
 */
export async function markMessageAsRead(messageId: string) {
  try {
    const currentUser = await getAuthUser();
    
    if (!currentUser) {
      return { success: false, error: 'Authentication required' };
    }
    
    const userId = currentUser.id;

    const supabase = await createClient();

    // Use the new mark_message_read function
    const { data: success, error } = await supabase
      .rpc('mark_message_read', { 
        p_message_id: messageId, 
        p_recipient_id: userId 
      });

    if (error) {
      console.error('Error marking message as read:', error);
      return { success: false, error: 'Failed to mark message as read' };
    }

    if (success) {
      // Revalidate caches
      revalidateTag('inbox');
      revalidatePath('/inbox');
      
      return {
        success: true,
        message: 'Message marked as read',
        meta: {
          processed_at: new Date().toISOString(),
          user_id: userId,
          message_id: messageId,
        },
      };
    } else {
      return { success: false, error: 'Message not found or already read' };
    }

  } catch (error) {
    console.error("Error marking message as read:", error);
    return { success: false, error: "Failed to mark message as read" };
  }
}

/**
 * Delete a message for the current user (removes from their inbox)
 */
export async function deleteMessageForUser(messageId: string) {
  try {
    const currentUser = await getAuthUser();
    
    if (!currentUser) {
      return { success: false, error: 'Authentication required' };
    }
    
    const userId = currentUser.id;

    const supabase = await createClient();

    // Use the new delete_message_for_recipient function
    const { data: success, error } = await supabase
      .rpc('delete_message_for_recipient', { 
        p_message_id: messageId, 
        p_recipient_id: userId 
      });

    if (error) {
      console.error('Error deleting message:', error);
      return { success: false, error: 'Failed to delete message' };
    }

    if (success) {
      // Revalidate caches
      revalidateTag('inbox');
      revalidatePath('/inbox');
      
      return {
        success: true,
        message: 'Message deleted',
        meta: {
          processed_at: new Date().toISOString(),
          user_id: userId,
          message_id: messageId,
        },
      };
    } else {
      return { success: false, error: 'Message not found' };
    }

  } catch (error) {
    console.error("Error deleting message:", error);
    return { success: false, error: "Failed to delete message" };
  }
}