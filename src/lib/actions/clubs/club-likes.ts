'use server';

import { requireAuth } from '@/lib/auth';
import { createClient } from '@/lib/utils/supabase/server';
import { revalidateTag, revalidatePath } from 'next/cache';

/**
 * Recalculate and update club total likes based on member car likes
 */
export async function updateClubTotalLikes(clubId: string): Promise<boolean> {
  try {
    const supabase = await createClient();

    // Get all members of the club
    const { data: members, error: membersError } = await supabase
      .from('club_members')
      .select('user_id')
      .eq('club_id', clubId);

    if (membersError) {
      console.error('Error fetching club members:', membersError);
      return false;
    }

    if (!members || members.length === 0) {
      const { error: updateError } = await supabase
        .from('clubs')
        .update({ total_likes: 0 })
        .eq('id', clubId);

      if (updateError) {
        console.error('Error updating club total likes:', updateError);
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
      console.error('Error calculating total likes sum:', sumError);
      return false;
    }

    const totalLikes = likesSum?.reduce((sum, car) => sum + (car.total_likes || 0), 0) || 0;

    // Update the club's total_likes
    const { error: updateError } = await supabase
      .from('clubs')
      .update({ total_likes: totalLikes })
      .eq('id', clubId);

    if (updateError) {
      console.error('Error updating club total likes:', updateError);
      return false;
    }
    
    // Revalidate caches since total_likes affects leaderboards
    revalidateTag('clubs');
    revalidateTag('leaderboards');
    revalidatePath('/leaderboards');
    revalidatePath('/api/leaderboards');
    
    return true;

  } catch (error) {
    console.error('Error in updateClubTotalLikes:', error);
    return false;
  }
}

/**
 * Refresh all club total likes (useful for fixing inconsistencies)
 */
export async function refreshAllClubTotalLikesAction() {
  try {
    await requireAuth();
    
    const supabase = await createClient();

    // Get all clubs
    const { data: clubs, error: clubsError } = await supabase
      .from('clubs')
      .select('id');

    if (clubsError) {
      console.error('Error fetching clubs:', clubsError);
      return { success: false, error: 'Failed to fetch clubs' };
    }

    if (!clubs || clubs.length === 0) {
      return { success: true, message: 'No clubs to update' };
    }

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

    return { 
      success: true, 
      message: `Updated ${updatedCount} out of ${clubs.length} clubs` 
    };

  } catch (error) {
    console.error('Error in refresh all club total likes action:', error);
    return { success: false, error: 'Internal server error' };
  }
}
