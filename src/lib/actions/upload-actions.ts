'use server'
import { uploadProfileImage, uploadCarImages, uploadClubImage, uploadEventImage } from '@/lib/utils/image-upload'

/**
 * Server action for uploading profile image
 */
export async function uploadProfileImageAction(formData: FormData): Promise<{ url: string | null; error: string | null }> {
  try {
    const file = formData.get('file') as File
    const userId = formData.get('userId') as string

    if (!file || !userId) {
      return { url: null, error: 'Missing file or user ID' }
    }

    const url = await uploadProfileImage(file, userId)
    return { url, error: null }
  } catch (error) {
    console.error('Profile image upload action error:', error)
    return { 
      url: null, 
      error: error instanceof Error ? error.message : 'Upload failed' 
    }
  }
}

/**
 * Server action for uploading car images
 */
export async function uploadCarImagesAction(formData: FormData): Promise<{ urls: string[]; error: string | null }> {
  try {
    const files = formData.getAll('files') as File[]
    const carId = formData.get('carId') as string
    const isTemp = formData.get('isTemp') === 'true'

    if (!files.length || !carId) {
      return { urls: [], error: 'Missing files or car ID' }
    }

    const urls = await uploadCarImages(files, carId, isTemp)
    return { urls, error: null }
  } catch (error) {
    console.error('Car images upload action error:', error)
    return { 
      urls: [], 
      error: error instanceof Error ? error.message : 'Upload failed' 
    }
  }
}

/**
 * Server action for uploading club image
 */
export async function uploadClubImageAction(formData: FormData): Promise<{ url: string | null; error: string | null }> {
  try {
    const file = formData.get('file') as File
    const clubId = formData.get('clubId') as string
    const isTemp = formData.get('isTemp') === 'true'

    if (!file || !clubId) {
      return { url: null, error: 'Missing file or club ID' }
    }

    const url = await uploadClubImage(file, clubId, isTemp)
    return { url, error: null }
  } catch (error) {
    console.error('Club image upload action error:', error)
    return { 
      url: null, 
      error: error instanceof Error ? error.message : 'Upload failed' 
    }
  }
}

/**
 * Server action for uploading event image
 */
export async function uploadEventImageAction(formData: FormData): Promise<{ url: string | null; error: string | null }> {
  try {
    const file = formData.get('file') as File
    const eventId = formData.get('eventId') as string
    const isTemp = formData.get('isTemp') === 'true'

    if (!file || !eventId) {
      return { url: null, error: 'Missing file or event ID' }
    }

    const url = await uploadEventImage(file, eventId, isTemp)
    return { url, error: null }
  } catch (error) {
    console.error('Event image upload action error:', error)
    return { 
      url: null, 
      error: error instanceof Error ? error.message : 'Upload failed' 
    }
  }
}
