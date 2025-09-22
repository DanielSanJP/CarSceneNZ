'use client'
import imageCompression from 'browser-image-compression'

export type ResourceType = 'profile' | 'car' | 'club' | 'event'

export interface CompressionOptions {
  maxWidthOrHeight: number
  initialQuality: number
  fileType?: string
  useWebWorker?: boolean
}

// Compression presets optimized for each resource type
const COMPRESSION_PRESETS: Record<ResourceType, CompressionOptions> = {
  profile: {
    maxWidthOrHeight: 400,
    initialQuality: 0.8,
    fileType: 'image/webp',
    useWebWorker: true,
  },
  car: {
    maxWidthOrHeight: 1200,
    initialQuality: 0.85,
    fileType: 'image/webp',
    useWebWorker: true,
  },
  club: {
    maxWidthOrHeight: 1600,
    initialQuality: 0.85,
    fileType: 'image/webp',
    useWebWorker: true,
  },
  event: {
    maxWidthOrHeight: 1080,
    initialQuality: 0.85,
    fileType: 'image/webp',
    useWebWorker: true,
  },
}

export interface CompressionResult {
  file: File
  originalSize: number
  compressedSize: number
  compressionRatio: number
}

export interface CompressionProgress {
  progress: number // 0-100
  stage: 'compressing' | 'complete' | 'error'
}

/**
 * Compress a single image file for upload
 */
export async function compressImageForUpload(
  file: File,
  resourceType: ResourceType,
  onProgress?: (progress: CompressionProgress) => void
): Promise<CompressionResult> {
  try {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      throw new Error('Please select a valid image file.')
    }

    const originalSize = file.size
    const options = COMPRESSION_PRESETS[resourceType]

    onProgress?.({ progress: 10, stage: 'compressing' })

    // Compress the image
    const compressedFile = await imageCompression(file, {
      ...options,
      onProgress: (progress: number) => {
        // Map 0-100 to 10-90 to reserve space for other operations
        const mappedProgress = 10 + (progress * 0.8)
        onProgress?.({ progress: mappedProgress, stage: 'compressing' })
      },
    })

    const compressedSize = compressedFile.size
    const compressionRatio = ((originalSize - compressedSize) / originalSize) * 100

    onProgress?.({ progress: 100, stage: 'complete' })

    return {
      file: compressedFile,
      originalSize,
      compressedSize,
      compressionRatio,
    }
  } catch (error) {
    onProgress?.({ progress: 0, stage: 'error' })
    throw new Error(
      error instanceof Error ? error.message : 'Failed to compress image'
    )
  }
}

/**
 * Compress multiple image files for batch upload (e.g., car images)
 */
export async function compressMultipleImagesForUpload(
  files: File[],
  resourceType: ResourceType,
  onProgress?: (progress: CompressionProgress, fileIndex: number, total: number) => void
): Promise<CompressionResult[]> {
  const results: CompressionResult[] = []

  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    
    try {
      const result = await compressImageForUpload(
        file,
        resourceType,
        (progress) => {
          onProgress?.(progress, i, files.length)
        }
      )
      results.push(result)
    } catch (error) {
      onProgress?.({ progress: 0, stage: 'error' }, i, files.length)
      throw new Error(
        `Failed to compress image ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  return results
}

/**
 * Get human-readable file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Validate if file can be compressed (basic validation)
 */
export function validateImageFile(file: File, maxOriginalSize: number = 50 * 1024 * 1024): boolean {
  // Check file type
  if (!file.type.startsWith('image/')) {
    return false
  }

  // Check if file is not too large (50MB limit for original file)
  if (file.size > maxOriginalSize) {
    return false
  }

  return true
}

/**
 * Get compression info for display to user
 */
export function getCompressionInfo(results: CompressionResult[]): {
  totalOriginalSize: number
  totalCompressedSize: number
  averageCompressionRatio: number
  savedBytes: number
} {
  const totalOriginalSize = results.reduce((sum, result) => sum + result.originalSize, 0)
  const totalCompressedSize = results.reduce((sum, result) => sum + result.compressedSize, 0)
  const averageCompressionRatio = results.reduce((sum, result) => sum + result.compressionRatio, 0) / results.length
  const savedBytes = totalOriginalSize - totalCompressedSize

  return {
    totalOriginalSize,
    totalCompressedSize,
    averageCompressionRatio,
    savedBytes,
  }
}