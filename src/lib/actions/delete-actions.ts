'use server'

import { createClient } from '@/lib/utils/supabase/server'

/**
 * Server action for deleting a single car image from Supabase storage
 */
export async function deleteCarImageAction(imageUrl: string): Promise<{ success: boolean; error: string | null }> {
  try {
    if (!imageUrl) {
      return { success: false, error: 'Image URL is required' }
    }

    // Extract the file path from the URL
    // URL format: https://[project].supabase.co/storage/v1/object/public/cars/filename.jpg
    const urlParts = imageUrl.split('/storage/v1/object/public/cars/')
    if (urlParts.length !== 2) {
      console.error('Invalid image URL format:', imageUrl)
      return { success: false, error: 'Invalid image URL format' }
    }

    // Get the filename (remove cache-busting parameters)
    const filename = urlParts[1].split('?')[0]

    const supabase = await createClient()

    // Delete the file from Supabase storage
    const { error } = await supabase.storage
      .from('cars')
      .remove([filename])

    if (error) {
      console.error('❌ Supabase storage delete error:', error)
      return { success: false, error: error.message }
    }

    return { success: true, error: null }

  } catch (error) {
    console.error('❌ Unexpected error in deleteCarImageAction:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }
  }
}

/**
 * Server action for deleting multiple car images from Supabase storage
 */
export async function deleteMultipleCarImagesAction(imageUrls: string[]): Promise<{ 
  successCount: number; 
  failedUrls: string[]; 
  error: string | null 
}> {
  try {
    if (!imageUrls.length) {
      return { successCount: 0, failedUrls: [], error: 'No image URLs provided' }
    }

    const results = await Promise.allSettled(
      imageUrls.map(url => deleteCarImageAction(url))
    )

    let successCount = 0
    const failedUrls: string[] = []

    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value.success) {
        successCount++
      } else {
        failedUrls.push(imageUrls[index])
      }
    })

    return {
      successCount,
      failedUrls,
      error: failedUrls.length > 0 ? `Failed to delete ${failedUrls.length} images` : null
    }

  } catch (error) {
    console.error('❌ Unexpected error in deleteMultipleCarImagesAction:', error)
    return {
      successCount: 0,
      failedUrls: imageUrls,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

/**
 * Server action for cleaning up orphaned car images
 * This can be used to remove files that exist in storage but not in the database
 */
export async function cleanupOrphanedCarImagesAction(carId: string, validUrls: string[]): Promise<{
  cleanedCount: number;
  error: string | null;
}> {
  try {
    const supabase = await createClient()

    // List all files for this car in storage
    const { data: files, error: listError } = await supabase.storage
      .from('cars')
      .list('', { search: carId })

    if (listError) {
      console.error('❌ Error listing files for cleanup:', listError)
      return { cleanedCount: 0, error: listError.message }
    }

    if (!files || files.length === 0) {
      return { cleanedCount: 0, error: null }
    }

    // Extract filenames from valid URLs
    const validFilenames = validUrls.map(url => {
      const parts = url.split('/storage/v1/object/public/cars/')
      return parts.length === 2 ? parts[1].split('?')[0] : null
    }).filter(Boolean)

    // Find orphaned files (exist in storage but not in validUrls)
    const orphanedFiles = files.filter(file => 
      file.name.startsWith(carId) && !validFilenames.includes(file.name)
    )

    if (orphanedFiles.length === 0) {
      return { cleanedCount: 0, error: null }
    }

    // Delete orphaned files
    const filesToDelete = orphanedFiles.map(file => file.name)
    const { error: deleteError } = await supabase.storage
      .from('cars')
      .remove(filesToDelete)

    if (deleteError) {
      console.error('❌ Error deleting orphaned files:', deleteError)
      return { cleanedCount: 0, error: deleteError.message }
    }

    return { cleanedCount: orphanedFiles.length, error: null }

  } catch (error) {
    console.error('❌ Unexpected error in cleanupOrphanedCarImagesAction:', error)
    return {
      cleanedCount: 0,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}