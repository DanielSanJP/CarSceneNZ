"use server"

import { cache } from 'react'
import { createClient } from '@/lib/utils/supabase/server'
import { redirect } from 'next/navigation'
import type { User } from '@/types/user'

/**
 * Get authenticated user with profile data (cached per request)
 * Redirects to login if not authenticated
 */
export const getUser = cache(async (): Promise<User> => {
  const supabase = await createClient();
  
  // SECURE: Use getUser() not getSession() on server-side
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    redirect('/login');
  }

  // Fetch profile data using proper RLS
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('id, username, display_name, profile_image_url, created_at, updated_at')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    console.error("❌ Error fetching user profile:", profileError);
    redirect('/login');
  }

  return {
    id: profile.id,
    username: profile.username,
    display_name: profile.display_name,
    email: user.email || '',
    profile_image_url: profile.profile_image_url,
    created_at: profile.created_at,
    updated_at: profile.updated_at,
  };
})

/**
 * Get authenticated user with profile data (cached per request)
 * Returns null if not authenticated (doesn't redirect)
 */
export const getUserOptional = cache(async (): Promise<User | null> => {
  try {
    const supabase = await createClient();
    
    // SECURE: Use getUser() not getSession()
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return null;
    }

    // Fetch profile data using proper RLS
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('id, username, display_name, profile_image_url, created_at, updated_at')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      console.error("❌ Error fetching user profile:", profileError);
      return null;
    }

    return {
      id: profile.id,
      username: profile.username,
      display_name: profile.display_name,
      email: user.email || '',
      profile_image_url: profile.profile_image_url,
      created_at: profile.created_at,
      updated_at: profile.updated_at,
    };
  } catch (error) {
    console.error("❌ Error in getUserOptional:", error);
    return null;
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

/**
 * Sign out the current user and redirect to home page
 */
export async function signOut() {
  const supabase = await createClient();
  
  const { error } = await supabase.auth.signOut();
  if (error) {
    return { error: error.message };
  }

  // Redirect to home page
  redirect("/");
}
