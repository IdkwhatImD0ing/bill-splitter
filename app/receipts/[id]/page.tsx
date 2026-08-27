import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getReceipt } from '@/app/actions/receipts'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Receipt } from 'lucide-react'
import { AddBillItemForm } from './add-bill-item-form'
import { ShareButton } from './share-button'
import { DeleteReceiptButton } from './delete-receipt-button'
import { BillItemRow } from './bill-item-row'
import { EditDate } from './edit-date'
import { EditNotes } from './edit-notes'
import { JsonUpload } from './json-upload'
import { AIAnalysis } from './ai-analysis'
import { UploadImage } from './upload-image'
import { ReceiptImages } from './receipt-images'
import { formatDatePST } from '@/lib/date'
import { getReceiptImages } from '@/lib/receipt-images'
import type { BillItem } from '@/lib/types'
import type { Metadata } from 'next'

interface ReceiptPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata(
  { params }: ReceiptPageProps
): Promise<Metadata> {
  const { id } = await params
  
  try {
    const receipt = await getReceipt(id)
    const title = receipt.name || 'Receipt Details'
    const totalAmount = receipt.bill_items?.reduce((sum: number, item: BillItem) => sum + item.amount, 0) || 0
    const peopleCount = receipt.bill_items?.length || 0
    const formattedDate = formatDatePST(receipt.date)
    
    const description = `Managing ${title} - $${totalAmount.toFixed(2)} split between ${peopleCount} ${peopleCount === 1 ? 'person' : 'people'} on ${formattedDate}`
    
    return {
      title,
      description,
      robots: {
        index: false, // This is a private page, don't index
        follow: false,
      },
    }
  } catch {
    return {
      title: 'Receipt Not Found',
      description: 'This receipt could not be found.',
    }
  }
}

export default async function ReceiptPage({ params }: ReceiptPageProps) {
  const { id } = await params
  
  let receipt
  try {
    receipt = await getReceipt(id)
  } catch {
    notFound()
  }

  const totalAmount = receipt.bill_items?.reduce((sum: number, item: BillItem) => sum + item.amount, 0) || 0
  const publicLinkId = receipt.public_links?.[0]?.id
  const images = getReceiptImages(receipt)

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-background to-brand-100/50 dark:from-background dark:via-brand-50/5 dark:to-background">
      <div className="absolute inset-0 bg-receipt-pattern" />
      
      <div className="relative z-10 container mx-auto py-8 px-4 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-brand-100 dark:hover:bg-brand-50/10">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gradient-brand">
                {receipt.name || 'Receipt Details'}
              </h1>
              <EditDate receiptId={id} currentDate={receipt.date} />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <ShareButton receiptId={id} existingLinkId={publicLinkId} />
            <DeleteReceiptButton receiptId={id} />
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Receipt Image */}
          <Card className="card-receipt overflow-hidden lg:sticky lg:top-8 lg:self-start">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">
                {images.length > 1 ? `Receipt Images (${images.length})` : 'Receipt Image'}
                {images.length === 0 && (
                  <span className="text-sm font-normal text-muted-foreground ml-2">(optional)</span>
                )}
              </CardTitle>
              {images.length === 0 && (
                <CardDescription>
                  You can add receipt images later, or use AI analysis without one
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              <ReceiptImages receiptId={id} images={images} />
              <UploadImage receiptId={id} hasExistingImages={images.length > 0} />
            </CardContent>
          </Card>

          {/* Bill Items */}
          <div className="space-y-4">
            <Card className="card-receipt">
              <CardHeader>
                <CardTitle className="text-lg">Who Owes What</CardTitle>
                <CardDescription>Add people and the amounts they owe</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <AddBillItemForm receiptId={id} />
                
                {receipt.bill_items && receipt.bill_items.length > 0 ? (
                  <div className="space-y-2 pt-4 border-t border-border">
                    {receipt.bill_items.map((item: BillItem) => (
                      <BillItemRow 
                        key={item.id} 
                        item={item} 
                        receiptId={id} 
                      />
                    ))}
                    
                    <div className="flex items-center justify-between pt-4 border-t-2 border-brand-200/50 dark:border-brand-400/20">
                      <span className="font-semibold text-muted-foreground">Total</span>
                      <span className="text-2xl font-bold text-brand-600 dark:text-brand-400">
                        ${totalAmount.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-4">
                    No items yet. Add people above.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Notes */}
            <EditNotes receiptId={id} currentNotes={receipt.notes} />

            {/* AI Analysis */}
            <AIAnalysis receiptId={id} imageUrls={images} currentNotes={receipt.notes} />

            {/* JSON Upload */}
            <JsonUpload receiptId={id} />
          </div>
        </div>
      </div>
    </div>
  )
}
