'use client'

import { useState } from 'react'
import { bulkAddBillItems, updateReceiptNotes } from '@/app/actions/receipts'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Sparkles, ChevronDown, ChevronRight, Check, Loader2, Trash2, Edit2, FileText } from 'lucide-react'
import type { BillItemBreakdown } from '@/lib/types'

interface AIAnalysisProps {
  receiptId: string
  imageUrls: string[]
  currentNotes: string | null
}

interface BillItem {
  name: string
  amount: number
  breakdown?: BillItemBreakdown
}

export function AIAnalysis({ receiptId, imageUrls, currentNotes }: AIAnalysisProps) {
  const hasImages = imageUrls.length > 0
  const [isExpanded, setIsExpanded] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [results, setResults] = useState<BillItem[] | null>(null)
  const [explanation, setExplanation] = useState<string | null>(null)
  const [saveToNotes, setSaveToNotes] = useState(true)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editName, setEditName] = useState('')
  const [editAmount, setEditAmount] = useState('')
  const [expandedBreakdowns, setExpandedBreakdowns] = useState<Set<number>>(new Set())

  function toggleBreakdown(index: number) {
    setExpandedBreakdowns(prev => {
      const next = new Set(prev)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }
      return next
    })
  }

  async function handleAnalyze() {
    if (!prompt.trim()) {
      setError('Please enter who ordered what')
      return
    }

    setError(null)
    setSuccess(null)
    setResults(null)
    setExplanation(null)
    setIsAnalyzing(true)

    try {
      const response = await fetch('/api/analyze-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrls, prompt: prompt.trim() })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze receipt')
      }

      if (data.items && data.items.length > 0) {
        // Map API response to include breakdown data
        const itemsWithBreakdown: BillItem[] = data.items.map((item: { name: string; amount: number; breakdown?: BillItemBreakdown }) => ({
          name: item.name,
          amount: item.amount,
          breakdown: item.breakdown,
        }))
        setResults(itemsWithBreakdown)
        if (data.explanation) {
          setExplanation(data.explanation)
        }
      } else {
        setError('No items could be extracted from the receipt')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze receipt')
    } finally {
      setIsAnalyzing(false)
    }
  }

  async function handleImport() {
    if (!results || results.length === 0) return

    setIsImporting(true)
    setError(null)

    try {
      // Include breakdown data when importing
      const itemsWithBreakdown = results.map(item => ({
        name: item.name,
        amount: item.amount,
        breakdown: item.breakdown,
      }))
      const result = await bulkAddBillItems(receiptId, itemsWithBreakdown)

      if (result.error) {
        setError(result.error)
      } else {
        // Save explanation to notes if checkbox is checked
        if (saveToNotes && explanation) {
          const newNotes = currentNotes 
            ? `${currentNotes}\n\n--- AI Analysis ---\n${explanation}`
            : `--- AI Analysis ---\n${explanation}`
          await updateReceiptNotes(receiptId, newNotes)
        }

        setSuccess(`Added ${result.count} ${result.count === 1 ? 'person' : 'people'}${saveToNotes && explanation ? ' and saved explanation to notes' : ''}`)
        setResults(null)
        setExplanation(null)
        setPrompt('')
        setTimeout(() => setSuccess(null), 4000)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import items')
    } finally {
      setIsImporting(false)
    }
  }

  function startEdit(index: number) {
    if (!results) return
    setEditingIndex(index)
    setEditName(results[index].name)
    setEditAmount(results[index].amount.toString())
  }

  function saveEdit() {
    if (editingIndex === null || !results) return
    
    const amount = parseFloat(editAmount)
    if (isNaN(amount) || amount < 0) {
      setError('Please enter a valid amount')
      return
    }

    const newResults = [...results]
    newResults[editingIndex] = { name: editName.trim(), amount }
    setResults(newResults)
    setEditingIndex(null)
    setError(null)
  }

  function cancelEdit() {
    setEditingIndex(null)
    setEditName('')
    setEditAmount('')
  }

  function removeItem(index: number) {
    if (!results) return
    const newResults = results.filter((_, i) => i !== index)
    setResults(newResults.length > 0 ? newResults : null)
  }

  const totalAmount = results?.reduce((sum, item) => sum + item.amount, 0) || 0

  return (
    <div className="border border-violet-200/60 dark:border-violet-700/60 bg-gradient-to-br from-violet-50/60 to-white/60 dark:from-violet-950/20 dark:to-stone-900/60 rounded-xl overflow-hidden">
      {/* Collapsible Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-violet-500" />
          <span className="text-sm font-medium text-stone-700 dark:text-stone-300">AI Analysis</span>
          <span className="text-xs text-violet-500 dark:text-violet-400 bg-violet-100 dark:bg-violet-900/40 px-1.5 py-0.5 rounded">Beta</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-stone-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
      </button>

      {/* Expandable Content */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-violet-200/60 dark:border-violet-700/60">
          <p className="text-xs text-stone-500 dark:text-stone-400 pt-3">
            {hasImages
              ? `Describe who ordered what and AI will analyze ${imageUrls.length > 1 ? `all ${imageUrls.length} receipt images together` : 'the receipt image'} to calculate what each person owes`
              : 'No receipt image? No problem! Describe the items, prices, and who ordered what, and AI will calculate the split'
            }
          </p>

          {/* Prompt Input */}
          <div className="space-y-2">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={hasImages
                ? "e.g., John had the burger and fries. Jane had the Caesar salad. We split the appetizer nachos and added 20% tip."
                : "e.g., John had the burger ($15) and fries ($5). Jane had the Caesar salad ($12). We split the appetizer nachos ($10). Tax was $3.50 and we added 20% tip."
              }
              disabled={isAnalyzing || isImporting}
              className="w-full h-24 px-3 py-2 text-sm bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-600 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 disabled:opacity-50 placeholder:text-stone-400"
            />
            
            <Button
              onClick={handleAnalyze}
              disabled={isAnalyzing || isImporting || !prompt.trim()}
              className="w-full bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Analyze Receipt
                </>
              )}
            </Button>
          </div>

          {/* Results Preview */}
          {results && results.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-violet-200/60 dark:border-violet-700/60">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-stone-700 dark:text-stone-300">
                  Results Preview
                </span>
                <span className="text-xs text-stone-500">
                  Click to edit
                </span>
              </div>

              <div className="space-y-1.5">
                {results.map((item, index) => (
                  <div
                    key={index}
                    className="rounded-lg bg-white/80 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 overflow-hidden"
                  >
                    <div className="flex items-center justify-between py-2 px-3">
                      {editingIndex === index ? (
                        <div className="flex-1 flex items-center gap-2">
                          <Input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="h-8 text-sm flex-1"
                            placeholder="Name"
                          />
                          <Input
                            value={editAmount}
                            onChange={(e) => setEditAmount(e.target.value)}
                            type="number"
                            step="0.01"
                            className="h-8 text-sm w-24"
                            placeholder="Amount"
                          />
                          <Button size="sm" variant="ghost" onClick={saveEdit} className="h-8 px-2">
                            <Check className="w-4 h-4 text-green-500" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={cancelEdit} className="h-8 px-2">
                            ✕
                          </Button>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => toggleBreakdown(index)}
                              className="p-0.5 hover:bg-stone-200 dark:hover:bg-stone-700 rounded transition-colors"
                            >
                              {expandedBreakdowns.has(index) ? (
                                <ChevronDown className="w-4 h-4 text-stone-500" />
                              ) : (
                                <ChevronRight className={`w-4 h-4 ${item.breakdown ? 'text-stone-500' : 'text-amber-500'}`} />
                              )}
                            </button>
                            <span 
                              className="font-medium text-stone-700 dark:text-stone-200 cursor-pointer hover:text-violet-600 dark:hover:text-violet-400"
                              onClick={() => startEdit(index)}
                            >
                              {item.name}
                            </span>
                            {!item.breakdown && (
                              <span className="text-xs text-amber-500" title="Breakdown not available">⚠</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span 
                              className="text-lg font-semibold text-stone-800 dark:text-stone-100 cursor-pointer hover:text-violet-600 dark:hover:text-violet-400"
                              onClick={() => startEdit(index)}
                            >
                              ${item.amount.toFixed(2)}
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => startEdit(index)}
                              className="h-7 w-7 p-0 opacity-50 hover:opacity-100"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeItem(index)}
                              className="h-7 w-7 p-0 text-red-500 opacity-50 hover:opacity-100"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                    
                    {/* Breakdown dropdown */}
                    {expandedBreakdowns.has(index) && (
                      <div className="px-3 pb-3 pt-1 border-t border-stone-200 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-900/50">
                        {!item.breakdown ? (
                          <p className="text-xs text-amber-600 dark:text-amber-400 py-1">
                            Breakdown not available for this person. The AI may have calculated their total incorrectly.
                          </p>
                        ) : (
                        <div className="space-y-2 text-xs">
                          {/* Individual items */}
                          {item.breakdown.items.length > 0 && (
                            <div className="space-y-1">
                              <span className="font-medium text-stone-500 dark:text-stone-400">Items:</span>
                              {item.breakdown.items.map((breakdownItem, i) => (
                                <div key={i} className="flex justify-between text-stone-600 dark:text-stone-300 pl-2">
                                  <span>{breakdownItem.description}</span>
                                  <span>${breakdownItem.amount.toFixed(2)}</span>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {/* Shared items */}
                          {item.breakdown.shared_items && item.breakdown.shared_items.length > 0 && (
                            <div className="space-y-1">
                              <span className="font-medium text-stone-500 dark:text-stone-400">Shared:</span>
                              {item.breakdown.shared_items.map((sharedItem, i) => (
                                <div key={i} className="flex justify-between text-stone-600 dark:text-stone-300 pl-2">
                                  <span>{sharedItem.description} (split with {sharedItem.split_with.join(', ')})</span>
                                  <span>${sharedItem.amount.toFixed(2)}</span>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {/* Subtotal */}
                          <div className="flex justify-between text-stone-600 dark:text-stone-300 pt-1 border-t border-stone-200 dark:border-stone-600">
                            <span>Subtotal</span>
                            <span>${item.breakdown.subtotal.toFixed(2)}</span>
                          </div>
                          
                          {/* Tax share */}
                          {item.breakdown.tax_share !== undefined && item.breakdown.tax_share > 0 && (
                            <div className="flex justify-between text-stone-600 dark:text-stone-300">
                              <span>Tax</span>
                              <span>${item.breakdown.tax_share.toFixed(2)}</span>
                            </div>
                          )}
                          
                          {/* Fee share */}
                          {item.breakdown.fee_share !== undefined && item.breakdown.fee_share > 0 && (
                            <div className="flex justify-between text-stone-600 dark:text-stone-300">
                              <span>Fees</span>
                              <span>${item.breakdown.fee_share.toFixed(2)}</span>
                            </div>
                          )}
                          
                          {/* Tip share */}
                          {item.breakdown.tip_share !== undefined && item.breakdown.tip_share > 0 && (
                            <div className="flex justify-between text-stone-600 dark:text-stone-300">
                              <span>Tip</span>
                              <span>${item.breakdown.tip_share.toFixed(2)}</span>
                            </div>
                          )}
                        </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Total */}
              <div className="flex items-center justify-between pt-2 border-t border-stone-200 dark:border-stone-700">
                <span className="text-sm font-medium text-stone-600 dark:text-stone-400">Total</span>
                <span className="text-lg font-bold text-violet-600 dark:text-violet-400">
                  ${totalAmount.toFixed(2)}
                </span>
              </div>

              {/* Explanation */}
              {explanation && (
                <div className="space-y-2 pt-2 border-t border-stone-200 dark:border-stone-700">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-violet-500" />
                    <span className="text-sm font-medium text-stone-700 dark:text-stone-300">
                      How it was calculated
                    </span>
                  </div>
                  <div className="text-xs text-stone-600 dark:text-stone-400 bg-stone-50 dark:bg-stone-800/50 px-3 py-2 rounded-lg whitespace-pre-wrap">
                    {explanation}
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox 
                      checked={saveToNotes} 
                      onCheckedChange={(checked) => setSaveToNotes(checked === true)}
                    />
                    <span className="text-xs text-stone-600 dark:text-stone-400">
                      Save explanation to notes
                    </span>
                  </label>
                </div>
              )}

              {/* Import Button */}
              <Button
                onClick={handleImport}
                disabled={isImporting || results.length === 0}
                className="w-full bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Import {results.length} {results.length === 1 ? 'Person' : 'People'}
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <p className="text-xs text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-950/30 px-3 py-2 rounded-md">
              {error}
            </p>
          )}

          {/* Success Message */}
          {success && (
            <p className="text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-2 rounded-md flex items-center gap-2">
              <Check className="w-4 h-4" />
              {success}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

