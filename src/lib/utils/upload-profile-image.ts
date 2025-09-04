import { createClient } from '@/lib/utils/supabase/client'

export async function uploadProfileImage(file: File, userId: string): Promise<string | null> {
  try {
    console.log('Starting profile image upload for user:', userId)
    console.log('File details:', { name: file.name, size: file.size, type: file.type })
    
    const supabase = createClient()
    
    // Use a consistent filename pattern
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}_profile.${fileExt}`
    
    console.log('Generated filename:', fileName)
    
    // First, try to remove existing file (ignore if it doesn't exist)
    console.log('Removing existing file if it exists...')
    
    // Try to remove potential old files with different extensions
    const possibleExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif']
    const removePromises = possibleExtensions.map(ext => 
      supabase.storage
        .from('profiles')
        .remove([`${userId}_profile.${ext}`])
    )
    
    // Wait for all removal attempts to complete (ignore errors)
    await Promise.allSettled(removePromises)
    console.log('Old profile images cleanup completed')
    
    console.log('Starting fresh file upload...')
    
    // Upload the new file
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('profiles')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })
    
    console.log('Upload operation completed')
    console.log('Upload data:', uploadData)
    console.log('Upload error:', uploadError)
    
    if (uploadError) {
      console.error('Profile image upload error:', uploadError)
      return null
    }
    
    if (!uploadData) {
      console.error('No upload data returned')
      return null
    }
    
    console.log('Upload successful, getting public URL...')
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from('profiles')
      .getPublicUrl(fileName)
    
    console.log('Public URL data:', urlData)
    
    if (!urlData?.publicUrl) {
      console.error('Failed to get public URL')
      return null
    }
    
    // Test if the URL is accessible by making a HEAD request
    try {
      const response = await fetch(urlData.publicUrl, { method: 'HEAD' })
      if (!response.ok) {
        console.warn('Image may not be publicly accessible:', response.status, response.statusText)
        console.warn('This could be a bucket policy issue, but returning URL anyway')
      } else {
        console.log('Image is publicly accessible')
      }
    } catch (fetchError) {
      console.warn('Could not verify image accessibility:', fetchError)
      console.warn('Returning URL anyway - may be network/CORS issue')
    }
    
    console.log('Public URL generated successfully:', urlData.publicUrl)
    
    // Add cache-busting parameter to force browser to reload the image
    const cacheBustingUrl = `${urlData.publicUrl}?v=${Date.now()}`
    console.log('Cache-busting URL:', cacheBustingUrl)
    
    return cacheBustingUrl
  } catch (error) {
    console.error('Unexpected error uploading profile image:', error)
    return null
  }
}
