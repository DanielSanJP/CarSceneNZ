"use server";

import { createClient } from "@/lib/utils/supabase/server";
import { getAuthUser, getUserProfile } from "@/lib/auth";
import { revalidateTag, revalidatePath } from "next/cache";

/**
 * Send club announcement/mail to all club members
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

    console.log(`📧 Sending club mail from user ${currentUser.id} to club ${clubId}`);

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

    // Prepare messages for all members (including sender)
    const messages = clubMembers.map(member => ({
      sender_id: currentUser.id,
      receiver_id: member.user_id,
      subject: `[${clubName}] ${subject}`,
      message: message,
      message_type: 'club_announcement',
      club_id: clubId,
      // Mark as unread for ALL recipients (including sender)
      is_read: false,
    }));

    // Insert all messages at once
    const { data: insertedMessages, error: insertError } = await supabase
      .from('messages')
      .insert(messages)
      .select('receiver_id');

    if (insertError) {
      console.error('❌ Error sending club mail:', insertError);
      return { success: false, error: 'Failed to send club announcement' };
    }

    const sentCount = insertedMessages?.length || 0;
    const recipientCount = sentCount - 1; // Exclude sender from recipient count for messaging
    console.log(`✅ Club mail sent to ${sentCount} members (including sender)`);

    // Note: Database triggers handle realtime notifications automatically for all recipients
    console.log(`✅ Club mail realtime notifications will be handled by database triggers for ${sentCount} recipients`);

    // Invalidate relevant caches
    revalidateTag('inbox');
    revalidatePath('/inbox');
    revalidatePath(`/clubs/${clubId}`);

    return {
      success: true,
      sentCount,
      recipientCount,
      clubName,
      message: `Club announcement sent to ${recipientCount} members (copy saved to your inbox)`,
    };

  } catch (error) {
    console.error("❌ Error sending club mail:", error);
    return { success: false, error: "Failed to send club announcement" };
  }
}