"use server"

import { cache } from 'react'
import { createClient } from '@/lib/utils/supabase/server'
import { redirect } from 'next/navigation'
import type { User } from '@/types/user'

/**
 * Lightweight auth check - only validates authentication, no profile fetch
 * Use this when you only need to know if user is authenticated
 */
export const getAuthUser = cache(async () => {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    return null
  }
  
  return user // Just return Supabase auth user, no profile
})

/**
 * Require authentication (lightweight) - redirects if not authenticated
 * Use this when you need to protect a page but don't need profile data immediately
 */
export const requireAuth = cache(async () => {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    redirect('/login')
  }
  
  return user
})

/**
 * Fetch user profile data for a specific user ID
 * Use this separately when you actually need profile information
 */
export const getUserProfile = cache(async (userId: string): Promise<User | null> => {
  try {
    const supabase = await createClient()
    
    // Get auth user to ensure we have permission
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) return null

    // Fetch profile data using proper RLS
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('id, username, display_name, profile_image_url, instagram_url, facebook_url, tiktok_url, created_at, updated_at')
      .eq('id', userId)
      .single()

    if (profileError || !profile) {
      console.error("❌ Error fetching user profile:", profileError)
      return null
    }

    return {
      id: profile.id,
      username: profile.username,
      display_name: profile.display_name,
      email: authUser.email || '',
      profile_image_url: profile.profile_image_url,
      instagram_url: profile.instagram_url,
      facebook_url: profile.facebook_url,
      tiktok_url: profile.tiktok_url,
      created_at: profile.created_at,
      updated_at: profile.updated_at,
    }
  } catch (error) {
    console.error("❌ Error in getUserProfile:", error)
    return null
  }
})

/**
 * Get current user's profile (auth + profile data combined)
 * Use this only when you need both auth validation AND profile data
 */
export const getCurrentUserProfile = cache(async (): Promise<User | null> => {
  const authUser = await getAuthUser()
  if (!authUser) return null
  
  return await getUserProfile(authUser.id)
})

/**
 * Sign out the current user and redirect to home page
 */
export async function signOut() {
  const supabase = await createClient()
  
  const { error } = await supabase.auth.signOut()
  if (error) {
    return { error: error.message }
  }

  // Redirect to home page
  redirect("/")
}
