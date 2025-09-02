import { createClient } from '@/lib/utils/supabase/client'
import { getCurrentUser, getUserById } from './auth'
import type { User } from '@/types/user'

export interface UserProfile extends User {
  followersCount: number
  followingCount: number
  carsCount: number
  clubsCount: number
  eventsCount: number
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const supabase = createClient()

    // Get user data
    const user = await getUserById(userId)
    if (!user) return null

    // Get followers count
    const { count: followersCount } = await supabase
      .from('user_follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', userId)

    // Get following count
    const { count: followingCount } = await supabase
      .from('user_follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', userId)

    // Get cars count
    const { count: carsCount } = await supabase
      .from('cars')
      .select('*', { count: 'exact', head: true })
      .eq('owner_id', userId)

    // Get clubs count (as member)
    const { count: clubsCount } = await supabase
      .from('club_members')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    // Get events count (as attendee)
    const { count: eventsCount } = await supabase
      .from('event_attendees')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    return {
      ...user,
      followersCount: followersCount || 0,
      followingCount: followingCount || 0,
      carsCount: carsCount || 0,
      clubsCount: clubsCount || 0,
      eventsCount: eventsCount || 0,
    }
  } catch (error) {
    console.error('Error getting user profile:', error)
    return null
  }
}

export async function getCurrentUserProfile(): Promise<UserProfile | null> {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) return null

    return await getUserProfile(currentUser.id)
  } catch (error) {
    console.error('Error getting current user profile:', error)
    return null
  }
}

export async function getUserFollowers(userId: string): Promise<User[]> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('user_follows')
      .select(`
        follower_id,
        users!user_follows_follower_id_fkey (
          id,
          username,
          profile_image_url,
          created_at,
          updated_at
        )
      `)
      .eq('following_id', userId)

    if (error) {
      console.error('Error getting user followers:', error)
      return []
    }

    return data?.map(item => {
      const user = Array.isArray(item.users) ? item.users[0] : item.users
      return {
        id: user.id,
        username: user.username,
        display_name: user.username, // display_name not stored in users table
        email: '',
        profile_image_url: user.profile_image_url,
        created_at: user.created_at,
        updated_at: user.updated_at,
      }
    }) || []
  } catch (error) {
    console.error('Error getting user followers:', error)
    return []
  }
}

export async function getUserFollowing(userId: string): Promise<User[]> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('user_follows')
      .select(`
        following_id,
        users!user_follows_following_id_fkey (
          id,
          username,
          profile_image_url,
          created_at,
          updated_at
        )
      `)
      .eq('follower_id', userId)

    if (error) {
      console.error('Error getting user following:', error)
      return []
    }

    return data?.map(item => {
      const user = Array.isArray(item.users) ? item.users[0] : item.users
      return {
        id: user.id,
        username: user.username,
        display_name: user.username, // display_name not stored in users table
        email: '',
        profile_image_url: user.profile_image_url,
        created_at: user.created_at,
        updated_at: user.updated_at,
      }
    }) || []
  } catch (error) {
    console.error('Error getting user following:', error)
    return []
  }
}

export async function followUser(followerId: string, followingId: string): Promise<boolean> {
  try {
    const supabase = createClient()

    const { error } = await supabase
      .from('user_follows')
      .insert({
        follower_id: followerId,
        following_id: followingId,
      })

    if (error) {
      console.error('Error following user:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error following user:', error)
    return false
  }
}

export async function unfollowUser(followerId: string, followingId: string): Promise<boolean> {
  try {
    const supabase = createClient()

    const { error } = await supabase
      .from('user_follows')
      .delete()
      .eq('follower_id', followerId)
      .eq('following_id', followingId)

    if (error) {
      console.error('Error unfollowing user:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error unfollowing user:', error)
    return false
  }
}

export async function isFollowing(followerId: string, followingId: string): Promise<boolean> {
  try {
    const supabase = createClient()

    const { count } = await supabase
      .from('user_follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', followerId)
      .eq('following_id', followingId)

    return (count || 0) > 0
  } catch (error) {
    console.error('Error checking follow status:', error)
    return false
  }
}

export async function updateUserProfile(
  userId: string, 
  updates: {
    username?: string
    display_name?: string
    profile_image_url?: string
  }
): Promise<User | null> {
  try {
    const supabase = createClient()

    console.log('Updating user profile:', { userId, updates })

    const { data, error } = await supabase
      .from('users')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error updating user profile:', error)
      return null
    }

    console.log('Profile update successful:', data)

    return {
      id: data.id,
      username: data.username,
      display_name: data.display_name || data.username,
      email: '', // Email not stored in users table
      profile_image_url: data.profile_image_url,
      created_at: data.created_at,
      updated_at: data.updated_at,
    }
  } catch (error) {
    console.error('Error updating user profile:', error)
    return null
  }
}

export async function getAllUsers(): Promise<User[]> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching users:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error fetching users:', error)
    return []
  }
}
