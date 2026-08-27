'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase'
import { isAuthenticated } from '@/lib/auth'
import { getReceiptImages, storagePathFromUrl } from '@/lib/receipt-images'
import type { BillItemBreakdown } from '@/lib/types'

// Helper to ensure user is authenticated for all actions
async function requireAuth() {
  if (!(await isAuthenticated())) {
    redirect('/login')
  }
}

export async function getReceipts() {
  await requireAuth()
  
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase
    .from('receipts')
    .select(`
      *,
      bill_items (id, person_name, amount, paid, breakdown),
      public_links (id)
    `)
    .order('date', { ascending: false })

  if (error) throw error
  return data
}

export async function getReceipt(id: string) {
  await requireAuth()
  
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase
    .from('receipts')
    .select(`
      *,
      bill_items (id, person_name, amount, paid, breakdown),
      public_links (id)
    `)
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export async function createReceipt(name: string, date: string, imageUrls: string[], notes?: string) {
  await requireAuth()
  
  const supabase = createServerSupabaseClient()

  if (!name) {
    return { error: 'Name is required' }
  }

  if (!date) {
    return { error: 'Date is required' }
  }

  // Create receipt record
  const { data, error } = await supabase
    .from('receipts')
    .insert({
      image_urls: imageUrls,
      image_url: imageUrls[0] ?? null,
      name,
      date,
      notes: notes || null,
    })
    .select()
    .single()

  if (error) {
    return { error: `Failed to create receipt: ${error.message}` }
  }

  return { id: data.id }
}

export async function deleteReceipt(id: string) {
  await requireAuth()
  
  const supabase = createServerSupabaseClient()
  
  // First get the receipt to find its images
  const { data: receipt } = await supabase
    .from('receipts')
    .select('image_urls, image_url')
    .eq('id', id)
    .single()

  const images = receipt ? getReceiptImages(receipt) : []
  if (images.length > 0) {
    await supabase.storage.from('receipts').remove(images.map(storagePathFromUrl))
  }

  const { error } = await supabase
    .from('receipts')
    .delete()
    .eq('id', id)

  if (error) throw error
  
  revalidatePath('/')
  redirect('/')
}

export async function addBillItem(receiptId: string, formData: FormData) {
  await requireAuth()
  
  const supabase = createServerSupabaseClient()
  const personName = formData.get('person_name') as string
  const amount = parseFloat(formData.get('amount') as string)

  if (!personName || isNaN(amount)) {
    return { error: 'Name and amount are required' }
  }

  const { error } = await supabase
    .from('bill_items')
    .insert({ receipt_id: receiptId, person_name: personName, amount })

  if (error) {
    return { error: `Failed to add item: ${error.message}` }
  }

  revalidatePath(`/receipts/${receiptId}`)
}

export async function deleteBillItem(itemId: string, receiptId: string) {
  await requireAuth()
  
  const supabase = createServerSupabaseClient()
  const { error } = await supabase
    .from('bill_items')
    .delete()
    .eq('id', itemId)

  if (error) throw error
  
  revalidatePath(`/receipts/${receiptId}`)
}

export async function toggleBillItemPaid(itemId: string, receiptId: string, paid: boolean) {
  await requireAuth()
  
  const supabase = createServerSupabaseClient()
  const { error } = await supabase
    .from('bill_items')
    .update({ paid })
    .eq('id', itemId)

  if (error) {
    return { error: `Failed to update: ${error.message}` }
  }
  
  revalidatePath(`/receipts/${receiptId}`)
  return { success: true }
}

// Writes the image list, keeping the legacy image_url column mirrored to the
// first image so OpenGraph cards and older reads stay correct.
async function saveReceiptImages(
  supabase: ReturnType<typeof createServerSupabaseClient>,
  receiptId: string,
  images: string[]
) {
  return supabase
    .from('receipts')
    .update({ image_urls: images, image_url: images[0] ?? null })
    .eq('id', receiptId)
}

export async function addReceiptImages(receiptId: string, imageUrls: string[]) {
  await requireAuth()

  if (!imageUrls || imageUrls.length === 0) {
    return { error: 'No images provided' }
  }

  const supabase = createServerSupabaseClient()

  // Read the current list so new images are appended rather than replacing it
  const { data: receipt } = await supabase
    .from('receipts')
    .select('image_urls, image_url')
    .eq('id', receiptId)
    .single()

  const existing = receipt ? getReceiptImages(receipt) : []
  const { error } = await saveReceiptImages(supabase, receiptId, [...existing, ...imageUrls])

  if (error) {
    return { error: `Failed to add images: ${error.message}` }
  }

  revalidatePath(`/receipts/${receiptId}`)
  return { success: true }
}

export async function removeReceiptImage(receiptId: string, imageUrl: string) {
  await requireAuth()

  const supabase = createServerSupabaseClient()

  const { data: receipt } = await supabase
    .from('receipts')
    .select('image_urls, image_url')
    .eq('id', receiptId)
    .single()

  const existing = receipt ? getReceiptImages(receipt) : []
  const remaining = existing.filter(url => url !== imageUrl)

  if (remaining.length === existing.length) {
    return { error: 'Image not found on this receipt' }
  }

  const { error } = await saveReceiptImages(supabase, receiptId, remaining)

  if (error) {
    return { error: `Failed to remove image: ${error.message}` }
  }

  // Only drop the stored object once the row no longer references it
  await supabase.storage.from('receipts').remove([storagePathFromUrl(imageUrl)])

  revalidatePath(`/receipts/${receiptId}`)
  return { success: true }
}

export async function updateReceiptDate(receiptId: string, date: string) {
  await requireAuth()
  
  const supabase = createServerSupabaseClient()
  const { error } = await supabase
    .from('receipts')
    .update({ date })
    .eq('id', receiptId)

  if (error) {
    return { error: `Failed to update date: ${error.message}` }
  }
  
  revalidatePath(`/receipts/${receiptId}`)
  return { success: true }
}

export async function updateReceiptNotes(receiptId: string, notes: string) {
  await requireAuth()
  
  const supabase = createServerSupabaseClient()
  const { error } = await supabase
    .from('receipts')
    .update({ notes: notes || null })
    .eq('id', receiptId)

  if (error) {
    return { error: `Failed to update notes: ${error.message}` }
  }
  
  revalidatePath(`/receipts/${receiptId}`)
  return { success: true }
} 

export async function bulkAddBillItems(
  receiptId: string, 
  items: { name: string; amount: number; breakdown?: BillItemBreakdown }[]
) {
  await requireAuth()
  
  if (!items || items.length === 0) {
    return { error: 'No items provided' }
  }

  const supabase = createServerSupabaseClient()
  
  const billItems = items.map(item => ({
    receipt_id: receiptId,
    person_name: item.name,
    amount: item.amount,
    breakdown: item.breakdown || null,
  }))

  const { error } = await supabase
    .from('bill_items')
    .insert(billItems)

  if (error) {
    return { error: `Failed to add items: ${error.message}` }
  }

  revalidatePath(`/receipts/${receiptId}`)
  return { success: true, count: items.length }
}

export async function generatePublicLink(receiptId: string) {
  await requireAuth()
  
  const supabase = createServerSupabaseClient()
  
  // Check if link already exists
  const { data: existing } = await supabase
    .from('public_links')
    .select('id')
    .eq('receipt_id', receiptId)
    .single()

  if (existing) {
    return { id: existing.id }
  }

  // Create new public link
  const { data, error } = await supabase
    .from('public_links')
    .insert({ receipt_id: receiptId })
    .select()
    .single()

  if (error) {
    return { error: `Failed to create link: ${error.message}` }
  }

  revalidatePath(`/receipts/${receiptId}`)
  return { id: data.id }
}

// Public function - no auth required
export async function getPublicBill(linkId: string) {
  const supabase = createServerSupabaseClient()
  
  const { data: link, error: linkError } = await supabase
    .from('public_links')
    .select('receipt_id')
    .eq('id', linkId)
    .single()

  if (linkError || !link) {
    return null
  }

  const { data: receipt, error: receiptError } = await supabase
    .from('receipts')
    .select(`
      *,
      bill_items (id, person_name, amount, paid, breakdown)
    `)
    .eq('id', link.receipt_id)
    .single()

  if (receiptError) {
    return null
  }

  return receipt
}

