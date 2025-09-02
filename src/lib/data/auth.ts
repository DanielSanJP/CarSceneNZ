import { createClient } from '@/lib/utils/supabase/client'

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
