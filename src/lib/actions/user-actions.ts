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

export async function updateUserProfileAction(formData: FormData) {
  try {
    // Get user authentication
    const authUser = await getAuthUser();
    if (!authUser) {
      return { success: false, error: "Authentication required" };
    }

    const supabase = await createClient();

    // Extract form data
    const username = formData.get('username') as string;
    const displayName = formData.get('display_name') as string;
    const profileImageUrl = formData.get('profile_image_url') as string;
    const instagramUrl = formData.get('instagram_url') as string;
    const facebookUrl = formData.get('facebook_url') as string;
    const tiktokUrl = formData.get('tiktok_url') as string;

    console.log(`🔄 Server Action: Updating profile for user ${authUser.id}`);

    // Validate required fields
    if (!username?.trim()) {
      return { success: false, error: "Username is required" };
    }

    if (!displayName?.trim()) {
      return { success: false, error: "Display name is required" };
    }

    // Validate username format
    const usernameRegex = /^[a-z0-9_]+$/;
    if (!usernameRegex.test(username.trim())) {
      return { 
        success: false, 
        error: "Username can only contain lowercase letters, numbers, and underscores" 
      };
    }

    if (username.trim().length < 3) {
      return { success: false, error: "Username must be at least 3 characters long" };
    }

    // Validate URLs if provided
    const validateUrl = (url: string | null): boolean => {
      if (!url || url.trim() === '') return true; // Empty URLs are valid
      try {
        new URL(url);
        return url.startsWith('http://') || url.startsWith('https://');
      } catch {
        return false;
      }
    };

    if (instagramUrl && !validateUrl(instagramUrl)) {
      return { success: false, error: "Please enter a valid Instagram URL" };
    }

    if (facebookUrl && !validateUrl(facebookUrl)) {
      return { success: false, error: "Please enter a valid Facebook URL" };
    }

    if (tiktokUrl && !validateUrl(tiktokUrl)) {
      return { success: false, error: "Please enter a valid TikTok URL" };
    }

    // Check if username is already taken by another user
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('username', username.trim())
      .neq('id', authUser.id)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('❌ Error checking existing username:', checkError);
      return { success: false, error: 'Failed to validate username' };
    }

    if (existingUser) {
      return { success: false, error: 'Username is already taken' };
    }

    // Prepare update data
    const updateData: {
      username: string;
      display_name: string;
      updated_at: string;
      profile_image_url?: string;
      instagram_url?: string | null;
      facebook_url?: string | null;
      tiktok_url?: string | null;
    } = {
      username: username.trim(),
      display_name: displayName.trim(),
      updated_at: new Date().toISOString(),
    };

    // Add optional fields only if they're provided
    if (profileImageUrl) {
      updateData.profile_image_url = profileImageUrl;
    }

    if (instagramUrl !== undefined && instagramUrl !== null) {
      updateData.instagram_url = instagramUrl.trim() || null;
    }

    if (facebookUrl !== undefined && facebookUrl !== null) {
      updateData.facebook_url = facebookUrl.trim() || null;
    }

    if (tiktokUrl !== undefined && tiktokUrl !== null) {
      updateData.tiktok_url = tiktokUrl.trim() || null;
    }

    // Update user profile
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', authUser.id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Error updating user profile:', updateError);
      return { success: false, error: 'Failed to update profile' };
    }

    console.log(`✅ Profile updated successfully for user ${authUser.id}`);

    // Invalidate caches
    revalidatePath('/profile/edit');
    revalidatePath(`/profile/${username.trim()}`);
    revalidatePath(`/profile/${authUser.id}`);
    revalidateTag(`user-${authUser.id}`);
    revalidateTag('profiles');

    return { 
      success: true, 
      user: updatedUser 
    };

  } catch (error) {
    console.error('❌ Error in update user profile action:', error);
    return { success: false, error: 'Internal server error' };
  }
}