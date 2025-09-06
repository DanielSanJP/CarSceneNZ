import 'server-only'
import { createClient } from '@/lib/utils/supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'

export type StorageBucket = 'profiles' | 'cars' | 'clubs' | 'events'

export interface UploadOptions {
  bucket: StorageBucket
  resourceId: string
  file: File
  isTemp?: boolean
  fileIndex?: number // For multiple files like car images
}

export interface UploadResult {
  url: string | null
  error: string | null
}

/**
 * Generate a temporary ID for new resources before they're created
 */
export function generateTempId(): string {
  return `temp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

/**
 * Generate filename based on resource type and options
 */
function generateFileName(options: UploadOptions): string {
  const { bucket, resourceId, file, fileIndex } = options
  const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  
  switch (bucket) {
    case 'profiles':
      return `${resourceId}_profile.${fileExt}`
    case 'cars':
      const carIndex = fileIndex !== undefined ? `_${fileIndex}` : ''
      return `${resourceId}${carIndex}.${fileExt}`
    case 'clubs':
      return `${resourceId}_banner.${fileExt}`
    case 'events':
      return `${resourceId}_${Date.now()}.${fileExt}`
    default:
      return `${resourceId}.${fileExt}`
  }
}

/**
 * Remove existing files for a resource
 */
async function removeExistingFiles(
  supabase: SupabaseClient,
  bucket: StorageBucket,
  resourceId: string
): Promise<void> {
  try {
    console.log(`Removing existing files for ${bucket}/${resourceId}...`)
    
    if (bucket === 'profiles') {
      // For profiles, try to remove files with different extensions
      const possibleExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif']
      const removePromises = possibleExtensions.map(ext => 
        supabase.storage
          .from(bucket)
          .remove([`${resourceId}_profile.${ext}`])
      )
      await Promise.allSettled(removePromises)
    } else if (bucket === 'cars') {
      // For cars, list and remove all files for this car
      const { data: files } = await supabase.storage
        .from(bucket)
        .list('', { search: resourceId })
      
      if (files && files.length > 0) {
        const filesToRemove = files.map((file: { name: string }) => file.name)
        await supabase.storage.from(bucket).remove(filesToRemove)
      }
    } else {
      // For clubs and events, try to remove common patterns
      const { data: files } = await supabase.storage
        .from(bucket)
        .list('', { search: resourceId })
      
      if (files && files.length > 0) {
        const filesToRemove = files.map((file: { name: string }) => file.name)
        await supabase.storage.from(bucket).remove(filesToRemove)
      }
    }
    
    console.log(`Cleanup completed for ${bucket}/${resourceId}`)
  } catch (error) {
    console.warn(`Error during cleanup for ${bucket}/${resourceId}:`, error)
    // Continue anyway - cleanup errors shouldn't block upload
  }
}

/**
 * Upload a single image file (SERVER ONLY)
 */
export async function uploadImage(options: UploadOptions): Promise<UploadResult> {
  try {
    console.log(`Starting ${options.bucket} image upload for ${options.resourceId}`)
    console.log('File details:', { 
      name: options.file.name, 
      size: options.file.size, 
      type: options.file.type 
    })
    
    const supabase = await createClient()
    const fileName = generateFileName(options)
    console.log('Generated filename:', fileName)
    
    // Remove existing files if not a temp upload
    if (!options.isTemp) {
      await removeExistingFiles(supabase, options.bucket, options.resourceId)
    }
    
    console.log('Starting file upload...')
    
    // Upload the new file
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(options.bucket)
      .upload(fileName, options.file, {
        cacheControl: '3600',
        upsert: false
      })
    
    console.log('Upload operation completed')
    console.log('Upload data:', uploadData)
    console.log('Upload error:', uploadError)
    
    if (uploadError) {
      console.error(`${options.bucket} image upload error:`, uploadError)
      return {
        url: null,
        error: uploadError.message
      }
    }
    
    if (!uploadData) {
      console.error('No upload data returned')
      return {
        url: null,
        error: 'No upload data returned'
      }
    }
    
    console.log('Upload successful, getting public URL...')
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from(options.bucket)
      .getPublicUrl(fileName)
    
    console.log('Public URL data:', urlData)
    
    if (!urlData?.publicUrl) {
      console.error('Failed to get public URL')
      return {
        url: null,
        error: 'Failed to get public URL'
      }
    }
    
    // Add cache-busting parameter to force browser to reload the image
    const cacheBustingUrl = `${urlData.publicUrl}?v=${Date.now()}`
    console.log('Cache-busting URL:', cacheBustingUrl)
    
    return {
      url: cacheBustingUrl,
      error: null
    }
  } catch (error) {
    console.error(`Unexpected error uploading ${options.bucket} image:`, error)
    return {
      url: null,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

/**
 * Upload multiple images (for cars) - SERVER ONLY
 */
export async function uploadMultipleImages(
  files: File[],
  resourceId: string,
  bucket: StorageBucket = 'cars',
  isTemp: boolean = false
): Promise<string[]> {
  try {
    console.log(`Starting multiple ${bucket} images upload for ${resourceId}`)
    console.log('Number of files:', files.length)
    
    const uploadPromises = files.map((file, index) => 
      uploadImage({
        bucket,
        resourceId,
        file,
        isTemp,
        fileIndex: index
      })
    )
    
    const results = await Promise.all(uploadPromises)
    const successfulUrls = results
      .filter(result => result.url !== null)
      .map(result => result.url!)
    
    console.log(`All uploads completed. Successful URLs: ${successfulUrls.length}/${files.length}`)
    return successfulUrls
  } catch (error) {
    console.error(`Error uploading multiple ${bucket} images:`, error)
    return []
  }
}

/**
 * Move files from temp location to final location - SERVER ONLY
 */
export async function moveFromTemp(
  tempId: string,
  finalId: string,
  bucket: StorageBucket
): Promise<string[]> {
  try {
    console.log(`Moving ${bucket} files from temp ${tempId} to final ${finalId}`)
    
    const supabase = await createClient()
    
    // List all files with the temp ID
    const { data: files, error: listError } = await supabase.storage
      .from(bucket)
      .list('', { search: tempId })
    
    if (listError || !files) {
      console.error('Error listing temp files:', listError)
      return []
    }
    
    const movedUrls: string[] = []
    
    for (const file of files) {
      // Generate new filename with final ID
      const newFileName = file.name.replace(tempId, finalId)
      
      // Move file
      const { error: moveError } = await supabase.storage
        .from(bucket)
        .move(file.name, newFileName)
      
      if (moveError) {
        console.error(`Error moving file ${file.name}:`, moveError)
        continue
      }
      
      // Get public URL for moved file
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(newFileName)
      
      if (urlData?.publicUrl) {
        movedUrls.push(`${urlData.publicUrl}?v=${Date.now()}`)
      }
    }
    
    console.log(`Successfully moved ${movedUrls.length} files`)
    return movedUrls
  } catch (error) {
    console.error(`Error moving files from temp:`, error)
    return []
  }
}

/**
 * Delete all files for a resource - SERVER ONLY
 */
export async function deleteResourceImages(
  resourceId: string,
  bucket: StorageBucket
): Promise<boolean> {
  try {
    console.log(`Deleting all ${bucket} images for ${resourceId}`)
    
    const supabase = await createClient()
    
    // List all files for this resource
    const { data: files, error: listError } = await supabase.storage
      .from(bucket)
      .list('', { search: resourceId })
    
    if (listError || !files || files.length === 0) {
      console.log(`No files found for ${resourceId} or error:`, listError)
      return true
    }
    
    // Delete all files
    const filesToDelete = files.map((file: { name: string }) => file.name)
    const { error: deleteError } = await supabase.storage
      .from(bucket)
      .remove(filesToDelete)
    
    if (deleteError) {
      console.error(`Error deleting files for ${resourceId}:`, deleteError)
      return false
    }
    
    console.log(`Successfully deleted ${filesToDelete.length} files for ${resourceId}`)
    return true
  } catch (error) {
    console.error(`Error deleting ${bucket} images for ${resourceId}:`, error)
    return false
  }
}

// Convenience functions for specific resource types - SERVER ONLY
export const uploadProfileImage = async (file: File, userId: string): Promise<string | null> => {
  const result = await uploadImage({ bucket: 'profiles', resourceId: userId, file })
  return result.url
}

export const uploadCarImages = async (files: File[], carId: string, isTemp: boolean = false): Promise<string[]> => {
  return uploadMultipleImages(files, carId, 'cars', isTemp)
}

export const uploadClubImage = async (file: File, clubId: string, isTemp: boolean = false): Promise<string | null> => {
  const result = await uploadImage({ bucket: 'clubs', resourceId: clubId, file, isTemp })
  return result.url
}

export const uploadEventImage = async (file: File, eventId: string, isTemp: boolean = false): Promise<string | null> => {
  const result = await uploadImage({ bucket: 'events', resourceId: eventId, file, isTemp })
  return result.url
}

// Additional convenience functions for compatibility with existing code
export const generateTempCarId = generateTempId
export const generateTempClubId = generateTempId

export const preUploadCarImages = (files: File[], tempCarId: string) => 
  uploadCarImages(files, tempCarId, true)

export const moveCarImagesFromTemp = (tempId: string, finalId: string) =>
  moveFromTemp(tempId, finalId, 'cars')

export const deleteCarImages = (carId: string) =>
  deleteResourceImages(carId, 'cars')

export const uploadClubImageForCreation = async (file: File, tempId: string): Promise<string | null> => {
  const result = await uploadImage({ bucket: 'clubs', resourceId: tempId, file, isTemp: true })
  return result.url
}

export const moveClubImageFromTemp = (tempId: string, finalId: string) =>
  moveFromTemp(tempId, finalId, 'clubs')

export const deleteClubImage = (clubId: string) =>
  deleteResourceImages(clubId, 'clubs')

export const uploadEventImageForCreation = async (file: File, tempId: string): Promise<string | null> => {
  const result = await uploadImage({ bucket: 'events', resourceId: tempId, file, isTemp: true })
  return result.url
}

export const updateEventImageFileName = (tempId: string, finalId: string) =>
  moveFromTemp(tempId, finalId, 'events')

export const deleteEventImage = (eventId: string) =>
  deleteResourceImages(eventId, 'events')
