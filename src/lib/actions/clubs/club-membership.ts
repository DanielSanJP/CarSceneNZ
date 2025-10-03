'use server';

import { requireAuth } from '@/lib/auth';
import { createClient } from '@/lib/utils/supabase/server';
import { invalidateClubCaches } from './utils';

/**
 * Join a club
 */
export async function joinClubAction(clubId: string, userId: string) {
  try {
    const currentUser = await requireAuth();

    if (!clubId || !userId) {
      return { success: false, message: 'Club ID and user ID are required' };
    }

    // Only allow users to join themselves (security check)
    if (userId !== currentUser.id) {
      return { success: false, message: 'You can only join yourself to clubs' };
    }

    const supabase = await createClient();

    // Get club info to check type and permissions
    const { data: club, error: clubError } = await supabase
      .from('clubs')
      .select('id, name, club_type')
      .eq('id', clubId)
      .single();

    if (clubError || !club) {
      return { success: false, message: 'Club not found' };
    }

    // Security check: Only allow direct joining for open clubs
    if (club.club_type !== 'open') {
      const typeMessages = {
        'invite': 'This is an invite-only club. Please request to join or wait for an invitation.',
        'closed': 'This club is currently closed and not accepting new members.'
      };
      
      return { 
        success: false, 
        message: typeMessages[club.club_type as keyof typeof typeMessages] || 'You cannot join this club directly.' 
      };
    }

    // Check if already a member
    const { data: existingMember, error: checkError } = await supabase
      .from('club_members')
      .select('id')
      .eq('club_id', clubId)
      .eq('user_id', userId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing membership:', checkError);
      return { success: false, message: 'Failed to check membership status' };
    }

    if (existingMember) {
      return { success: false, message: 'Already a member of this club' };
    }

    // Add user to club
    const { error: insertError } = await supabase.from('club_members').insert({
      club_id: clubId,
      user_id: userId,
      role: 'member',
    });

    if (insertError) {
      console.error('Error joining club:', insertError);
      return { success: false, message: 'Failed to join club' };
    }

    // Invalidate caches
    invalidateClubCaches(clubId, userId);

    return { success: true };

  } catch (error) {
    console.error('Error in club join action:', error);
    return { success: false, message: 'Internal server error' };
  }
}

/**
 * Leave a club
 */
export async function leaveClubAction(clubId: string, userId: string) {
  try {
    const currentUser = await requireAuth();

    if (!clubId || !userId) {
      return { success: false, message: 'Club ID and user ID are required' };
    }

    // Only allow users to leave themselves (security check)
    if (userId !== currentUser.id) {
      return { success: false, message: 'You can only remove yourself from clubs' };
    }

    const supabase = await createClient();

    // First, check if user is actually a member
    const { data: membership, error: membershipError } = await supabase
      .from('club_members')
      .select('role')
      .eq('club_id', clubId)
      .eq('user_id', userId)
      .single();

    if (membershipError || !membership) {
      return { success: false, message: 'You are not a member of this club' };
    }

    // Special handling for leaders
    const { data: club } = await supabase
      .from('clubs')
      .select('leader_id')
      .eq('id', clubId)
      .single();

    if (club?.leader_id === userId) {
      // Leader is leaving - check if they're the only member
      const { data: allMembers, error: allMembersError } = await supabase
        .from('club_members')
        .select('user_id')
        .eq('club_id', clubId);

      if (allMembersError) {
        console.error('Error checking member count:', allMembersError);
        return { success: false, message: 'Failed to check club membership' };
      }

      if (allMembers && allMembers.length === 1) {
        // Solo leader - delete the entire club
        // Delete the club (cascade will handle members and other related data)
        const { error: deleteError } = await supabase
          .from('clubs')
          .delete()
          .eq('id', clubId);

        if (deleteError) {
          console.error('Error deleting club:', deleteError);
          return { success: false, message: 'Failed to delete club' };
        }

        // Invalidate caches
        invalidateClubCaches(clubId, userId);

        return { 
          success: true, 
          deleted: true, 
          message: 'Left club and club was deleted (you were the only member)' 
        };
      } else {
        // Multi-member club - don't allow leader to leave
        return { 
          success: false, 
          message: 'Transfer leadership to another member before leaving, or remove all other members first' 
        };
      }
    }

    // Remove user from club (non-leader)
    const { error } = await supabase
      .from('club_members')
      .delete()
      .eq('club_id', clubId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error leaving club:', error);
      return { success: false, message: 'Failed to leave club' };
    }

    // Invalidate caches
    invalidateClubCaches(clubId, userId);

    return { success: true };

  } catch (error) {
    console.error('Error in club leave action:', error);
    return { success: false, message: 'Internal server error' };
  }
}
