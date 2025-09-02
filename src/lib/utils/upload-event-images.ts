import { createClient } from '@/lib/utils/supabase/client'

export async function uploadEventImage(file: File, eventId: string): Promise<string | null> {
  try {
    console.log('Starting event image upload for event:', eventId)
    console.log('File details:', { name: file.name, size: file.size, type: file.type })
    
    const supabase = createClient()
    
    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${eventId}_${Date.now()}.${fileExt}`
    
    console.log('Generated filename:', fileName)
    
    // Upload file to Supabase storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('events')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })
    
    if (uploadError) {
      console.error('Event image upload error:', uploadError)
      return null
    }
    
    console.log('Upload successful:', uploadData)
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from('events')
      .getPublicUrl(fileName)
    
    console.log('Public URL generated:', urlData.publicUrl)
    
    return urlData.publicUrl
  } catch (error) {
    console.error('Error uploading event image:', error)
    return null
  }
}

export async function uploadEventImageForCreation(file: File, tempId: string): Promise<string | null> {
  try {
    console.log('Starting event image upload for creation with temp ID:', tempId)
    console.log('File details:', { name: file.name, size: file.size, type: file.type })
    
    const supabase = createClient()
    
    // Generate unique filename with temp prefix for creation flow
    const fileExt = file.name.split('.').pop()
    const fileName = `temp_${tempId}_${Date.now()}.${fileExt}`
    
    console.log('Generated filename:', fileName)
    
    // Upload file to Supabase storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('events')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })
    
    if (uploadError) {
      console.error('Event image upload error:', uploadError)
      return null
    }
    
    console.log('Upload successful:', uploadData)
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from('events')
      .getPublicUrl(fileName)
    
    console.log('Public URL generated:', urlData.publicUrl)
    
    return urlData.publicUrl
  } catch (error) {
    console.error('Error uploading event image:', error)
    return null
  }
}

export async function deleteEventImage(eventId: string): Promise<boolean> {
  try {
    console.log('Deleting event image for event:', eventId)
    
    const supabase = createClient()
    
    // List all files that match the event pattern
    const { data: files, error: listError } = await supabase.storage
      .from('events')
      .list()
    
    if (listError) {
      console.error('Error listing event images:', listError)
      return false
    }
    
    if (!files || files.length === 0) {
      console.log('No images found for event:', eventId)
      return true
    }
    
    // Find files that start with the eventId
    const eventFiles = files.filter(file => 
      file.name.startsWith(`${eventId}_`) || file.name.startsWith(`temp_${eventId}_`)
    )
    
    if (eventFiles.length === 0) {
      console.log('No matching images found for event:', eventId)
      return true
    }
    
    // Delete matching files
    const filePaths = eventFiles.map(file => file.name)
    const { error: deleteError } = await supabase.storage
      .from('events')
      .remove(filePaths)
    
    if (deleteError) {
      console.error('Error deleting event images:', deleteError)
      return false
    }
    
    console.log('Event images deleted successfully')
    return true
  } catch (error) {
    console.error('Error deleting event images:', error)
    return false
  }
}

export async function updateEventImageFileName(oldFileName: string, newEventId: string): Promise<string | null> {
  try {
    console.log('Updating event image filename from temp to actual event ID')
    
    const supabase = createClient()
    
    // Extract file extension from old filename
    const fileExt = oldFileName.split('.').pop()
    const newFileName = `${newEventId}_${Date.now()}.${fileExt}`
    
    // Move/copy the file to new name
    const { data: moveData, error: moveError } = await supabase.storage
      .from('events')
      .move(oldFileName, newFileName)
    
    if (moveError) {
      console.error('Error moving event image:', moveError)
      return null
    }
    
    console.log('Event image filename updated successfully:', moveData)
    
    // Get new public URL
    const { data: urlData } = supabase.storage
      .from('events')
      .getPublicUrl(newFileName)
    
    return urlData.publicUrl
  } catch (error) {
    console.error('Error updating event image filename:', error)
    return null
  }
}
