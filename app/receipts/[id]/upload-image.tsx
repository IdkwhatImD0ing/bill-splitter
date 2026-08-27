'use client'

import { useState, useRef } from 'react'
import { addReceiptImages } from '@/app/actions/receipts'
import { uploadImages } from '@/lib/upload'
import { Upload, ImageIcon } from 'lucide-react'

interface UploadImageProps {
  receiptId: string
  hasExistingImages: boolean
}

export function UploadImage({ receiptId, hasExistingImages }: UploadImageProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleFileUpload(files: File[]) {
    const images = files.filter(file => file.type.startsWith('image/'))

    if (images.length === 0) {
      setError('Please upload image files')
      return
    }

    setError(null)
    setIsUploading(true)

    try {
      const label = (done: number, total: number) =>
        total === 1 ? 'Uploading image...' : `Uploading image ${done} of ${total}...`

      setProgress(label(1, images.length))
      const uploaded = await uploadImages(images, (done, total) => {
        // Show the next file that's starting, not the one that just finished
        if (done < total) setProgress(label(done + 1, total))
      })

      setProgress('Saving...')
      const result = await addReceiptImages(receiptId, uploaded.map(u => u.publicUrl))

      if (result.error) {
        setError(result.error)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setIsUploading(false)
      setProgress(null)
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileUpload(files)
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (files.length > 0) {
      handleFileUpload(files)
    }
    e.target.value = ''
  }

  const fileInput = (
    <input
      ref={fileInputRef}
      type="file"
      accept="image/*"
      multiple
      className="hidden"
      onChange={handleInputChange}
      disabled={isUploading}
    />
  )

  const dropzoneClasses = `
    relative border-2 border-dashed rounded-lg transition-all cursor-pointer
    ${isDragging
      ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/20'
      : 'border-stone-300 dark:border-stone-600 hover:border-amber-400 dark:hover:border-amber-500'
    }
  `

  const dropzoneHandlers = {
    onDragOver: (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true) },
    onDragLeave: () => setIsDragging(false),
    onDrop: handleDrop,
    onClick: () => fileInputRef.current?.click(),
  }

  const errorMessage = error && (
    <p className="text-sm text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-950/30 px-3 py-2 rounded-md">
      {error}
    </p>
  )

  // Compact horizontal layout when the receipt already has images
  if (hasExistingImages) {
    return (
      <div className="space-y-2">
        <div className={`${dropzoneClasses} px-4 py-2`} {...dropzoneHandlers}>
          {fileInput}

          <div className="flex items-center justify-center gap-3 text-stone-500">
            {isUploading ? (
              <>
                <Upload className="w-4 h-4 text-amber-500 animate-pulse" />
                <span className="text-sm">{progress || 'Uploading...'}</span>
              </>
            ) : (
              <>
                {isDragging ? (
                  <Upload className="w-4 h-4 text-amber-500" />
                ) : (
                  <ImageIcon className="w-4 h-4" />
                )}
                <span className="text-sm font-medium">Add more images</span>
                <span className="text-xs text-stone-400">or drag &amp; drop</span>
              </>
            )}
          </div>
        </div>

        {errorMessage}
      </div>
    )
  }

  // Full upload area when the receipt has no images yet
  return (
    <div className="space-y-2">
      <div className={`${dropzoneClasses} p-6`} {...dropzoneHandlers}>
        {fileInput}

        <div className="flex flex-col items-center gap-2 text-stone-500">
          {isUploading ? (
            <>
              <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center animate-pulse">
                <Upload className="w-5 h-5 text-amber-500" />
              </div>
              <span className="text-sm">{progress || 'Uploading...'}</span>
            </>
          ) : (
            <>
              <div className="w-10 h-10 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center">
                {isDragging ? (
                  <Upload className="w-5 h-5 text-amber-500" />
                ) : (
                  <ImageIcon className="w-5 h-5" />
                )}
              </div>
              <span className="text-sm font-medium">Upload receipt images</span>
              <span className="text-xs text-stone-400">Click or drag &amp; drop &mdash; you can pick several</span>
            </>
          )}
        </div>
      </div>

      {errorMessage}
    </div>
  )
}
