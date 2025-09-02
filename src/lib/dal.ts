import 'server-only'
import { cache } from 'react'
import { createClient } from '@/lib/utils/supabase/server'
import { redirect } from 'next/navigation'
import type { User } from '@/types/user'

export const verifySession = cache(async () => {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    return null
  }
  
  return { isAuth: true, userId: user.id }
})

export const getUser = cache(async (): Promise<User | null> => {
  const session = await verifySession()
  if (!session) return null
  
  try {
    const supabase = await createClient()
    
    // Get user profile from users table
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.userId)
      .single()

    if (profileError || !profile) {
      return null
    }

    return {
      id: profile.id,
      username: profile.username,
      display_name: profile.display_name || profile.username,
      email: '', // Email not available in this context
      profile_image_url: profile.profile_image_url,
      created_at: profile.created_at,
      updated_at: profile.updated_at,
    }
  } catch (error) {
    console.error('Failed to fetch user:', error)
    return null
  }
})

export const requireAuth = cache(async (): Promise<User> => {
  const user = await getUser()
  if (!user) {
    redirect('/login')
  }
  return user
})

// Get user by ID for server-side use
export const getUserById = cache(async (userId: string): Promise<User | null> => {
  try {
    const supabase = await createClient()
    
    // Get user profile from users table
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (profileError || !profile) {
      return null
    }

    return {
      id: profile.id,
      username: profile.username,
      display_name: profile.display_name || profile.username,
      email: '', // Email not available in server context
      profile_image_url: profile.profile_image_url,
      created_at: profile.created_at,
      updated_at: profile.updated_at,
    }
  } catch (error) {
    console.error('Error getting user by ID:', error)
    return null
  }
})

// Get user by username for server-side use
export const getUserByUsername = cache(async (username: string): Promise<User | null> => {
  try {
    const supabase = await createClient()

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
      display_name: data.display_name || data.username,
      email: '', // Email not available in server context
      profile_image_url: data.profile_image_url,
      created_at: data.created_at,
      updated_at: data.updated_at,
    }
  } catch (error) {
    console.error('Error getting user by username:', error)
    return null
  }
})
