'use server';

import { getAuthUser } from '@/lib/auth';
import { createClient } from '@/lib/utils/supabase/server';
import { revalidateTag, revalidatePath } from 'next/cache';

export async function sendMessageAction(recipientId: string, content: string, messageType: 'direct' | 'club' = 'direct', clubId?: string) {
  try {
    // Get user authentication
    const authUser = await getAuthUser();
    if (!authUser) {
      return { success: false, error: "Authentication required" };
    }

    if (!recipientId || !content.trim()) {
      return { success: false, error: "Recipient and message content are required" };
    }

    if (messageType === 'club' && !clubId) {
      return { success: false, error: "Club ID required for club messages" };
    }

    const supabase = await createClient();

    console.log(`📨 Server Action: Sending ${messageType} message from ${authUser.id} to ${recipientId}`);

    // 1. Insert the message
    const { data: message, error: insertError } = await supabase
      .from('messages')
      .insert({
        sender_id: authUser.id,
        recipient_id: recipientId,
        content: content.trim(),
        message_type: messageType,
        club_id: clubId || null,
        is_read: false,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      console.error('❌ Error sending message:', insertError);
      return { success: false, error: 'Failed to send message' };
    }

    console.log(`✅ Message sent successfully with ID ${message.id}`);

    // 2. Update unread counts (this could be done via database triggers in production)
    const { count: unreadCount, error: countError } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', recipientId)
      .eq('is_read', false);

    if (!countError && unreadCount !== null) {
      // Update recipient's unread count
      await supabase
        .from('profiles')
        .update({ unread_messages: unreadCount })
        .eq('id', recipientId);
    }

    // Server Actions immediately invalidate both Data Cache AND Router Cache
    revalidatePath('/inbox');
    revalidatePath(`/inbox/${recipientId}`); // If viewing specific conversation
    revalidatePath(`/profile/${recipientId}`); // Profile might show unread count
    
    revalidateTag('inbox');
    revalidateTag('messages');
    revalidateTag(`user-${authUser.id}-messages`);
    revalidateTag(`user-${recipientId}-messages`);
    revalidateTag(`user-${recipientId}-unread`);
    
    if (clubId) {
      revalidateTag(`club-${clubId}-messages`);
    }
    
    console.log(`🔄 Server Action: Cache invalidated for message sending`);

    // TODO: Here we would trigger real-time notifications
    // via WebSockets/SSE for live message delivery
    // This Server Action gives immediate UI feedback while
    // real-time layer handles live delivery to other users

    return { 
      success: true, 
      messageId: message.id,
      unreadCount: unreadCount || 0
    };

  } catch (error) {
    console.error('❌ Error in send message action:', error);
    return { success: false, error: 'Internal server error' };
  }
}

export async function markMessageReadAction(messageId: string) {
  try {
    // Get user authentication
    const authUser = await getAuthUser();
    if (!authUser) {
      return { success: false, error: "Authentication required" };
    }

    if (!messageId) {
      return { success: false, error: "Message ID is required" };
    }

    const supabase = await createClient();

    console.log(`📖 Server Action: Marking message ${messageId} as read by ${authUser.id}`);

    // 1. Update the message as read (only if user is recipient)
    const { data: message, error: updateError } = await supabase
      .from('messages')
      .update({ 
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq('id', messageId)
      .eq('recipient_id', authUser.id) // Ensure user can only mark their own messages
      .eq('is_read', false) // Only update if not already read
      .select()
      .single();

    if (updateError || !message) {
      console.error('❌ Error marking message as read:', updateError);
      return { success: false, error: 'Failed to mark message as read' };
    }

    console.log(`✅ Message ${messageId} marked as read`);

    // 2. Update user's unread count
    const { count: unreadCount, error: countError } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', authUser.id)
      .eq('is_read', false);

    if (!countError && unreadCount !== null) {
      await supabase
        .from('profiles')
        .update({ unread_messages: unreadCount })
        .eq('id', authUser.id);
    }

    // Server Actions immediately invalidate both Data Cache AND Router Cache
    revalidatePath('/inbox');
    revalidatePath(`/inbox/${message.sender_id}`); // If viewing conversation
    
    revalidateTag('inbox');
    revalidateTag('messages');
    revalidateTag(`user-${authUser.id}-messages`);
    revalidateTag(`user-${authUser.id}-unread`);
    
    console.log(`🔄 Server Action: Cache invalidated for message read status`);

    return { 
      success: true, 
      unreadCount: unreadCount || 0 
    };

  } catch (error) {
    console.error('❌ Error in mark message read action:', error);
    return { success: false, error: 'Internal server error' };
  }
}