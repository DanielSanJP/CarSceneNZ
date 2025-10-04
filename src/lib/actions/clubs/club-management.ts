'use server';

import { requireAuth } from '@/lib/auth';
import { createClient } from '@/lib/utils/supabase/server';
import { invalidateClubCaches, invalidateMemberCaches } from './utils';

/**
 * Manage a club member (promote/demote/kick/promote_to_leader)
 */
export async function manageMemberAction(
  clubId: string,
  targetUserId: string,
  action: 'promote' | 'demote' | 'kick' | 'promote_to_leader'
) {
  try {
    const authUser = await requireAuth();

    if (!clubId || !targetUserId || !action) {
      return { success: false, error: 'Missing required parameters' };
    }

    // Prevent users from managing themselves
    if (targetUserId === authUser.id) {
      return { success: false, error: 'Cannot manage your own membership' };
    }

    const supabase = await createClient();

    // 1. Verify current user is the club leader
    const { data: club, error: clubError } = await supabase
      .from('clubs')
      .select('leader_id')
      .eq('id', clubId)
      .single();

    if (clubError || !club) {
      return { success: false, error: 'Club not found' };
    }

    if (club.leader_id !== authUser.id) {
      return { success: false, error: 'Unauthorized - Only club leaders can manage members' };
    }

    // 2. Get target member's current membership
    const { data: membership, error: membershipError } = await supabase
      .from('club_members')
      .select('*')
      .eq('club_id', clubId)
      .eq('user_id', targetUserId)
      .single();

    if (membershipError || !membership) {
      return { success: false, error: 'Member not found in club' };
    }

    // 3. Prevent managing other leaders
    if (membership.role === 'leader') {
      return { success: false, error: 'Cannot manage other leaders' };
    }

    let result;

    switch (action) {
      case 'promote':
        if (membership.role !== 'member') {
          return { success: false, error: 'Can only promote members to co-leaders' };
        }

        result = await supabase
          .from('club_members')
          .update({ 
            role: 'co-leader',
            updated_at: new Date().toISOString()
          })
          .eq('club_id', clubId)
          .eq('user_id', targetUserId);

        break;

      case 'promote_to_leader':
        if (membership.role !== 'co-leader') {
          return { success: false, error: 'Can only promote co-leaders to leader' };
        }

        // Use the dedicated transferLeadershipAction for this
        return await transferLeadershipAction(clubId, targetUserId);

      case 'demote':
        if (membership.role !== 'co-leader') {
          return { success: false, error: 'Can only demote co-leaders to members' };
        }

        result = await supabase
          .from('club_members')
          .update({ 
            role: 'member',
            updated_at: new Date().toISOString()
          })
          .eq('club_id', clubId)
          .eq('user_id', targetUserId);

        break;

      case 'kick':
        if (membership.role === 'leader') {
          return { success: false, error: 'Cannot kick club leaders' };
        }

        result = await supabase
          .from('club_members')
          .delete()
          .eq('club_id', clubId)
          .eq('user_id', targetUserId);

        break;

      default:
        return { success: false, error: 'Invalid action' };
    }

    if (result.error) {
      console.error(`Error performing ${action} action:`, result.error);
      return { success: false, error: `Failed to ${action} member` };
    }

    // Invalidate caches
    invalidateMemberCaches(clubId, targetUserId, authUser.id);

    return { success: true };

  } catch (error) {
    console.error('Error in manage member action:', error);
    return { success: false, error: 'Internal server error' };
  }
}

/**
 * Transfer club leadership to another member
 */
export async function transferLeadershipAction(clubId: string, newLeaderId: string) {
  try {
    const currentUser = await requireAuth();

    if (!clubId || !newLeaderId) {
      return { success: false, message: 'Club ID and new leader ID are required' };
    }

    const supabase = await createClient();

    // Get the club to verify current user is leader
    const { data: club, error: clubError } = await supabase
      .from('clubs')
      .select('leader_id')
      .eq('id', clubId)
      .single();

    if (clubError || !club) {
      return { success: false, message: 'Club not found' };
    }

    if (club.leader_id !== currentUser.id) {
      return { success: false, message: 'Only the current leader can transfer leadership' };
    }

    // Check if target user is a member (and not pending)
    const { data: targetMembership, error: memberError } = await supabase
      .from('club_members')
      .select('role')
      .eq('club_id', clubId)
      .eq('user_id', newLeaderId)
      .single();

    if (memberError || !targetMembership) {
      return { success: false, message: 'Target user is not a member of this club' };
    }

    if (targetMembership.role === 'pending') {
      return { success: false, message: 'Cannot transfer leadership to pending members' };
    }

    // Update club leader
    const { error: updateClubError } = await supabase
      .from('clubs')
      .update({ leader_id: newLeaderId })
      .eq('id', clubId);

    if (updateClubError) {
      console.error('Error updating club leader:', updateClubError);
      return { success: false, message: 'Failed to update club leader' };
    }

    // Update the new leader's role to leader
    const { error: updateNewLeaderError } = await supabase
      .from('club_members')
      .update({ role: 'leader' })
      .eq('club_id', clubId)
      .eq('user_id', newLeaderId);

    if (updateNewLeaderError) {
      console.error('Error updating new leader role:', updateNewLeaderError);
      return { success: false, message: 'Failed to update new leader role' };
    }

    // Update the old leader's role to admin
    const { error: updateOldLeaderError } = await supabase
      .from('club_members')
      .update({ role: 'admin' })
      .eq('club_id', clubId)
      .eq('user_id', currentUser.id);

    if (updateOldLeaderError) {
      console.error('Error updating old leader role:', updateOldLeaderError);
      return { success: false, message: 'Failed to update your role' };
    }

    // Invalidate caches
    invalidateMemberCaches(clubId, newLeaderId, currentUser.id);

    return { success: true };

  } catch (error) {
    console.error('Error in transfer leadership action:', error);
    return { success: false, message: 'Internal server error' };
  }
}

/**
 * Delete a club
 */
export async function deleteClubAction(clubId: string) {
  try {
    const currentUser = await requireAuth();

    if (!clubId) {
      return { success: false, message: 'Club ID is required' };
    }

    const supabase = await createClient();

    // Get the club to verify ownership
    const { data: club, error: clubError } = await supabase
      .from('clubs')
      .select('leader_id')
      .eq('id', clubId)
      .single();

    if (clubError || !club) {
      return { success: false, message: 'Club not found' };
    }

    // Only the leader can delete the club
    if (club.leader_id !== currentUser.id) {
      return { success: false, message: 'Only the club leader can delete the club' };
    }

    // Delete the club (cascade will handle members, messages, and other related data)
    const { error: deleteError } = await supabase
      .from('clubs')
      .delete()
      .eq('id', clubId);

    if (deleteError) {
      console.error('Error deleting club:', deleteError);
      return { success: false, message: 'Failed to delete club' };
    }

    // Invalidate caches
    invalidateClubCaches(clubId, currentUser.id);

    return { success: true };

  } catch (error) {
    console.error('Error in delete club action:', error);
    return { success: false, message: 'Internal server error' };
  }
}
