'use server';

import { requireAuth } from '@/lib/auth';
import { createClient } from '@/lib/utils/supabase/server';
import { revalidateTag, revalidatePath } from 'next/cache';

// Helper function to recalculate and update club total likes
export async function updateClubTotalLikes(clubId: string) {
  try {
    const supabase = await createClient();

    console.log(`🔄 Recalculating total likes for club ${clubId}`);

    // Get all members of the club
    const { data: members, error: membersError } = await supabase
      .from('club_members')
      .select('user_id')
      .eq('club_id', clubId);

    if (membersError) {
      console.error('❌ Error fetching club members:', membersError);
      return false;
    }

    if (!members || members.length === 0) {
      console.log(`📊 Club ${clubId} has no members, setting total_likes to 0`);
      
      const { error: updateError } = await supabase
        .from('clubs')
        .update({ total_likes: 0 })
        .eq('id', clubId);

      if (updateError) {
        console.error('❌ Error updating club total likes:', updateError);
        return false;
      }
      return true;
    }

    const memberIds = members.map(m => m.user_id);

    // Get sum of total_likes from all cars owned by club members
    const { data: likesSum, error: sumError } = await supabase
      .from('cars')
      .select('total_likes')
      .in('owner_id', memberIds);

    if (sumError) {
      console.error('❌ Error calculating total likes sum:', sumError);
      return false;
    }

    const totalLikes = likesSum?.reduce((sum, car) => sum + (car.total_likes || 0), 0) || 0;

    console.log(`📊 Club ${clubId} calculated total likes: ${totalLikes} (from ${likesSum?.length || 0} cars by ${members.length} members)`);

    // Update the club's total_likes
    const { error: updateError } = await supabase
      .from('clubs')
      .update({ total_likes: totalLikes })
      .eq('id', clubId);

    if (updateError) {
      console.error('❌ Error updating club total likes:', updateError);
      return false;
    }

    console.log(`✅ Successfully updated club ${clubId} total_likes to ${totalLikes}`);
    
    // Revalidate caches since total_likes affects leaderboards
    revalidateTag('clubs');
    revalidateTag('leaderboards');
    revalidatePath('/leaderboards');
    revalidatePath('/api/leaderboards');
    
    return true;

  } catch (error) {
    console.error('❌ Error in updateClubTotalLikes:', error);
    return false;
  }
}

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

    // Note: total_likes will be automatically calculated by the club_stats view

    // Server Actions immediately invalidate both Data Cache AND Router Cache
    revalidatePath('/clubs/[id]', 'page');
    revalidatePath(`/clubs/${clubId}`);
    revalidatePath('/clubs/my-clubs');
    revalidatePath('/clubs');
    revalidatePath('/leaderboards'); // Revalidate leaderboards page
    revalidatePath('/api/leaderboards'); // Revalidate leaderboards API
    
    revalidateTag(`club-${clubId}`);
    revalidateTag('clubs');
    revalidateTag(`user-${userId}-clubs`);
    revalidateTag('leaderboards'); // Invalidate leaderboards when club membership changes
    
    console.log(`🔄 Server Action: Cache invalidated for club ${clubId} and user ${userId} after join`);

    return { success: true };

  } catch (error) {
    console.error('Error in club join action:', error);
    return { success: false, message: 'Internal server error' };
  }
}

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

    console.log(`🚪 Leave Club Action: User ${userId} attempting to leave club ${clubId}`);

    // First, check if user is actually a member
    const { data: membership, error: membershipError } = await supabase
      .from('club_members')
      .select('role')
      .eq('club_id', clubId)
      .eq('user_id', userId)
      .single();

    if (membershipError || !membership) {
      console.log(`❌ User ${userId} is not a member of club ${clubId}`);
      return { success: false, message: 'You are not a member of this club' };
    }

    console.log(`✅ User ${userId} is a ${membership.role} in club ${clubId}`);

    // Don't allow leader to leave without transferring leadership
    const { data: club } = await supabase
      .from('clubs')
      .select('leader_id')
      .eq('id', clubId)
      .single();

    if (club?.leader_id === userId) {
      console.log(`❌ User ${userId} is the leader and cannot leave club ${clubId}`);
      return { success: false, message: 'Club leader must transfer leadership before leaving' };
    }

    console.log(`🚪 Proceeding to remove user ${userId} from club ${clubId}`);

    // Remove user from club
    const { error } = await supabase
      .from('club_members')
      .delete()
      .eq('club_id', clubId)
      .eq('user_id', userId);

    if (error) {
      console.error('❌ Error leaving club:', error);
      return { success: false, message: 'Failed to leave club' };
    }

    console.log(`✅ Successfully removed user ${userId} from club ${clubId}`);

    // Note: total_likes will be automatically calculated by the club_stats view

    // Server Actions immediately invalidate both Data Cache AND Router Cache
    revalidatePath('/clubs/[id]', 'page');
    revalidatePath(`/clubs/${clubId}`);
    revalidatePath('/clubs/my-clubs');
    revalidatePath('/clubs');
    revalidatePath('/leaderboards'); // Revalidate leaderboards page
    revalidatePath('/api/leaderboards'); // Revalidate leaderboards API
    
    revalidateTag(`club-${clubId}`);
    revalidateTag('clubs');
    revalidateTag(`user-${userId}-clubs`);
    revalidateTag('leaderboards'); // Invalidate leaderboards when club membership changes
    
    console.log(`🔄 Server Action: Cache invalidated for club ${clubId} and user ${userId} after leave`);

    return { success: true };

  } catch (error) {
    console.error('Error in club leave action:', error);
    return { success: false, message: 'Internal server error' };
  }
}

