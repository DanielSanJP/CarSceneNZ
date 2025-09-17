'use server';

import { getAuthUser } from '@/lib/auth';
import { createClient } from '@/lib/utils/supabase/server';
import { revalidateTag, revalidatePath } from 'next/cache';

export async function toggleFollowUserAction(userId: string) {
  try {
    // Get user authentication
    const authUser = await getAuthUser();
    if (!authUser) {
      return { success: false, error: "Authentication required" };
    }

    if (!userId) {
      return { success: false, error: "User ID is required" };
    }

    if (authUser.id === userId) {
      return { success: false, error: "Cannot follow yourself" };
    }

    const supabase = await createClient();

    console.log(`🔄 Server Action: Toggling follow for user ${userId}, follower ${authUser.id}`);

    // 1. Check if user is already following this user
    const { data: existingFollow, error: checkError } = await supabase
      .from('user_follows')
      .select('id')
      .eq('follower_id', authUser.id)
      .eq('following_id', userId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('❌ Error checking existing follow:', checkError);
      return { success: false, error: 'Failed to check follow status' };
    }

    let isFollowing = false;
    let newFollowerCount = 0;
    let newFollowingCount = 0;

    if (existingFollow) {
      // Unfollow: Remove the follow relationship
      const { error: deleteError } = await supabase
        .from('user_follows')
        .delete()
        .eq('id', existingFollow.id);

      if (deleteError) {
        console.error('❌ Error removing follow:', deleteError);
        return { success: false, error: 'Failed to unfollow user' };
      }

      console.log(`👋 User ${authUser.id} unfollowed user ${userId}`);
      isFollowing = false;
    } else {
      // Follow: Add the follow relationship
      const { error: insertError } = await supabase
        .from('user_follows')
        .insert({
          follower_id: authUser.id,
          following_id: userId
        });

      if (insertError) {
        console.error('❌ Error adding follow:', insertError);
        return { success: false, error: 'Failed to follow user' };
      }

      console.log(`👥 User ${authUser.id} followed user ${userId}`);
      isFollowing = true;
    }

    // 2. Get updated follower count for the target user
    const { count: followerCount, error: followerCountError } = await supabase
      .from('user_follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', userId);

    if (followerCountError) {
      console.error('❌ Error getting follower count:', followerCountError);
      return { success: false, error: 'Failed to get updated follower count' };
    }

    newFollowerCount = followerCount || 0;

    // 3. Get updated following count for the current user
    const { count: followingCount, error: followingCountError } = await supabase
      .from('user_follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', authUser.id);

    if (followingCountError) {
      console.error('❌ Error getting following count:', followingCountError);
      return { success: false, error: 'Failed to get updated following count' };
    }

    newFollowingCount = followingCount || 0;

    // 4. Update both users' follow counts
    const [updateTargetResult, updateCurrentResult] = await Promise.all([
      supabase
        .from('profiles')
        .update({ total_followers: newFollowerCount })
        .eq('id', userId),
      supabase
        .from('profiles')
        .update({ total_following: newFollowingCount })
        .eq('id', authUser.id)
    ]);

    if (updateTargetResult.error) {
      console.error('❌ Error updating target user follower count:', updateTargetResult.error);
      return { success: false, error: 'Failed to update target user stats' };
    }

    if (updateCurrentResult.error) {
      console.error('❌ Error updating current user following count:', updateCurrentResult.error);
      return { success: false, error: 'Failed to update current user stats' };
    }

    console.log(`✅ Updated follow counts - Target user ${userId}: ${newFollowerCount} followers, Current user ${authUser.id}: ${newFollowingCount} following`);

    // Server Actions immediately invalidate both Data Cache AND Router Cache
    revalidatePath('/profile/[id]', 'page');
    revalidatePath(`/profile/${userId}`);
    revalidatePath(`/profile/${authUser.id}`);
    revalidatePath('/'); // Homepage might show followed users
    
    revalidateTag(`user-${userId}`);
    revalidateTag(`user-${authUser.id}`);
    revalidateTag('profiles');
    revalidateTag(`user-${userId}-followers`);
    revalidateTag(`user-${authUser.id}-following`);
    
    console.log(`🔄 Server Action: Cache invalidated for follow toggle between ${authUser.id} and ${userId}`);

    return { 
      success: true, 
      isFollowing, 
      followerCount: newFollowerCount,
      followingCount: newFollowingCount
    };

  } catch (error) {
    console.error('❌ Error in toggle follow user action:', error);
    return { success: false, error: 'Internal server error' };
  }
}