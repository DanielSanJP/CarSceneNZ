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
    
    // Delete old profile image if it exists
    try {
      const { data: existingFiles } = await supabase.storage
        .from('profiles')
        .list('', { search: userId })
      
      if (existingFiles && existingFiles.length > 0) {
        const filesToDelete = existingFiles.map(file => file.name)
        await supabase.storage
          .from('profiles')
          .remove(filesToDelete)
        console.log('Deleted old profile images:', filesToDelete)
      }
    } catch (deleteError) {
      console.warn('Could not delete old profile images:', deleteError)
    }
    
    // Upload file to Supabase storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('profiles')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true
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
    
    return urlData.publicUrl
  } catch (error) {
    console.error('Error uploading profile image:', error)
    return null
  }
}
