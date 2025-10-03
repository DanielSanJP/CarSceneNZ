"use server";

import { createClient } from "@/lib/utils/supabase/server";
import { getAuthUser, getUserProfile } from "@/lib/auth";
import { revalidateTag, revalidatePath } from "next/cache";
import { sendDirectMessage } from "./messaging-actions";

/**
 * Send club invitation to a user using new messaging system
 */
export async function sendClubInvitation(
  targetUserId: string, 
  clubId: string, 
  message?: string
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

    if (!targetUserId || !clubId) {
      return { success: false, error: 'Target user ID and club ID are required' };
    }

    const supabase = await createClient();

    // Verify current user is club leader or admin
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
      return { success: false, error: 'You are not authorized to send club invitations' };
    }

    // Check if target user exists
    const { data: targetUser, error: userError } = await supabase
      .from('users')
      .select('id, username')
      .eq('id', targetUserId)
      .single();

    if (userError || !targetUser) {
      return { success: false, error: 'Target user not found' };
    }

    // Check if target user is already a member
    const { data: existingMember } = await supabase
      .from('club_members')
      .select('id')
      .eq('club_id', clubId)
      .eq('user_id', targetUserId)
      .single();

    if (existingMember) {
      return { success: false, error: 'User is already a member of this club' };
    }

    // Check if invitation already exists (check recent invitations)
    const { data: existingInvitation } = await supabase
      .from('inbox_messages')
      .select('id')
      .eq('recipient_id', targetUserId)
      .eq('sender_id', currentUser.id)
      .eq('message_type', 'club_invitation')
      .eq('club_id', clubId)
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // Within last 7 days
      .single();

    if (existingInvitation) {
      return { success: false, error: 'Invitation already sent to this user recently' };
    }

    // Get club name for the invitation message
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const clubName = (membership.club as any)?.name || 'Unknown Club';

    // Create invitation message
    const invitationMessage = message || `You have been invited to join the club "${clubName}".`;
    
    // Use the new sendDirectMessage function
    const result = await sendDirectMessage(
      targetUserId,
      `Club Invitation: ${clubName}`,
      invitationMessage,
      'club_invitation',
      clubId
    );

    if (!result.success) {
      return { success: false, error: result.error || 'Failed to send invitation' };
    }

    // Invalidate relevant caches
    revalidateTag('clubs');
    revalidatePath(`/clubs/${clubId}`);

    return {
      success: true,
      messageId: result.messageId,
      targetUsername: targetUser.username,
      clubName,
      message: `Invitation sent to ${targetUser.username}`,
      meta: {
        sent_at: new Date().toISOString(),
        club_id: clubId,
        target_user_id: targetUserId,
        sender_id: currentUser.id,
      },
    };

  } catch (error) {
    console.error("❌ Error sending club invitation:", error);
    return { success: false, error: "Failed to send club invitation" };
  }
}

/**
 * Send join request to a club using new messaging system
 */
export async function sendJoinRequest(clubId: string, message?: string) {
  try {
    const authUser = await getAuthUser();
    
    if (!authUser) {
      return { success: false, error: 'Authentication required' };
    }
    
    const currentUser = await getUserProfile(authUser.id);
    
    if (!currentUser) {
      return { success: false, error: 'Failed to load user profile' };
    }

    if (!clubId) {
      return { success: false, error: 'Club ID is required' };
    }

    const supabase = await createClient();

    // Get club info and leader
    const { data: club, error: clubError } = await supabase
      .from('clubs')
      .select('id, name, leader_id, club_type')
      .eq('id', clubId)
      .single();

    if (clubError || !club) {
      return { success: false, error: 'Club not found' };
    }

    // Check if club accepts join requests
    if (club.club_type === 'closed') {
      return { success: false, error: 'This club does not accept join requests' };
    }

    if (club.club_type === 'open') {
      return { success: false, error: 'This club is open - you can join directly' };
    }

    // Check if already a member
    const { data: existingMember } = await supabase
      .from('club_members')
      .select('id')
      .eq('club_id', clubId)
      .eq('user_id', currentUser.id)
      .single();

    if (existingMember) {
      return { success: false, error: 'You are already a member of this club' };
    }

    // Check if join request already exists (check recent requests)
    const { data: existingRequest } = await supabase
      .from('inbox_messages')
      .select('id')
      .eq('recipient_id', club.leader_id)
      .eq('sender_id', currentUser.id)
      .eq('message_type', 'club_join_request')
      .eq('club_id', clubId)
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // Within last 7 days
      .single();

    if (existingRequest) {
      return { success: false, error: 'Join request already sent recently' };
    }

    // Create join request message
    const requestMessage = message || `${currentUser.username} would like to join "${club.name}".`;
    
    // Use the new sendDirectMessage function
    const result = await sendDirectMessage(
      club.leader_id,
      `Join Request: ${club.name}`,
      requestMessage,
      'club_join_request',
      clubId
    );

    if (!result.success) {
      return { success: false, error: result.error || 'Failed to send join request' };
    }

    // Invalidate relevant caches
    revalidateTag('clubs');
    revalidatePath(`/clubs/${clubId}`);

    return {
      success: true,
      messageId: result.messageId,
      clubName: club.name,
      leaderUsername: result.recipientUsername,
      message: `Join request sent to ${club.name}`,
      meta: {
        sent_at: new Date().toISOString(),
        club_id: clubId,
        leader_id: club.leader_id,
        requester_id: currentUser.id,
      },
    };

  } catch (error) {
    console.error("❌ Error sending join request:", error);
    return { success: false, error: "Failed to send join request" };
  }
}

/**
 * Handle club invitation (accept/reject) using new messaging system
 */
