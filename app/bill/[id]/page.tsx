import { notFound } from 'next/navigation'
import Image from 'next/image'
import { getPublicBill } from '@/app/actions/receipts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Receipt, StickyNote } from 'lucide-react'
import { formatDatePST } from '@/lib/date'
import { getReceiptImages } from '@/lib/receipt-images'
import { CopyZelleButton } from './copy-zelle-button'
import { BillItemDisplay } from './bill-item-display'
import type { BillItem } from '@/lib/types'
import type { Metadata } from 'next'

interface PublicBillPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata(
  { params }: PublicBillPageProps
): Promise<Metadata> {
  const { id } = await params
  const receipt = await getPublicBill(id)
  
  if (!receipt) {
    return {
      title: 'Bill Not Found',
      description: 'This bill could not be found.',
    }
  }

  const title = receipt.name || 'Bill Split'
  const totalAmount = receipt.bill_items?.reduce((sum: number, item: BillItem) => sum + item.amount, 0) || 0
  const peopleCount = receipt.bill_items?.length || 0
  const formattedDate = formatDatePST(receipt.date)
  
  const description = `${title} - $${totalAmount.toFixed(2)} split between ${peopleCount} ${peopleCount === 1 ? 'person' : 'people'} on ${formattedDate}`
  
  const images = getReceiptImages(receipt)

  const metadata: Metadata = {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      url: `/bill/${id}`,
      siteName: 'Bill Splitter',
      locale: 'en_US',
    },
    twitter: {
      card: images.length > 0 ? 'summary_large_image' : 'summary',
      title,
      description,
    },
  }

  // If there are receipt images, add them to OpenGraph and Twitter cards
  if (images.length > 0) {
    metadata.openGraph = {
      ...metadata.openGraph,
      images: images.map((url, index) => ({
        url,
        alt: images.length > 1
          ? `Receipt ${index + 1} of ${images.length} for ${title}`
          : `Receipt for ${title}`,
      })),
    }
    // Twitter only renders the first image
    metadata.twitter = {
      ...metadata.twitter,
      images: [images[0]],
    }
  }

  return metadata
}