export async function manageMemberAction(clubId: string, targetUserId: string, action: 'promote' | 'demote' | 'kick') {
  try {
    // Get user authentication
    const authUser = await requireAuth();
    if (!authUser) {
      return { success: false, error: "Authentication required" };
    }

    if (!clubId || !targetUserId || !action) {
      return { success: false, error: "Missing required parameters" };
    }

    // Prevent users from managing themselves
    if (targetUserId === authUser.id) {
      return { success: false, error: "Cannot manage your own membership" };
    }

    const supabase = await createClient();

    console.log(`🔄 Server Action: Managing member ${targetUserId} in club ${clubId} with action ${action}`);

    // 1. Verify current user is the club leader
    const { data: club, error: clubError } = await supabase
      .from('clubs')
      .select('leader_id')
      .eq('id', clubId)
      .single();

    if (clubError || !club) {
      console.error('❌ Club not found');
      return { success: false, error: 'Club not found' };
    }

    if (club.leader_id !== authUser.id) {
      console.error('❌ User does not have permission to manage members');
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
      console.error('❌ Member not found in club');
      return { success: false, error: 'Member not found in club' };
    }

    // 3. Prevent managing other leaders
    if (membership.role === 'leader') {
      console.error('❌ Cannot manage other leaders');
      return { success: false, error: 'Cannot manage other leaders' };
    }

    let result;
    let successMessage;

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

        successMessage = "Member promoted to co-leader";
        break;

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

        successMessage = "Co-leader demoted to member";
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

        successMessage = "Member removed from club";
        
        // Note: total_likes will be automatically calculated by the club_stats view
        break;

      default:
        return { success: false, error: 'Invalid action' };
    }

    if (result.error) {
      console.error(`❌ Error performing ${action} action:`, result.error);
      return { success: false, error: `Failed to ${action} member` };
    }

    console.log(`✅ Successfully performed ${action} on member ${targetUserId} in club ${clubId}`);

    // Server Actions immediately invalidate both Data Cache AND Router Cache
    revalidatePath('/clubs/[id]', 'page');
    revalidatePath(`/clubs/${clubId}`);
    revalidatePath('/clubs');
    revalidatePath('/clubs/my-clubs');
    revalidatePath('/leaderboards'); // Revalidate leaderboards page
    revalidatePath('/api/leaderboards'); // Revalidate leaderboards API
    
    revalidateTag(`club-${clubId}`);
    revalidateTag('clubs');
    revalidateTag(`club-${clubId}-members`);
    revalidateTag(`user-${targetUserId}`);
    revalidateTag(`user-${authUser.id}`);
    revalidateTag('leaderboards'); // Invalidate leaderboards when club membership changes
    
    console.log(`🔄 Server Action: Cache invalidated for member management in club ${clubId}`);

    return { 
      success: true, 
      action,
      message: successMessage
    };

  } catch (error) {
    console.error('❌ Error in manage member action:', error);
    return { success: false, error: 'Internal server error' };
  }
}

// Action to refresh all club total likes (useful for fixing inconsistencies)
export async function refreshAllClubTotalLikesAction() {
  try {
    await requireAuth();
    
    const supabase = await createClient();

    console.log('🔄 Refreshing total_likes for all clubs');

    // Get all clubs
    const { data: clubs, error: clubsError } = await supabase
      .from('clubs')
      .select('id');

    if (clubsError) {
      console.error('❌ Error fetching clubs:', clubsError);
      return { success: false, error: 'Failed to fetch clubs' };
    }

    if (!clubs || clubs.length === 0) {
      console.log('📊 No clubs found');
      return { success: true, message: 'No clubs to update' };
    }

    console.log(`🔄 Updating total_likes for ${clubs.length} clubs`);

    let updatedCount = 0;
    for (const club of clubs) {
      const success = await updateClubTotalLikes(club.id);
      if (success) updatedCount++;
    }

    // Invalidate all club-related caches
    revalidatePath('/clubs');
    revalidateTag('clubs');
    revalidateTag('leaderboards');
    revalidatePath('/leaderboards');
    revalidatePath('/api/leaderboards');

    console.log(`✅ Successfully updated ${updatedCount}/${clubs.length} clubs`);

    return { 
      success: true, 
      message: `Updated ${updatedCount} out of ${clubs.length} clubs` 
    };

  } catch (error) {
    console.error('❌ Error in refresh all club total likes action:', error);
    return { success: false, error: 'Internal server error' };
  }
}