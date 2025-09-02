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
