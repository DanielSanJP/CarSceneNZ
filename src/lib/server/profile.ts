import 'server-only';
import { createClient } from '@/lib/utils/supabase/server';
import type { User } from '@/types/user';

export interface UserProfile extends User {
  followersCount: number;
  followingCount: number;
  carsCount: number;
  clubsCount: number;
  eventsCount: number;
}

/**
 * Get user by ID with caching - server-only version
 */
/**
 * Get user by ID - no caching for profile data since it changes frequently
 * Internal function for profile operations
 */
const getUserByIdInternal = async (userId: string): Promise<User | null> => {
  try {
    const supabase = await createClient();

    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return null;
    }

    return {
      id: profile.id,
      username: profile.username,
      display_name: profile.display_name || profile.username,
      email: '',
      profile_image_url: profile.profile_image_url,
      created_at: profile.created_at,
      updated_at: profile.updated_at,
    };
  } catch (error) {
    console.error('Error getting user by ID:', error);
    return null;
  }
};

/**
 * Get user by username - no caching for profile data since it changes frequently
 */
export const getUserByUsername = async (username: string): Promise<User | null> => {
  try {
    const supabase = await createClient();

    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single();

    if (profileError || !profile) {
      return null;
    }

    return {
      id: profile.id,
      username: profile.username,
      display_name: profile.display_name || profile.username,
      email: '',
      profile_image_url: profile.profile_image_url,
      created_at: profile.created_at,
      updated_at: profile.updated_at,
    };
  } catch (error) {
    console.error('Error getting user by username:', error);
    return null;
  }
};

/**
 * Get user profile with stats by ID - no caching for profile data since it changes frequently
 */
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    const supabase = await createClient();
    
    // Get user basic info
    const user = await getUserByIdInternal(userId);
    if (!user) return null;

    // Get counts in parallel
    const [
      { count: followersCount },
      { count: followingCount },
      { count: carsCount },
      { count: clubsCount },
      { count: eventsCount }
    ] = await Promise.all([
      supabase.from('user_follows').select('*', { count: 'exact', head: true }).eq('following_id', userId),
      supabase.from('user_follows').select('*', { count: 'exact', head: true }).eq('follower_id', userId),
      supabase.from('cars').select('*', { count: 'exact', head: true }).eq('owner_id', userId),
      supabase.from('club_members').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('events').select('*', { count: 'exact', head: true }).eq('host_id', userId)
    ]);

    return {
      ...user,
      followersCount: followersCount || 0,
      followingCount: followingCount || 0,
      carsCount: carsCount || 0,
      clubsCount: clubsCount || 0,
      eventsCount: eventsCount || 0,
    };
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
};

/**
 * Get user profile by username - no caching for profile data since it changes frequently
 */
export const getUserProfileByUsername = async (username: string): Promise<UserProfile | null> => {
  try {
    // First get the user by username
    const user = await getUserByUsername(username);
    if (!user) return null;

    // Then get their full profile using their ID
    return await getUserProfile(user.id);
  } catch (error) {
    console.error('Error getting user profile by username:', error);
    return null;
  }
};

/**
 * Get user followers - no caching for dynamic social data
 */
export const getUserFollowers = async (userId: string): Promise<User[]> => {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('user_follows')
      .select(`
        follower:users!user_follows_follower_id_fkey (
          id,
          username,
          display_name,
          profile_image_url
        )
      `)
      .eq('following_id', userId);

    if (error) {
      console.error('Error getting user followers:', error);
      return [];
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data as any[])?.map((item) => ({
      id: item.follower.id,
      username: item.follower.username,
      display_name: item.follower.display_name || item.follower.username,
      email: '',
      profile_image_url: item.follower.profile_image_url,
      created_at: '',
      updated_at: '',
    })) || [];
  } catch (error) {
    console.error('Error getting user followers:', error);
    return [];
  }
};

/**
 * Get user following - no caching for dynamic social data
 */
export const getUserFollowing = async (userId: string): Promise<User[]> => {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('user_follows')
      .select(`
        following:users!user_follows_following_id_fkey (
          id,
          username,
          display_name,
          profile_image_url
        )
      `)
      .eq('follower_id', userId);

    if (error) {
      console.error('Error getting user following:', error);
      return [];
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data as any[])?.map((item) => ({
      id: item.following.id,
      username: item.following.username,
      display_name: item.following.display_name || item.following.username,
      email: '',
      profile_image_url: item.following.profile_image_url,
      created_at: '',
      updated_at: '',
    })) || [];
  } catch (error) {
    console.error('Error getting user following:', error);
    return [];
  }
};

/**
 * Check if user is following another user - no caching for dynamic social data
 */
export const isFollowing = async (followerId: string, followingId: string): Promise<boolean> => {
  try {
    const supabase = await createClient();
    const { count } = await supabase
      .from('user_follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', followerId)
      .eq('following_id', followingId);

    return (count || 0) > 0;
  } catch (error) {
    console.error('Error checking follow status:', error);
    return false;
  }
};

/**
 * Server actions for profile mutations
 */

/**
 * Follow a user
 */
export async function followUser(followerId: string, followingId: string): Promise<boolean> {
  try {
    const supabase = await createClient();
    
    const { error } = await supabase
      .from('user_follows')
      .insert({
        follower_id: followerId,
        following_id: followingId,
      });

    if (error) {
      console.error('Error following user:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error following user:', error);
    return false;
  }
}

/**
 * Unfollow a user
 */
export async function unfollowUser(followerId: string, followingId: string): Promise<boolean> {
  try {
    const supabase = await createClient();
    
    const { error } = await supabase
      .from('user_follows')
      .delete()
      .eq('follower_id', followerId)
      .eq('following_id', followingId);

    if (error) {
      console.error('Error unfollowing user:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error unfollowing user:', error);
    return false;
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  userId: string, 
  updates: {
    username?: string;
    display_name?: string;
    profile_image_url?: string;
  }
): Promise<User | null> {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('users')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating user profile:', error);
      
      // Check for specific error types
      if (error.code === '23505' && error.message.includes('username')) {
        console.error('Username already exists');
        throw new Error('Username already exists. Please choose a different username.');
      }
      
      return null;
    }

    if (!data) {
      console.error('No data returned from update operation');
      return null;
    }

    return {
      id: data.id,
      username: data.username,
      display_name: data.display_name || data.username,
      email: '',
      profile_image_url: data.profile_image_url,
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  } catch (error) {
    console.error('Error updating user profile:', error);
    
    // Re-throw specific errors to be handled by the server action
    if (error instanceof Error && error.message.includes('Username already exists')) {
      throw error;
    }
    
    return null;
  }
}
