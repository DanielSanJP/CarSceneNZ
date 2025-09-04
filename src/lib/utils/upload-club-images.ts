import { createClient } from '@/lib/utils/supabase/client'

export async function uploadClubImage(file: File, clubId: string): Promise<string | null> {
  try {
    console.log('Starting club image upload for club:', clubId)
    console.log('File details:', { name: file.name, size: file.size, type: file.type })
    
    const supabase = createClient()
    
    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${clubId}_banner.${fileExt}`
    
    console.log('Generated filename:', fileName)
    
    // First, try to remove existing file (ignore if it doesn't exist)
    console.log('Removing existing file if it exists...')
    const { error: removeError } = await supabase.storage
      .from('clubs')
      .remove([fileName])
    
    if (removeError) {
      console.log('Remove operation result (may not exist):', removeError)
    } else {
      console.log('Existing file removed or did not exist')
    }
    
    // Upload file to Supabase storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('clubs')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })
    
    if (uploadError) {
      console.error('Club image upload error:', uploadError)
      return null
    }
    
    console.log('Upload successful:', uploadData)
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from('clubs')
      .getPublicUrl(fileName)
    
    console.log('Public URL generated:', urlData.publicUrl)
    
    return urlData.publicUrl
  } catch (error) {
    console.error('Error uploading club image:', error)
    return null
  }
}

export async function uploadClubImageForCreation(file: File, tempId: string): Promise<string | null> {
  try {
    console.log('Starting club image upload for creation with temp ID:', tempId)
    console.log('File details:', { name: file.name, size: file.size, type: file.type })
    
    const supabase = createClient()
    
    // Generate unique filename with temp prefix for creation flow
    const fileExt = file.name.split('.').pop()
    const fileName = `temp_${tempId}_banner.${fileExt}`
    
    console.log('Generated filename:', fileName)
    
    // Upload file to Supabase storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('clubs')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })
    
    if (uploadError) {
      console.error('Club image upload error:', uploadError)
      return null
    }
    
    console.log('Upload successful:', uploadData)
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from('clubs')
      .getPublicUrl(fileName)
    
    console.log('Public URL generated:', urlData.publicUrl)
    
    return urlData.publicUrl
  } catch (error) {
    console.error('Error uploading club image:', error)
    return null
  }
}

export async function deleteClubImage(clubId: string): Promise<boolean> {
  try {
    console.log('Deleting club image for club:', clubId)
    
    const supabase = createClient()
    
    // List all files that match the club pattern
    const { data: files, error: listError } = await supabase.storage
      .from('clubs')
      .list()
    
    if (listError) {
      console.error('Error listing club images:', listError)
      return false
    }
    
    if (!files || files.length === 0) {
      console.log('No images found for club:', clubId)
      return true
    }
    
    // Find files that start with the clubId
    const clubFiles = files.filter(file => 
      file.name.startsWith(`${clubId}_`) || file.name.startsWith(`temp_${clubId}_`)
    )
    
    if (clubFiles.length === 0) {
      console.log('No matching images found for club:', clubId)
      return true
    }
    
    // Delete matching files
    const filePaths = clubFiles.map(file => file.name)
    const { error: deleteError } = await supabase.storage
      .from('clubs')
      .remove(filePaths)
    
    if (deleteError) {
      console.error('Error deleting club images:', deleteError)
      return false
    }
    
    console.log('Club images deleted successfully')
    return true
  } catch (error) {
    console.error('Error deleting club images:', error)
    return false
  }
}

export async function updateClubImageFileName(oldFileName: string, newClubId: string): Promise<string | null> {
  try {
    console.log('Updating club image filename from temp to actual club ID')
    
    const supabase = createClient()
    
    // Extract file extension from old filename
    const fileExt = oldFileName.split('.').pop()
    const newFileName = `${newClubId}_banner.${fileExt}`
    
    // Move/copy the file to new name
    const { data: moveData, error: moveError } = await supabase.storage
      .from('clubs')
      .move(oldFileName, newFileName)
    
    if (moveError) {
      console.error('Error moving club image:', moveError)
      return null
    }
    
    console.log('Club image filename updated successfully:', moveData)
    
    // Get new public URL
    const { data: urlData } = supabase.storage
      .from('clubs')
      .getPublicUrl(newFileName)
    
    return urlData.publicUrl
  } catch (error) {
    console.error('Error updating club image filename:', error)
    return null
  }
}
