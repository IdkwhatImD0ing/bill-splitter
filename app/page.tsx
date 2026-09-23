import Link from 'next/link'
import { getReceipts } from '@/app/actions/receipts'
import { logout } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Receipt, ExternalLink, LogOut } from 'lucide-react'
import { formatDateShortPST } from '@/lib/date'
import type { BillItem } from '@/lib/types'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Manage your receipts and bill splits in one place.',
  robots: {
    index: false, // This is a private dashboard
    follow: false,
  },
}

export default async function Dashboard() {
  const receipts = await getReceipts()

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-background to-brand-100/50 dark:from-background dark:via-brand-50/5 dark:to-background">
      <div className="absolute inset-0 bg-receipt-pattern" />
      
      <div className="relative z-10 container mx-auto py-8 px-4 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-lg shadow-brand-500/25">
              <span className="text-xl">🧾</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-gradient-brand">
              Bill Splitter
            </h1>
          </div>
          
          <form action={logout}>
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </form>
        </div>

        {/* Create Receipt Button */}
        <Link href="/receipts/new">
          <Card className="mb-6 border-dashed border-2 border-brand-300/50 dark:border-brand-400/20 bg-card/50 hover:border-brand-400 dark:hover:border-brand-400/40 hover:bg-card/80 transition-all cursor-pointer group">
            <CardContent className="flex items-center justify-center py-8">
              <div className="flex items-center gap-3 text-muted-foreground group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                <Plus className="w-6 h-6" />
                <span className="font-medium text-lg">Create New Receipt</span>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Receipts List */}
        {receipts.length === 0 ? (
          <Card className="card-receipt">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Receipt className="w-12 h-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No receipts yet</p>
              <p className="text-sm text-muted-foreground/70">Create your first receipt to get started</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {receipts.map((receipt) => {
              const totalAmount = receipt.bill_items?.reduce((sum: number, item: BillItem) => sum + item.amount, 0) || 0
              const peopleCount = receipt.bill_items?.length || 0
              const hasPublicLink = receipt.public_links && receipt.public_links.length > 0

              return (
                <Link key={receipt.id} href={`/receipts/${receipt.id}`}>
                  <Card className="card-receipt hover:shadow-xl hover:border-brand-300/60 dark:hover:border-brand-400/30 hover:-translate-y-0.5 transition-all cursor-pointer">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg text-foreground">
                            {receipt.name || 'Untitled Receipt'}
                          </CardTitle>
                          <CardDescription className="text-muted-foreground">
                            {formatDateShortPST(receipt.date)}
                          </CardDescription>
                        </div>
                        {hasPublicLink && (
                          <div className="flex items-center gap-1 text-xs text-success bg-success/10 px-2 py-1 rounded-full font-medium">
                            <ExternalLink className="w-3 h-3" />
                            <span>Shared</span>
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          {peopleCount} {peopleCount === 1 ? 'person' : 'people'}
                        </span>
                        <span className="text-xl font-bold text-brand-600 dark:text-brand-400">
                          ${totalAmount.toFixed(2)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
