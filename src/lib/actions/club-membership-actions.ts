"use server";

import { createClient } from "@/lib/utils/supabase/server";
import { getAuthUser, getUserProfile } from "@/lib/auth";
import { revalidateTag, revalidatePath } from "next/cache";
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Send club invitation to a user
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

    console.log(`📧 Sending club invitation from user ${currentUser.id} to user ${targetUserId} for club ${clubId}`);

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
      return { success: false, error: 'You are not authorized to send invitations for this club' };
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

    // Check if invitation already exists
    const { data: existingInvitation } = await supabase
      .from('messages')
      .select('id')
      .eq('receiver_id', targetUserId)
      .eq('sender_id', currentUser.id)
      .eq('message_type', 'club_invitation')
      .eq('club_id', clubId)
      .single();

    if (existingInvitation) {
      return { success: false, error: 'Invitation already sent to this user' };
    }

    // Get club name for the invitation message
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const clubName = (membership.club as any)?.name || 'Unknown Club';

    // Create invitation message
    const invitationMessage = message || `You have been invited to join the club "${clubName}".`;
    
    const { error: insertError } = await supabase
      .from('messages')
      .insert({
        sender_id: currentUser.id,
        receiver_id: targetUserId,
        subject: `Club Invitation: ${clubName}`,
        message: invitationMessage,
        message_type: 'club_invitation',
        club_id: clubId,
        is_read: false,
      });

    if (insertError) {
      console.error('❌ Error sending invitation:', insertError);
      return { success: false, error: 'Failed to send invitation' };
    }

    console.log(`✅ Club invitation sent successfully`);

    // Note: Database triggers handle realtime notifications automatically
    console.log(`✅ Club invitation sent to user ${targetUserId} (triggers will handle realtime)`);

    // Invalidate relevant caches
    revalidateTag('inbox');
    revalidatePath('/inbox');

    return {
      success: true,
      message: 'Invitation sent successfully',
      targetUser: targetUser.username,
      clubName,
    };

  } catch (error) {
    console.error("❌ Error sending club invitation:", error);
    return { success: false, error: "Failed to send club invitation" };
  }
}

/**
 * Send join request to a club
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

    console.log('📥 Join request received:', { clubId, message, clubIdType: typeof clubId });

    const supabase = await createClient();

    // Check if club exists and get its type
    const { data: club, error: clubError } = await supabase
      .from('clubs')
      .select('id, name, leader_id, club_type')
      .eq('id', clubId)
      .single();

    if (clubError || !club) {
      return { success: false, error: 'Club not found' };
    }

    // Check if user is already a member
    const { data: existingMember } = await supabase
      .from('club_members')
      .select('id')
      .eq('club_id', clubId)
      .eq('user_id', currentUser.id)
      .single();

    if (existingMember) {
      return { success: false, error: 'You are already a member of this club' };
    }

    // Check if user already sent a join request
    const { data: existingRequest } = await supabase
      .from('messages')
      .select('id')
      .eq('sender_id', currentUser.id)
      .eq('receiver_id', club.leader_id)
      .eq('message_type', 'club_join_request')
      .eq('club_id', clubId)
      .single();

    if (existingRequest) {
      return { success: false, error: 'Join request already sent' };
    }

    // Handle different club types
    if (club.club_type === 'open') {
      // For open clubs, directly add the user as a member
      const { error: memberError } = await supabase
        .from('club_members')
        .insert({
          club_id: clubId,
          user_id: currentUser.id,
          role: 'member',
          joined_at: new Date().toISOString(),
        });

      if (memberError) {
        console.error('❌ Error joining open club:', memberError);
        return { success: false, error: 'Failed to join club' };
      }

      // Invalidate caches
      revalidateTag('club-members');
      revalidatePath(`/clubs/${clubId}`);
      revalidatePath('/clubs/my-clubs');

      return {
        success: true,
        message: `Successfully joined ${club.name}!`,
        directJoin: true,
      };
    } else {
      // For invite-only and closed clubs, send a join request
      const requestMessage = message || `${currentUser.display_name || currentUser.username} would like to join your club "${club.name}".`;
      
      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          sender_id: currentUser.id,
          receiver_id: club.leader_id,
          subject: `Join Request: ${club.name}`,
          message: requestMessage,
          message_type: 'club_join_request',
          club_id: clubId,
          is_read: false,
        });

      if (messageError) {
        console.error('❌ Error sending join request:', messageError);
        return { success: false, error: 'Failed to send join request' };
      }

      // Note: Database triggers handle realtime notifications automatically
      console.log(`✅ Join request sent to club leader ${club.leader_id} (triggers will handle realtime)`);

      // Invalidate inbox caches
      revalidateTag('inbox');
      revalidatePath('/inbox');

      return {
        success: true,
        message: `Join request sent to ${club.name}!`,
        directJoin: false,
      };
    }

  } catch (error) {
    console.error("❌ Error sending join request:", error);
    return { success: false, error: "Failed to send join request" };
  }
}

/**
 * Handle club invitation (accept/reject)
 */
