// Shared types for Receipt Split application

// Breakdown of how a bill item total was calculated (from AI analysis)
export interface BillItemBreakdown {
  items: { description: string; amount: number }[]
  subtotal: number
  tax_share?: number
  tip_share?: number
  fee_share?: number  // Service fees, surcharges (e.g., Economic Recovery Fee)
  shared_items?: { description: string; amount: number; split_with: string[] }[]
}

export interface BillItem {
  id: string
  person_name: string
  amount: number
  paid: boolean
  breakdown?: BillItemBreakdown | null
}

export interface PublicLink {
  id: string
}

export interface Receipt {
  id: string
  name: string | null
  date: string
  /** Ordered list of receipt images. Source of truth - read it via getReceiptImages(). */
  image_urls: string[] | null
  /** @deprecated Legacy single-image column, mirrors image_urls[0]. Only read as a fallback. */
  image_url: string | null
  notes: string | null
  bill_items?: BillItem[]
  public_links?: PublicLink[]
}

// Type for creating a new receipt
export interface CreateReceiptInput {
  name: string
  date: string
  image_urls?: string[]
  notes?: string
}

// Type for bulk adding bill items
export interface BulkBillItemInput {
  name: string
  amount: number
  breakdown?: BillItemBreakdown
}

