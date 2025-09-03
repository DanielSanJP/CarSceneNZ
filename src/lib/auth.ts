import { cache } from 'react'
import { createClient } from '@/lib/utils/supabase/server'
import { redirect } from 'next/navigation'
import type { User } from '@/types/user'

/**
 * Get authenticated user with profile data (cached per request)
 * Redirects to login if not authenticated
 */
export const getUser = cache(async (): Promise<User> => {
  const supabase = await createClient()
  
  // Get auth user
  const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !authUser) {
    redirect('/login')
  }

  // Get profile data
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('id, username, display_name, profile_image_url, created_at, updated_at')
    .eq('id', authUser.id)
    .single()

  if (profileError || !profile) {
    // User exists in auth but not in profile table - this shouldn't happen
    // but handle gracefully
    redirect('/login')
  }

  return {
    id: profile.id,
    username: profile.username,
    display_name: profile.display_name,
    email: authUser.email || '',
    profile_image_url: profile.profile_image_url,
    created_at: profile.created_at,
    updated_at: profile.updated_at,
  }
})

/**
 * Get authenticated user with profile data (cached per request)
 * Returns null if not authenticated (doesn't redirect)
 */
export const getUserOptional = cache(async (): Promise<User | null> => {
  const supabase = await createClient()
  
  // Get auth user
  const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !authUser) {
    return null
  }

  // Get profile data
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('id, username, display_name, profile_image_url, created_at, updated_at')
    .eq('id', authUser.id)
    .single()

  if (profileError || !profile) {
    return null
  }

  return {
    id: profile.id,
    username: profile.username,
    display_name: profile.display_name,
    email: authUser.email || '',
    profile_image_url: profile.profile_image_url,
    created_at: profile.created_at,
    updated_at: profile.updated_at,
  }
})

/**
 * Check if user is authenticated (auth only, no profile fetch)
 * Use this when you only need to check auth status
 */
export const requireAuth = cache(async () => {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    redirect('/login')
  }
  
  return user
})
