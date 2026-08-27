// Helpers for reading a receipt's images.
//
// Images live in the `image_urls` array. The legacy `image_url` column is still
// read as a fallback so receipts created before migration 003 keep rendering.

interface ReceiptImageFields {
  image_urls?: string[] | null
  image_url?: string | null
}

export function getReceiptImages(receipt: ReceiptImageFields): string[] {
  if (receipt.image_urls && receipt.image_urls.length > 0) {
    return receipt.image_urls
  }
  return receipt.image_url ? [receipt.image_url] : []
}

// Storage objects are uploaded to the bucket root, so the object name is the
// last segment of the public URL.
export function storagePathFromUrl(url: string): string {
  return url.split('/').pop() ?? ''
}