export async function handleClubInvitation(
  messageId: string,
  action: 'accept' | 'reject',
  clubId: string,
  inviterId: string
) {
  try {
    // Validate parameters
    if (!messageId || !action || !clubId || !inviterId) {
      return { success: false, error: 'Missing required parameters: messageId, action, clubId, inviterId' };
    }

    if (!['accept', 'reject'].includes(action)) {
      return { success: false, error: 'Invalid action. Must be accept or reject' };
    }

    const authUser = await getAuthUser();
    
    if (!authUser) {
      return { success: false, error: 'Authentication required' };
    }
    
    const currentUser = await getUserProfile(authUser.id);
    
    if (!currentUser) {
      return { success: false, error: 'Failed to load user profile' };
    }

    const supabase = await createClient();

    // Verify the invitation belongs to the current user
    const { data: invitation, error: invitationError } = await supabase
      .from('messages')
      .select('id, receiver_id, sender_id, club_id')
      .eq('id', messageId)
      .eq('receiver_id', currentUser.id)
      .eq('message_type', 'club_invitation')
      .single();

    if (invitationError || !invitation) {
      return { success: false, error: 'Invitation not found or you are not authorized to handle it' };
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
      // Check if user is already a member
      const { data: existingMember } = await supabase
        .from('club_members')
        .select('id')
        .eq('club_id', clubId)
        .eq('user_id', currentUser.id)
        .single();

      if (existingMember) {
        return { success: false, error: 'You are already a member of this club' };
      }

      // Add user to club
      const { error: memberError } = await supabase
        .from('club_members')
        .insert({
          club_id: clubId,
          user_id: currentUser.id,
          role: 'member',
          joined_at: new Date().toISOString(),
        });

      if (memberError) {
        console.error('❌ Error adding member to club:', memberError);
        return { success: false, error: 'Failed to join club' };
      }

      // Send confirmation message to inviter
      await supabase
        .from('messages')
        .insert({
          sender_id: currentUser.id,
          receiver_id: inviterId,
          subject: `Invitation Accepted: ${club.name}`,
          message: `${currentUser.display_name || currentUser.username} has accepted your invitation to join "${club.name}".`,
          message_type: 'club_notification',
          club_id: clubId,
          is_read: false,
        });
    } else {
      // Send rejection message to inviter
      await supabase
        .from('messages')
        .insert({
          sender_id: currentUser.id,
          receiver_id: inviterId,
          subject: `Invitation Declined: ${club.name}`,
          message: `${currentUser.display_name || currentUser.username} has declined your invitation to join "${club.name}".`,
          message_type: 'club_notification',
          club_id: clubId,
          is_read: false,
        });
    }

    // For rejected invitations, delete the message. For accepted invitations, mark as read
    if (action === 'reject') {
      console.log(`🗑️ Deleting rejected club invitation message: ${messageId}`);
      await supabase
        .from('messages')
        .delete()
        .eq('id', messageId);
    } else {
      console.log(`✅ Marking accepted club invitation as read: ${messageId}`);
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('id', messageId);
    }

    // Note: Database triggers handle realtime notifications automatically
    console.log(`✅ Club invitation response sent to inviter ${inviterId} (triggers will handle realtime)`);

    // Invalidate relevant caches
    revalidateTag('inbox');
    revalidateTag('club-members');
    revalidatePath('/inbox');
    revalidatePath(`/clubs/${clubId}`);
    if (action === 'accept') {
      revalidatePath('/clubs/my-clubs');
    }

    return {
      success: true,
      action,
      clubName: club.name,
      message: action === 'accept' 
        ? `Successfully joined ${club.name}!` 
        : `Invitation to ${club.name} declined.`
    };

  } catch (error) {
    console.error("❌ Error handling club invitation:", error);
    return { success: false, error: "Failed to handle club invitation" };
  }
}

// Helper function to add member to club (used by handleJoinRequest)
async function addMemberToClub(supabase: SupabaseClient, clubId: string, userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if user is already a member
    const { data: existingMember } = await supabase
      .from('club_members')
      .select('id')
      .eq('club_id', clubId)
      .eq('user_id', userId)
      .single()

    if (existingMember) {
      return { success: false, error: 'User is already a member of this club' }
    }

    // Add member to club
    const { error } = await supabase
      .from('club_members')
      .insert({
        club_id: clubId,
        user_id: userId,
        role: 'member',
        joined_at: new Date().toISOString()
      })

    if (error) {
      console.error('Error adding member to club:', error)
      return { success: false, error: 'Failed to add member to club' }
    }

    return { success: true }
  } catch (error) {
    console.error('Error in addMemberToClub:', error)
    return { success: false, error: 'Failed to add member to club' }
  }
}