export async function handleClubInvitation(
  messageId: string,
  action: 'accept' | 'reject',
  clubId: string,
  inviterId: string
) {
  try {
    const authUser = await getAuthUser();
    
    if (!authUser) {
      return { success: false, error: 'Authentication required' };
    }

    const supabase = await createClient();

    // Verify the invitation message exists and belongs to the user
    const { data: invitationMessage, error: messageError } = await supabase
      .from('inbox_messages')
      .select('*')
      .eq('id', messageId)
      .eq('recipient_id', authUser.id)
      .eq('message_type', 'club_invitation')
      .eq('club_id', clubId)
      .single();

    if (messageError || !invitationMessage) {
      return { success: false, error: 'Invitation not found' };
    }

    // Get club info
    const { data: club, error: clubError } = await supabase
      .from('clubs')
      .select('id, name')
      .eq('id', clubId)
      .single();

    if (clubError || !club) {
      return { success: false, error: 'Club not found' };
    }

    if (action === 'accept') {
      // Add user to club
      const { error: memberError } = await supabase
        .from('club_members')
        .insert({
          club_id: clubId,
          user_id: authUser.id,
          role: 'member',
        });

      if (memberError) {
        console.error('❌ Error adding user to club:', memberError);
        return { success: false, error: 'Failed to join club' };
      }

      // Send confirmation to inviter
      await sendDirectMessage(
        inviterId,
        `Invitation Accepted: ${club.name}`,
        `Your invitation to join "${club.name}" has been accepted.`,
        'club_notification',
        clubId
      );
    } else {
      // Send rejection notification to inviter
      await sendDirectMessage(
        inviterId,
        `Invitation Declined: ${club.name}`,
        `Your invitation to join "${club.name}" has been declined.`,
        'club_notification',
        clubId
      );
    }

    // Mark the original invitation message as read and remove it from inbox
    await supabase.rpc('delete_message_for_recipient', {
      p_message_id: messageId,
      p_recipient_id: authUser.id
    });

    // Invalidate relevant caches
    revalidateTag('clubs');
    revalidateTag('inbox');
    revalidatePath('/clubs');
    revalidatePath('/inbox');
    revalidatePath(`/clubs/${clubId}`);

    return {
      success: true,
      action,
      clubName: club.name,
      message: action === 'accept' 
        ? `Successfully joined ${club.name}` 
        : `Invitation to ${club.name} declined`,
      meta: {
        processed_at: new Date().toISOString(),
        club_id: clubId,
        user_id: authUser.id,
        original_message_id: messageId,
      },
    };

  } catch (error) {
    console.error("❌ Error handling club invitation:", error);
    return { success: false, error: "Failed to process invitation" };
  }
}

/**
 * Handle join request (approve/reject) using new messaging system
 */
export async function handleJoinRequest(
  messageId: string,
  action: 'approve' | 'reject',
  requesterId: string,
  clubId: string
) {
  try {
    const authUser = await getAuthUser();
    
    if (!authUser) {
      return { success: false, error: 'Authentication required' };
    }

    const supabase = await createClient();

    // Verify the join request exists and user has permission to handle it
    const { data: requestMessage, error: messageError } = await supabase
      .from('inbox_messages')
      .select('*')
      .eq('id', messageId)
      .eq('recipient_id', authUser.id)
      .eq('message_type', 'club_join_request')
      .eq('club_id', clubId)
      .single();

    if (messageError || !requestMessage) {
      return { success: false, error: 'Join request not found' };
    }

    // Verify user is club leader or admin
    const { data: membership, error: membershipError } = await supabase
      .from('club_members')
      .select('role, club:clubs(name)')
      .eq('club_id', clubId)
      .eq('user_id', authUser.id)
      .single();

    if (
      membershipError ||
      !membership ||
      !['leader', 'admin'].includes(membership.role)
    ) {
      return { success: false, error: 'You are not authorized to handle join requests' };
    }

    // Get club name
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const clubName = (membership.club as any)?.name || 'Unknown Club';

    if (action === 'approve') {
      // Add user to club
      const { error: memberError } = await supabase
        .from('club_members')
        .insert({
          club_id: clubId,
          user_id: requesterId,
          role: 'member',
        });

      if (memberError) {
        console.error('❌ Error adding user to club:', memberError);
        return { success: false, error: 'Failed to add member to club' };
      }

      // Send approval notification to requester
      await sendDirectMessage(
        requesterId,
        `Join Request Approved: ${clubName}`,
        `Your request to join "${clubName}" has been approved. Welcome to the club!`,
        'club_notification',
        clubId
      );
    } else {
      // Send rejection notification to requester
      await sendDirectMessage(
        requesterId,
        `Join Request Declined: ${clubName}`,
        `Your request to join "${clubName}" has been declined.`,
        'club_notification',
        clubId
      );
    }

    // Mark the original join request as read and remove it from inbox
    await supabase.rpc('delete_message_for_recipient', {
      p_message_id: messageId,
      p_recipient_id: authUser.id
    });

    // Invalidate relevant caches
    revalidateTag('clubs');
    revalidateTag('inbox');
    revalidatePath('/clubs');
    revalidatePath('/inbox');
    revalidatePath(`/clubs/${clubId}`);

    return {
      success: true,
      action,
      clubName,
      message: action === 'approve' 
        ? `Join request approved - member added to ${clubName}` 
        : `Join request declined`,
      meta: {
        processed_at: new Date().toISOString(),
        club_id: clubId,
        requester_id: requesterId,
        handler_id: authUser.id,
        original_message_id: messageId,
      },
    };

  } catch (error) {
    console.error("❌ Error handling join request:", error);
    return { success: false, error: "Failed to process join request" };
  }
}