export default async function PublicBillPage({ params }: PublicBillPageProps) {
  const { id } = await params
  const receipt = await getPublicBill(id)

  if (!receipt) {
    notFound()
  }

  const totalAmount = receipt.bill_items?.reduce((sum: number, item: BillItem) => sum + item.amount, 0) || 0
  const receiptName = receipt.name || 'Bill Split'
  const images = getReceiptImages(receipt)
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://bills.art3m1s.me'

  // JSON-LD structured data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: receiptName,
    description: `Bill split for ${receiptName} - $${totalAmount.toFixed(2)} total`,
    url: `${baseUrl}/bill/${id}`,
    isPartOf: {
      '@type': 'WebSite',
      name: 'Bill Splitter',
      url: baseUrl,
    },
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Bill Splitter',
          item: baseUrl,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: receiptName,
          item: `${baseUrl}/bill/${id}`,
        },
      ],
    },
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-background to-brand-100/50 dark:from-background dark:via-brand-50/5 dark:to-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="absolute inset-0 bg-receipt-pattern" />
      
      <div className="relative z-10 container mx-auto py-8 px-4 max-w-2xl">
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center mb-4 shadow-lg shadow-brand-500/25">
            <span className="text-3xl">🧾</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-gradient-brand">
            {receipt.name || 'Bill Split'}
          </h1>
          <p className="text-muted-foreground mt-2">
            {formatDatePST(receipt.date)}
          </p>
        </div>

        <div className="space-y-6">
          {/* Bill Items */}
          <Card className="card-receipt">
            <CardHeader>
              <CardTitle className="text-lg text-center">Who Owes What</CardTitle>
            </CardHeader>
            <CardContent>
              {receipt.bill_items && receipt.bill_items.length > 0 ? (
                <div className="space-y-3">
                  {receipt.bill_items.map((item: BillItem) => (
                    <BillItemDisplay key={item.id} item={item} />
                  ))}
                  
                  <div className="flex items-center justify-between pt-4 mt-4 border-t-2 border-brand-200/50 dark:border-brand-400/20">
                    <span className="font-bold text-muted-foreground text-lg">Total</span>
                    <span className="text-3xl font-bold text-gradient-brand">
                      ${totalAmount.toFixed(2)}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Receipt className="w-12 h-12 text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">No items in this bill yet</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Info - Zelle */}
          <Card className="card-receipt border-[#6D1ED4]/20 dark:border-[#6D1ED4]/30 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#6D1ED4]/5 to-transparent dark:from-[#6D1ED4]/10" />
            <CardHeader className="relative pb-2">
              <CardTitle className="text-lg text-center flex items-center justify-center gap-2">
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="#6D1ED4">
                  <path d="M13.559 24h-2.841a.483.483 0 0 1-.483-.483v-2.765H5.638a.667.667 0 0 1-.666-.666v-2.235a.67.67 0 0 1 .142-.412l8.139-10.382h-7.16a.667.667 0 0 1-.666-.667V4.155a.667.667 0 0 1 .666-.666h4.362V.483A.483.483 0 0 1 10.938 0h2.842a.483.483 0 0 1 .483.483v3.006h4.098a.667.667 0 0 1 .666.666v2.235a.67.67 0 0 1-.142.412l-8.139 10.382h7.616a.667.667 0 0 1 .666.667v2.235a.667.667 0 0 1-.666.666h-4.32v2.765a.483.483 0 0 1-.483.483z"/>
                </svg>
                <span>Pay with Zelle</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="relative">
              <div className="flex flex-col items-center gap-3">
                <p className="text-sm text-muted-foreground text-center">
                  Send payment to this phone number
                </p>
                <CopyZelleButton zelleNumber="4085858267" />
                <p className="text-xs text-muted-foreground/70 text-center">
                  Tap to copy • Include your name in the memo
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {receipt.notes && (
            <Card className="border-brand-200/50 dark:border-brand-400/20 bg-gradient-to-br from-brand-50/80 to-brand-100/40 dark:from-brand-50/5 dark:to-brand-100/5 shadow-lg overflow-hidden">
              <CardContent className="pt-5">
                <div className="flex gap-3">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-200/50 to-brand-300/30 dark:from-brand-400/20 dark:to-brand-500/10 flex items-center justify-center">
                      <StickyNote className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-brand-700 dark:text-brand-300 mb-1">Notes</p>
                    <p className="text-foreground/80 whitespace-pre-wrap leading-relaxed">
                      {receipt.notes}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Receipt Images */}
          {images.length > 0 && (
            <Card className="card-receipt overflow-hidden">
              <CardHeader>
                <CardTitle className="text-lg text-center">
                  {images.length > 1 ? `Receipt (${images.length} images)` : 'Receipt'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {images.map((url, index) => (
                  <div key={url} className="relative rounded-xl overflow-hidden bg-muted">
                    <Image
                      src={url}
                      alt={
                        images.length > 1
                          ? `Receipt image ${index + 1} of ${images.length} for ${receiptName} - $${totalAmount.toFixed(2)} total`
                          : `Receipt image for ${receiptName} - $${totalAmount.toFixed(2)} total`
                      }
                      width={600}
                      height={800}
                      className="w-full h-auto max-h-[600px] object-contain"
                    />
                    {images.length > 1 && (
                      <span className="absolute top-2 left-2 rounded-full bg-black/60 text-white text-xs font-medium px-2 py-0.5">
                        {index + 1} / {images.length}
                      </span>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Footer */}
          <p className="text-center text-sm text-muted-foreground pt-4">
            Shared via <span className="font-medium text-brand-600 dark:text-brand-400">Bill Splitter</span>
          </p>
        </div>
      </div>
    </div>
  )
}