// Helper function to send club notification
async function sendClubNotification(
  supabase: SupabaseClient,
  senderId: string,
  receiverId: string,
  subject: string,
  message: string,
  clubId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('messages')
      .insert({
        sender_id: senderId,
        receiver_id: receiverId,
        subject,
        message,
        message_type: 'club_notification',
        club_id: clubId,
        is_read: false,
      });

    if (error) {
      console.error('Error sending club notification:', error);
      return { success: false, error: 'Failed to send notification' };
    }

    // Note: Database triggers handle realtime notifications automatically
    console.log(`✅ Club notification sent to user ${receiverId} (triggers will handle realtime)`);

    return { success: true };
  } catch (error) {
    console.error('Error in sendClubNotification:', error);
    return { success: false, error: 'Failed to send notification' };
  }
}

/**
 * Handle join request (approve/reject) - complex operation
 */
export async function handleJoinRequest(
  messageId: string,
  action: 'approve' | 'reject',
  requesterId: string,
  clubId: string
) {
  try {
    // Validate parameters
    if (!messageId || !action || !requesterId || !clubId) {
      return { success: false, error: 'Missing required parameters' };
    }

    if (!['approve', 'reject'].includes(action)) {
      return { success: false, error: 'Invalid action. Must be approve or reject' };
    }

    const authUser = await getAuthUser();
    
    if (!authUser) {
      return { success: false, error: 'Authentication required' };
    }

    const supabase = await createClient();

    // Verify current user is club leader/admin and get club info
    const { data: membership, error: membershipError } = await supabase
      .from('club_members')
      .select('role, club:clubs(id, name)')
      .eq('club_id', clubId)
      .eq('user_id', authUser.id)
      .single();

    if (membershipError || !membership || !['leader', 'admin'].includes(membership.role)) {
      return { success: false, error: 'You are not authorized to handle join requests for this club' };
    }

    // Verify the join request exists and belongs to this club
    const { data: joinRequest, error: requestError } = await supabase
      .from('messages')
      .select('id, sender_id, receiver_id, club_id')
      .eq('id', messageId)
      .eq('receiver_id', authUser.id)
      .eq('sender_id', requesterId)
      .eq('club_id', clubId)
      .eq('message_type', 'club_join_request')
      .single();

    if (requestError || !joinRequest) {
      return { success: false, error: 'Join request not found or you are not authorized to handle it' };
    }

    // Get requester info
    const { data: requester, error: requesterError } = await supabase
      .from('users')
      .select('id, username, display_name')
      .eq('id', requesterId)
      .single();

    if (requesterError || !requester) {
      return { success: false, error: 'Requester not found' };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const clubName = (membership.club as any)?.name || 'Unknown Club';
    const requesterName = requester.display_name || requester.username;

    if (action === 'approve') {
      // Add member to club
      const addMemberResult = await addMemberToClub(supabase, clubId, requesterId);
      
      if (!addMemberResult.success) {
        return { success: false, error: addMemberResult.error };
      }

      // Send approval notification to requester
      const approvalResult = await sendClubNotification(
        supabase,
        authUser.id,
        requesterId,
        `Welcome to ${clubName}!`,
        `Your request to join "${clubName}" has been approved. Welcome to the club!`,
        clubId
      );

      if (!approvalResult.success) {
        console.error('Failed to send approval notification:', approvalResult.error);
        // Don't fail the whole operation if notification fails
      }
    } else {
      // Send rejection notification to requester
      const rejectionResult = await sendClubNotification(
        supabase,
        authUser.id,
        requesterId,
        `Join Request Declined`,
        `Your request to join "${clubName}" has been declined.`,
        clubId
      );

      if (!rejectionResult.success) {
        console.error('Failed to send rejection notification:', rejectionResult.error);
        // Don't fail the whole operation if notification fails
      }
    }

    // For rejected requests, delete the message. For approved requests, mark as read
    if (action === 'reject') {
      console.log(`🗑️ Deleting rejected join request message: ${messageId}`);
      await supabase
        .from('messages')
        .delete()
        .eq('id', messageId);
    } else {
      console.log(`✅ Marking approved join request as read: ${messageId}`);
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('id', messageId);
    }

    // Note: Database triggers handle realtime notifications automatically
    console.log(`✅ Join request response sent to requester ${requesterId} (triggers will handle realtime)`);

    // Invalidate relevant caches
    revalidateTag('inbox');
    revalidateTag('club-members');
    revalidatePath('/inbox');
    revalidatePath(`/clubs/${clubId}`);

    return {
      success: true,
      action,
      requesterName,
      clubName,
      message: action === 'approve' 
        ? `${requesterName} has been approved to join ${clubName}` 
        : `Join request from ${requesterName} has been declined`
    };

  } catch (error) {
    console.error("❌ Error handling join request:", error);
    return { success: false, error: "Failed to handle join request" };
  }
}