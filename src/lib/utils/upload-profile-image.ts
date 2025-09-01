import { createClient } from '@/lib/utils/supabase/client'

export async function uploadProfileImage(file: File, userId: string): Promise<string | null> {
  try {
    console.log('Starting profile image upload for user:', userId)
    console.log('File details:', { name: file.name, size: file.size, type: file.type })
    
    const supabase = createClient()
    
    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}_${Date.now()}.${fileExt}`
    
    console.log('Generated filename:', fileName)
    
    // Upload file to Supabase storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('profiles')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })
    
    if (uploadError) {
      console.error('Profile image upload error:', uploadError)
      return null
    }
    
    console.log('Upload successful:', uploadData)
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from('profiles')
      .getPublicUrl(fileName)
    
    console.log('Public URL generated:', urlData.publicUrl)
    
    // Update user profile with image URL
    const { error: updateError } = await supabase
      .from('users')
      .update({ profile_image_url: urlData.publicUrl })
      .eq('id', userId)
    
    if (updateError) {
      console.error('Profile update error:', updateError)
      return null
    }
    
    console.log('Profile updated successfully with image URL')
    return urlData.publicUrl
  } catch (error) {
    console.error('Error uploading profile image:', error)
    return null
  }
}
