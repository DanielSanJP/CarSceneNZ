import { createClient } from '@/lib/utils/supabase/client'

export async function uploadCarImages(files: File[], carId: string): Promise<string[]> {
  try {
    console.log('Starting car images upload for car:', carId)
    console.log('Number of files:', files.length)
    
    const supabase = createClient()
    const uploadedUrls: string[] = []
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      console.log(`Uploading file ${i + 1}:`, { name: file.name, size: file.size, type: file.type })
      
      // Generate unique filename with car ID folder structure
      const fileExt = file.name.split('.').pop()
      const fileName = `${carId}/image_${i + 1}_${Date.now()}.${fileExt}`
      
      console.log('Generated filename:', fileName)
      
      // Upload file to Supabase storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('cars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })
      
      if (uploadError) {
        console.error(`Car image ${i + 1} upload error:`, uploadError)
        continue // Skip this image but continue with others
      }
      
      console.log(`Upload ${i + 1} successful:`, uploadData)
      
      // Get public URL
      const { data: urlData } = supabase.storage
        .from('cars')
        .getPublicUrl(fileName)
      
      console.log(`Public URL ${i + 1} generated:`, urlData.publicUrl)
      uploadedUrls.push(urlData.publicUrl)
    }
    
    console.log('All uploads completed. URLs:', uploadedUrls)
    return uploadedUrls
  } catch (error) {
    console.error('Error uploading car images:', error)
    return []
  }
}

export async function deleteCarImages(carId: string): Promise<boolean> {
  try {
    console.log('Deleting car images for car:', carId)
    
    const supabase = createClient()
    
    // List all files in the car folder
    const { data: files, error: listError } = await supabase.storage
      .from('cars')
      .list(carId)
    
    if (listError) {
      console.error('Error listing car images:', listError)
      return false
    }
    
    if (!files || files.length === 0) {
      console.log('No images found for car:', carId)
      return true
    }
    
    // Delete all files in the folder
    const filePaths = files.map(file => `${carId}/${file.name}`)
    const { error: deleteError } = await supabase.storage
      .from('cars')
      .remove(filePaths)
    
    if (deleteError) {
      console.error('Error deleting car images:', deleteError)
      return false
    }
    
    console.log('Car images deleted successfully')
    return true
  } catch (error) {
    console.error('Error deleting car images:', error)
    return false
  }
}
