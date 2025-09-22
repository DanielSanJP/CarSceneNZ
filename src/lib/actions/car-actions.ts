'use server';

import { getAuthUser } from '@/lib/auth';
import { createClient } from '@/lib/utils/supabase/server';
import { revalidateTag, revalidatePath } from 'next/cache';

export async function likeCarAction(carId: string) {
  try {
    // Get user authentication
    const authUser = await getAuthUser();
    if (!authUser) {
      return { success: false, error: "Authentication required" };
    }

    if (!carId) {
      return { success: false, error: "Car ID is required" };
    }

    const supabase = await createClient();

    console.log(`🔄 Server Action: Toggling like for car ${carId}, user ${authUser.id}`);

    // 1. Check if user already liked this car
    const { data: existingLike, error: checkError } = await supabase
      .from('car_likes')
      .select('id')
      .eq('car_id', carId)
      .eq('user_id', authUser.id)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('❌ Error checking existing like:', checkError);
      return { success: false, error: 'Failed to check like status' };
    }

    let isLiked = false;
    let newLikeCount = 0;

    if (existingLike) {
      // Unlike: Remove the like
      const { error: deleteError } = await supabase
        .from('car_likes')
        .delete()
        .eq('id', existingLike.id);

      if (deleteError) {
        console.error('❌ Error removing like:', deleteError);
        return { success: false, error: 'Failed to remove like' };
      }

      console.log(`👎 Removed like for car ${carId}`);
      isLiked = false;
    } else {
      // Like: Add the like
      const { error: insertError } = await supabase
        .from('car_likes')
        .insert({
          car_id: carId,
          user_id: authUser.id
        });

      if (insertError) {
        console.error('❌ Error adding like:', insertError);
        return { success: false, error: 'Failed to add like' };
      }

      console.log(`👍 Added like for car ${carId}`);
      isLiked = true;
    }

    // 2. Get updated like count
    const { count: likeCount, error: countError } = await supabase
      .from('car_likes')
      .select('*', { count: 'exact', head: true })
      .eq('car_id', carId);

    if (countError) {
      console.error('❌ Error getting like count:', countError);
      return { success: false, error: 'Failed to get updated like count' };
    }

    newLikeCount = likeCount || 0;

    // 3. Update the car's total_likes
    const { error: updateError } = await supabase
      .from('cars')
      .update({ total_likes: newLikeCount })
      .eq('id', carId);

    if (updateError) {
      console.error('❌ Error updating car total_likes:', updateError);
      return { success: false, error: 'Failed to update car likes count' };
    }

    console.log(`✅ Updated car ${carId} total_likes to ${newLikeCount}`);

    // Note: Club total_likes will be automatically calculated by the club_stats view
    // No need to manually update club totals anymore

    // Server Actions immediately invalidate both Data Cache AND Router Cache
    revalidatePath('/garage/[id]', 'page');
    revalidatePath(`/garage/${carId}`);
    revalidatePath('/garage');
    revalidatePath('/garage/my-garage');
    revalidatePath('/clubs'); // Club rankings may have changed
    revalidatePath('/leaderboards'); // Leaderboards may have changed due to club ranking updates
    revalidatePath('/api/leaderboards'); // Revalidate leaderboards API
    revalidatePath('/'); // Homepage might show liked cars
    
    revalidateTag(`car-${carId}`);
    revalidateTag('cars');
    revalidateTag('garage');
    revalidateTag('clubs'); // Invalidate clubs cache since rankings may change
    revalidateTag('leaderboards'); // Invalidate leaderboards cache since club rankings may change
    revalidateTag(`user-${authUser.id}-likes`);
    
    console.log(`🔄 Server Action: Cache invalidated for car ${carId} like toggle`);

    return { 
      success: true, 
      isLiked, 
      likeCount: newLikeCount 
    };

  } catch (error) {
    console.error('❌ Error in like car action:', error);
    return { success: false, error: 'Internal server error' };
  }
}