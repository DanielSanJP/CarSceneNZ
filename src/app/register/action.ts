'use server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/utils/supabase/server'

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { data: authData, error } = await supabase.auth.signUp(data)

  if (error) {
    redirect('/error')
  }

  // Create user profile in the users table
  if (authData.user) {
    const { error: profileError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        username: formData.get('username') as string,
        email: data.email,
        display_name: formData.get('displayName') as string || formData.get('username') as string,
      })

    if (profileError) {
      console.error('Profile creation error:', profileError)
      // You might want to handle this error differently
    }
  }

  revalidatePath('/', 'layout')
  redirect('/')
}
