"use server";

import { createClient } from "@/lib/utils/supabase/server";
import { getAuthUser, getUserProfile } from "@/lib/auth";
import { revalidateTag, revalidatePath } from "next/cache";

/**
 * Send club announcement/mail to all club members using new messaging system
 */
export async function sendClubMail(
  clubId: string,
  subject: string,
  message: string
) {
  try {
    const authUser = await getAuthUser();
    
    if (!authUser) {
      return { success: false, error: 'Authentication required' };
    }
    
    const currentUser = await getUserProfile(authUser.id);
    
    if (!currentUser) {
      return { success: false, error: 'Failed to load user profile' };
    }

    if (!clubId || !subject || !message) {
      return { success: false, error: 'Club ID, subject, and message are required' };
    }

    const supabase = await createClient();

    // Verify user is club leader or admin
    const { data: membership, error: membershipError } = await supabase
      .from('club_members')
      .select('role, club:clubs(name)')
      .eq('club_id', clubId)
      .eq('user_id', currentUser.id)
      .single();

    if (
      membershipError ||
      !membership ||
      !['leader', 'admin'].includes(membership.role)
    ) {
      return { success: false, error: 'You are not authorized to send club announcements' };
    }

    // Get all club members (including the sender)
    const { data: clubMembers, error: membersError } = await supabase
      .from('club_members')
      .select('user_id')
      .eq('club_id', clubId);

    if (membersError) {
      console.error('❌ Error fetching club members:', membersError);
      return { success: false, error: 'Failed to fetch club members' };
    }

    if (!clubMembers || clubMembers.length === 0) {
      return { success: false, error: 'No members found to send message to' };
    }

    // Get club name for the subject
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const clubName = (membership.club as any)?.name || 'Club';

    // Prepare recipient IDs array
    const recipientIds = clubMembers.map(member => member.user_id);

    // Use the new send_message_to_recipients function
    const { data: messageId, error: sendError } = await supabase
      .rpc('send_message_to_recipients', {
        p_sender_id: currentUser.id,
        p_recipient_ids: recipientIds,
        p_subject: `[${clubName}] ${subject}`,
        p_message: message,
        p_message_type: 'club_announcement',
        p_club_id: clubId
      });

    if (sendError) {
      console.error('❌ Error sending club mail:', sendError);
      return { success: false, error: 'Failed to send club announcement' };
    }

    const sentCount = recipientIds.length;
    const recipientCount = sentCount - 1; // Exclude sender from recipient count for messaging

    // Note: Database triggers handle realtime notifications automatically for all recipients

    // Invalidate relevant caches
    revalidateTag('inbox');
    revalidatePath('/inbox');
    revalidatePath(`/clubs/${clubId}`);

    return {
      success: true,
      messageId,
      sentCount,
      recipientCount,
      clubName,
      message: `Club announcement sent to ${recipientCount} members (copy saved to your inbox)`,
      meta: {
        sent_at: new Date().toISOString(),
        club_id: clubId,
        sender_id: currentUser.id,
      },
    };

  } catch (error) {
    console.error("❌ Error sending club mail:", error);
    return { success: false, error: "Failed to send club announcement" };
  }
}

/**
 * Send a direct message to a single user
 */
export async function sendDirectMessage(
  recipientId: string,
  subject: string,
  message: string,
  messageType: 'general' | 'club_join_request' | 'club_invitation' | 'club_notification' | 'system' = 'general',
  clubId?: string
) {
  try {
    const authUser = await getAuthUser();
    
    if (!authUser) {
      return { success: false, error: 'Authentication required' };
    }

    if (!recipientId || !message) {
      return { success: false, error: 'Recipient ID and message are required' };
    }

    const supabase = await createClient();

    // Verify recipient exists
    const { data: recipient, error: recipientError } = await supabase
      .from('users')
      .select('id, username')
      .eq('id', recipientId)
      .single();

    if (recipientError || !recipient) {
      return { success: false, error: 'Recipient not found' };
    }

    // Use the new send_message_to_recipients function
    const { data: messageId, error: sendError } = await supabase
      .rpc('send_message_to_recipients', {
        p_sender_id: authUser.id,
        p_recipient_ids: [recipientId],
        p_subject: subject,
        p_message: message,
        p_message_type: messageType,
        p_club_id: clubId || null
      });

    if (sendError) {
      console.error('❌ Error sending direct message:', sendError);
      return { success: false, error: 'Failed to send message' };
    }

    // Invalidate relevant caches
    revalidateTag('inbox');
    revalidatePath('/inbox');

    return {
      success: true,
      messageId,
      recipientUsername: recipient.username,
      message: `Message sent to ${recipient.username}`,
      meta: {
        sent_at: new Date().toISOString(),
        recipient_id: recipientId,
        sender_id: authUser.id,
      },
    };

  } catch (error) {
    console.error("❌ Error sending direct message:", error);
    return { success: false, error: "Failed to send message" };
  }
}

/**
 * Send message to multiple specific users
 */
export async function sendMessageToMultipleUsers(
  recipientIds: string[],
  subject: string,
  message: string,
  messageType: 'general' | 'club_join_request' | 'club_invitation' | 'club_notification' | 'system' = 'general',
  clubId?: string
) {
  try {
    const authUser = await getAuthUser();
    
    if (!authUser) {
      return { success: false, error: 'Authentication required' };
    }

    if (!recipientIds || recipientIds.length === 0 || !message) {
      return { success: false, error: 'Recipients and message are required' };
    }

    const supabase = await createClient();

    // Verify recipients exist
    const { data: recipients, error: recipientsError } = await supabase
      .from('users')
      .select('id, username')
      .in('id', recipientIds);

    if (recipientsError) {
      console.error('❌ Error fetching recipients:', recipientsError);
      return { success: false, error: 'Failed to verify recipients' };
    }

    if (!recipients || recipients.length === 0) {
      return { success: false, error: 'No valid recipients found' };
    }

    if (recipients.length !== recipientIds.length) {
      console.warn(`⚠️ Some recipients not found. Expected: ${recipientIds.length}, Found: ${recipients.length}`);
    }

    const validRecipientIds = recipients.map(r => r.id);

    // Use the new send_message_to_recipients function
    const { data: messageId, error: sendError } = await supabase
      .rpc('send_message_to_recipients', {
        p_sender_id: authUser.id,
        p_recipient_ids: validRecipientIds,
        p_subject: subject,
        p_message: message,
        p_message_type: messageType,
        p_club_id: clubId || null
      });

    if (sendError) {
      console.error('❌ Error sending message to multiple users:', sendError);
      return { success: false, error: 'Failed to send message' };
    }

    // Invalidate relevant caches
    revalidateTag('inbox');
    revalidatePath('/inbox');

    return {
      success: true,
      messageId,
      sentCount: validRecipientIds.length,
      recipientUsernames: recipients.map(r => r.username),
      message: `Message sent to ${validRecipientIds.length} recipients`,
      meta: {
        sent_at: new Date().toISOString(),
        recipient_ids: validRecipientIds,
        sender_id: authUser.id,
      },
    };

  } catch (error) {
    console.error("❌ Error sending message to multiple users:", error);
    return { success: false, error: "Failed to send message" };
  }
}