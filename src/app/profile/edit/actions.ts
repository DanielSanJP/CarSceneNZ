'use server'

import { requireAuth } from '@/lib/dal'
import { createClient } from '@/lib/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateProfileAction(formData: FormData) {
  console.log('Starting server-side profile update...')
  
  try {
    // Verify authentication
    const user = await requireAuth()
    console.log('Authenticated user:', user.id)

    // Extract form data
    const username = formData.get('username') as string
    const displayName = formData.get('displayName') as string
    const profileImageUrl = formData.get('profileImageUrl') as string

    console.log('Update data:', { username, displayName, profileImageUrl })

    // Validate required fields
    if (!username?.trim() || !displayName?.trim()) {
      return { 
        success: false, 
        error: 'Username and display name are required' 
      }
    }

    // Create server client
    const supabase = await createClient()

    // Check if username is already taken (if changed)
    if (username !== user.username) {
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('username', username)
        .single()

      if (existingUser && existingUser.id !== user.id) {
        return { 
          success: false, 
          error: 'Username is already taken' 
        }
      }
    }

    // Update user profile in database
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({
        username: username.trim(),
        display_name: displayName.trim(),
        profile_image_url: profileImageUrl || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
      .select()
      .single()

    if (updateError) {
      console.error('Database update error:', updateError)
      return { 
        success: false, 
        error: 'Failed to update profile in database' 
      }
    }

    console.log('Profile updated successfully:', updatedUser)

    // Revalidate relevant paths
    revalidatePath('/profile/edit')
    revalidatePath(`/profile/${updatedUser.username}`)
    revalidatePath(`/profile/${user.username}`) // In case username changed

    return { 
      success: true, 
      data: updatedUser 
    }

  } catch (error) {
    console.error('Server action error:', error)
    return { 
      success: false, 
      error: 'An unexpected error occurred' 
    }
  }
}
