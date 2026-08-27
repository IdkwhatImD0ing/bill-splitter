'use client'

import { useCallback, useState } from 'react'
import Image from 'next/image'
import { removeReceiptImage } from '@/app/actions/receipts'
import { useAsyncMutation } from '@/lib/hooks/use-async-action'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

interface ReceiptImagesProps {
  receiptId: string
  images: string[]
}

function ReceiptImage({
  receiptId,
  url,
  index,
  total,
}: {
  receiptId: string
  url: string
  index: number
  total: number
}) {
  const { execute, isLoading, error } = useAsyncMutation(
    useCallback(async () => removeReceiptImage(receiptId, url), [receiptId, url])
  )

  return (
    <div className="space-y-1">
      <div className="relative rounded-xl overflow-hidden bg-muted group">
        <Image
          src={url}
          alt={total > 1 ? `Receipt image ${index + 1} of ${total}` : 'Receipt'}
          width={600}
          height={800}
          className="w-full h-auto max-h-[500px] object-contain"
        />

        {total > 1 && (
          <span className="absolute top-2 left-2 rounded-full bg-black/60 text-white text-xs font-medium px-2 py-0.5">
            {index + 1} / {total}
          </span>
        )}

        <Button
          type="button"
          variant="secondary"
          size="icon"
          onClick={() => execute()}
          disabled={isLoading}
          aria-label={`Remove receipt image ${index + 1}`}
          className="absolute top-2 right-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity disabled:opacity-50"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {error && (
        <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
          {error}
        </p>
      )}
    </div>
  )
}

export function ReceiptImages({ receiptId, images }: ReceiptImagesProps) {
  // Collapse long galleries so the sticky column stays a sensible height
  const [showAll, setShowAll] = useState(false)
  const visible = showAll ? images : images.slice(0, 2)
  const hidden = images.length - visible.length

  if (images.length === 0) return null

  return (
    <div className="space-y-3">
      {visible.map((url, index) => (
        <ReceiptImage
          key={url}
          receiptId={receiptId}
          url={url}
          index={index}
          total={images.length}
        />
      ))}

      {hidden > 0 && (
        <Button
          type="button"
          variant="ghost"
          className="w-full text-sm"
          onClick={() => setShowAll(true)}
        >
          Show {hidden} more {hidden === 1 ? 'image' : 'images'}
        </Button>
      )}
    </div>
  )
}
