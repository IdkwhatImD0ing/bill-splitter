// Client-side upload helper - uploads through our API proxy
import imageCompression from 'browser-image-compression'

export interface UploadResult {
  publicUrl: string
  path: string
}

async function compressImage(file: File): Promise<File> {
  // Skip compression for non-image files or already small files
  if (!file.type.startsWith('image/') || file.size < 1024 * 1024) {
    return file
  }

  const options = {
    maxSizeMB: 2,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
  }
  return imageCompression(file, options)
}

export async function uploadImage(file: File): Promise<UploadResult> {
  // Compress image before uploading
  const compressedFile = await compressImage(file)

  const formData = new FormData()
  formData.append('file', compressedFile)

  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to upload')
  }

  return response.json()
}

// Uploads several images, reporting progress as each one finishes.
export async function uploadImages(
  files: File[],
  onProgress?: (done: number, total: number) => void
): Promise<UploadResult[]> {
  const results: UploadResult[] = []

  // Sequential so progress is meaningful and we don't hammer the API route
  for (const file of files) {
    results.push(await uploadImage(file))
    onProgress?.(results.length, files.length)
  }

  return results
}
