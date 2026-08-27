'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createReceipt } from '@/app/actions/receipts'
import { uploadImages } from '@/lib/upload'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Upload, X, ImageIcon } from 'lucide-react'
import { getTodayPST } from '@/lib/date'

interface SelectedImage {
  id: string
  file: File
  preview: string
}

export default function NewReceiptPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [progress, setProgress] = useState<string | null>(null)
  const [selectedImages, setSelectedImages] = useState<SelectedImage[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function addFiles(files: File[]) {
    const images = files.filter((file) => file.type.startsWith('image/'))

    images.forEach((file) => {
      const reader = new FileReader()
      reader.onload = (e) =>
        setSelectedImages((prev) => [
          ...prev,
          { id: `${file.name}-${file.lastModified}-${prev.length}`, file, preview: e.target?.result as string },
        ])
      reader.readAsDataURL(file)
    })
  }

  function removeImage(id: string) {
    setSelectedImages((prev) => prev.filter((image) => image.id !== id))
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    addFiles(Array.from(e.dataTransfer.files))
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    const formData = new FormData(e.currentTarget)
    const name = (formData.get('name') as string)?.trim()
    const date = formData.get('date') as string
    const notes = (formData.get('notes') as string)?.trim()

    if (!name) {
      setError('Name is required')
      setIsSubmitting(false)
      return
    }

    try {
      let imageUrls: string[] = []

      // Upload images if any were selected
      if (selectedImages.length > 0) {
        const total = selectedImages.length
        setProgress(total === 1 ? 'Uploading image...' : `Uploading image 1 of ${total}...`)

        const uploaded = await uploadImages(
          selectedImages.map((image) => image.file),
          (done) => {
            if (done < total) setProgress(`Uploading image ${done + 1} of ${total}...`)
          }
        )
        imageUrls = uploaded.map((u) => u.publicUrl)
      }

      // Create receipt
      setProgress('Creating receipt...')
      const result = await createReceipt(name, date, imageUrls, notes || undefined)

      if (result.error) {
        setError(result.error)
        setIsSubmitting(false)
        setProgress(null)
        return
      }

      // Redirect to the new receipt
      router.push(`/receipts/${result.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create receipt')
      setIsSubmitting(false)
      setProgress(null)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-background to-brand-100/50 dark:from-background dark:via-brand-50/5 dark:to-background">
      <div className="absolute inset-0 bg-receipt-pattern" />
      
      <div className="relative z-10 container mx-auto py-8 px-4 max-w-2xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/">
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-brand-100 dark:hover:bg-brand-50/10">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-gradient-brand">
            New Receipt
          </h1>
        </div>

        <Card className="card-receipt">
          <CardHeader>
            <CardTitle>Create Receipt</CardTitle>
            <CardDescription>
              Give it a name, optionally upload an image, then add people on the next page
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name (Required) */}
              <div className="space-y-2">
                <Label htmlFor="name">Name <span className="text-destructive">*</span></Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="e.g., Dinner at Joe's Pizza"
                  required
                  autoFocus
                  disabled={isSubmitting}
                  className="border-border focus:border-brand-400 focus:ring-brand-400/20"
                />
              </div>

              {/* Date (Required) */}
              <div className="space-y-2">
                <Label htmlFor="date">Date <span className="text-destructive">*</span></Label>
                <Input
                  id="date"
                  name="date"
                  type="date"
                  required
                  disabled={isSubmitting}
                  defaultValue={getTodayPST()}
                  className="border-border focus:border-brand-400 focus:ring-brand-400/20"
                />
              </div>

              {/* Notes (Optional) */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes <span className="text-muted-foreground text-sm font-normal">(optional)</span></Label>
                <textarea
                  id="notes"
                  name="notes"
                  placeholder="Add any additional notes about this receipt..."
                  rows={3}
                  disabled={isSubmitting}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-brand-400/30 focus:border-brand-400 disabled:opacity-50 resize-none transition-colors"
                />
              </div>

              {/* Image Upload (Optional) */}
              <div className="space-y-2">
                <Label>
                  Receipt Images <span className="text-muted-foreground text-sm font-normal">(optional)</span>
                </Label>

                {/* Previews of everything picked so far */}
                {selectedImages.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {selectedImages.map((image, index) => (
                      <div key={image.id} className="relative">
                        <Image
                          src={image.preview}
                          alt={`Receipt preview ${index + 1}`}
                          width={300}
                          height={400}
                          className="w-full h-32 object-cover rounded-lg border border-border"
                        />
                        <Button
                          type="button"
                          variant="secondary"
                          size="icon"
                          aria-label={`Remove image ${index + 1}`}
                          className="absolute top-1 right-1 rounded-full shadow-lg h-7 w-7"
                          disabled={isSubmitting}
                          onClick={() => removeImage(image.id)}
                        >
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                <div
                  className={`
                    relative border-2 border-dashed rounded-xl transition-all cursor-pointer
                    ${isDragging
                      ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10'
                      : 'border-border hover:border-brand-400 dark:hover:border-brand-400/50'
                    }
                    ${selectedImages.length > 0 ? 'p-4' : 'p-8'}
                    ${isSubmitting ? 'pointer-events-none opacity-50' : ''}
                  `}
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => !isSubmitting && fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    name="image"
                    accept="image/*"
                    multiple
                    className="hidden"
                    disabled={isSubmitting}
                    onChange={(e) => {
                      addFiles(Array.from(e.target.files ?? []))
                      e.target.value = ''
                    }}
                  />

                  {selectedImages.length > 0 ? (
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                      {isDragging ? (
                        <Upload className="w-5 h-5 text-brand-500" />
                      ) : (
                        <ImageIcon className="w-5 h-5" />
                      )}
                      <span className="text-sm font-medium">Add more images</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3 text-muted-foreground">
                      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                        {isDragging ? (
                          <Upload className="w-8 h-8 text-brand-500" />
                        ) : (
                          <ImageIcon className="w-8 h-8" />
                        )}
                      </div>
                      <div className="text-center">
                        <p className="font-medium">Drag and drop or click to upload</p>
                        <p className="text-sm text-muted-foreground/70">
                          PNG, JPG, WEBP up to 50MB &mdash; pick several for a multi-page receipt
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {error && (
                <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
                  {error}
                </p>
              )}

              <Button 
                type="submit" 
                className="w-full btn-brand" 
                disabled={isSubmitting}
              >
                {isSubmitting ? (progress || 'Creating...') : 'Create Receipt'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
