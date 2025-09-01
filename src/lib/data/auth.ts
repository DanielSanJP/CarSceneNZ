import { createClient } from '@/lib/utils/supabase/client'
import type { User } from '@/types/user'
import { dataCache } from './cache'

export async function getCurrentUser(): Promise<User | null> {
  const cacheKey = 'currentUser';
  const cached = dataCache.get<User>(cacheKey);
  if (cached) return cached;

  try {
    const supabase = createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return null
    }

    // Get user profile from users table
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      console.warn('User profile not found for authenticated user:', user.id)
      // Return basic user data - this should rarely happen
      const userData = {
        id: user.id,
        username: 'user', // Temporary fallback
        display_name: user.user_metadata?.display_name || user.user_metadata?.full_name || 'User',
        email: user.email || '',
        profile_image_url: user.user_metadata?.avatar_url,
        created_at: user.created_at || new Date().toISOString(),
        updated_at: user.updated_at || new Date().toISOString(),
      };
      dataCache.set(cacheKey, userData, 5 * 60 * 1000); // Cache for 5 minutes
      return userData;
    }

    const userData = {
      id: profile.id,
      username: profile.username,
      display_name: user.user_metadata?.display_name || user.user_metadata?.full_name || profile.username,
      email: user.email || '',
      profile_image_url: profile.profile_image_url,
      created_at: profile.created_at,
      updated_at: profile.updated_at,
    };

    dataCache.set(cacheKey, userData, 5 * 60 * 1000); // Cache for 5 minutes
    return userData;
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

export async function updateUserProfile(userId: string, updates: Partial<User>): Promise<User | null> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('users')
      .update({
        username: updates.username,
        display_name: updates.display_name,
        profile_image_url: updates.profile_image_url,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error updating user profile:', error)
      return null
    }

    return {
      id: data.id,
      username: data.username,
      display_name: data.display_name || data.username,
      email: data.email || '',
      profile_image_url: data.profile_image_url,
      created_at: data.created_at,
      updated_at: data.updated_at,
    }
  } catch (error) {
    console.error('Error updating user profile:', error)
    return null
  }
}

export async function getUserById(userId: string): Promise<User | null> {
  try {
    const supabase = createClient()

    // Get user profile from users table
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (profileError || !profile) {
      return null
    }

    // For now, we'll skip fetching email from auth since it's not available in client context
    // Email will be available when user is authenticated via getCurrentUser
    return {
      id: profile.id,
      username: profile.username,
      display_name: profile.username, // display_name not stored in users table
      email: '', // Email not available in this context
      profile_image_url: profile.profile_image_url,
      created_at: profile.created_at,
      updated_at: profile.updated_at,
    }
  } catch (error) {
    console.error('Error getting user by ID:', error)
    return null
  }
}

export async function getUserByUsername(username: string): Promise<User | null> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single()

    if (error || !data) {
      return null
    }

    return {
      id: data.id,
      username: data.username,
      display_name: data.username, // display_name not stored in users table
      email: '', // Email not available in this context
      profile_image_url: data.profile_image_url,
      created_at: data.created_at,
      updated_at: data.updated_at,
    }
  } catch (error) {
    console.error('Error getting user by username:', error)
    return null
  }
}

// Server Actions for Authentication
export async function loginAction(formData: FormData) {
  const supabase = createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function registerAction(formData: FormData) {
  const supabase = createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const username = formData.get('username') as string
  const displayName = formData.get('displayName') as string

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })

  if (error) {
    return { success: false, error: error.message }
  }

  // Create user profile in the users table
  if (data.user) {
    const { error: profileError } = await supabase
      .from('users')
      .insert({
        id: data.user.id,
        username,
        email,
        display_name: displayName || username,
      })

    if (profileError) {
      console.error('Profile creation error:', profileError)
      return { success: false, error: 'Failed to create user profile' }
    }
  }

  return { success: true }
}

export async function logoutAction() {
  const supabase = createClient()
  await supabase.auth.signOut()
}

export async function updateUserDisplayName(displayName: string): Promise<boolean> {
  try {
    const supabase = createClient()
    
    const { error } = await supabase.auth.updateUser({
      data: {
        display_name: displayName,
      }
    })

    if (error) {
      console.error('Error updating display name:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error updating display name:', error)
    return false
  }
}
