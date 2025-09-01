'use server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/utils/supabase/server'

export async function signup(formData: FormData) {
  const supabase = await createClient()

  // Validate required fields
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const username = formData.get('username') as string
  const displayName = formData.get('displayName') as string

  if (!email || !password || !username || !displayName) {
    throw new Error('All fields are required')
  }

  const data = {
    email,
    password,
    options: {
      data: {
        display_name: displayName,
      }
    }
  }

  const { data: authData, error } = await supabase.auth.signUp(data)

  if (error) {
    console.error('Auth signup error:', error)
    throw new Error(error.message || 'Registration failed')
  }

  if (authData.user) {
    console.log('User created successfully:', {
      id: authData.user.id,
      email: authData.user.email,
      display_name: authData.user.user_metadata?.display_name
    })

    // Create user profile in the users table first
    const userData = {
      id: authData.user.id,
      username: username,
      profile_image_url: null, // We'll update this later via client-side upload
    }

    console.log('Inserting user profile:', userData)

    const { error: profileError } = await supabase
      .from('users')
      .insert(userData)

    if (profileError) {
      console.error('Profile creation error:', profileError)
      throw new Error('Failed to create user profile')
    } else {
      console.log('User profile created successfully')
    }
  }

  revalidatePath('/', 'layout')
  redirect('/')
}
