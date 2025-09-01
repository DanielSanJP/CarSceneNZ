'use server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/utils/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()
  
  // Validate input
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  
  if (!email || !password) {
    throw new Error('Email and password are required')
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    console.error('Login error:', error)
    throw new Error(error.message || 'Login failed')
  }

  revalidatePath('/', 'layout')
  redirect('/')
}
