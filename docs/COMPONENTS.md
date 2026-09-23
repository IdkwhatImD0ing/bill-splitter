# Components Documentation

This document describes all reusable components in Bill Splitter, including base UI components and feature-specific components.

## Component Organization

```
components/
├── error-boundary.tsx    # Error boundary wrapper
└── ui/                   # Base UI components (Radix-based)
    ├── button.tsx
    ├── card.tsx
    ├── checkbox.tsx
    ├── input.tsx
    └── label.tsx

app/
├── bill/[id]/
│   └── copy-zelle-button.tsx
└── receipts/[id]/
    ├── add-bill-item-form.tsx
    ├── ai-analysis.tsx
    ├── delete-bill-item-button.tsx
    ├── delete-receipt-button.tsx
    ├── edit-date.tsx
    ├── edit-notes.tsx
    ├── json-upload.tsx
    ├── share-button.tsx
    ├── toggle-paid.tsx
    └── upload-image.tsx
```

---

## Base UI Components

These are foundational components built on Radix UI primitives with Tailwind styling.

### Button

**File**: `components/ui/button.tsx`

A flexible button component with multiple variants and sizes.

#### Variants

| Variant | Description | Usage |
|---------|-------------|-------|
| `default` | Primary solid button | Main actions |
| `destructive` | Red background | Delete actions |
| `outline` | Border only | Secondary actions |
| `secondary` | Muted background | Tertiary actions |
| `ghost` | No background | Subtle actions |
| `link` | Text link style | Navigation |

#### Sizes

| Size | Description |
|------|-------------|
| `default` | Standard size |
| `sm` | Small/compact |
| `lg` | Large/prominent |
| `icon` | Square icon button |

#### Props

```typescript
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  asChild?: boolean  // Use Radix Slot for custom element
}
```

#### Usage

```tsx
import { Button } from '@/components/ui/button'

// Primary button
<Button>Click me</Button>

// Destructive button
<Button variant="destructive">Delete</Button>

// Icon button
<Button variant="ghost" size="icon">
  <TrashIcon />
</Button>

// As a link
<Button asChild>
  <Link href="/somewhere">Go</Link>
</Button>
```

---

### Card

**File**: `components/ui/card.tsx`

A container component for grouped content.

#### Subcomponents

| Component | Purpose |
|-----------|---------|
| `Card` | Main container |
| `CardHeader` | Header section |
| `CardTitle` | Title text |
| `CardDescription` | Subtitle/description |
| `CardContent` | Main content area |
| `CardFooter` | Footer section |

#### Usage

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'

<Card>
  <CardHeader>
    <CardTitle>Receipt Name</CardTitle>
    <CardDescription>January 15, 2024</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Content goes here</p>
  </CardContent>
</Card>
```

---

### Input

**File**: `components/ui/input.tsx`

A styled text input component.

#### Props

Extends `React.InputHTMLAttributes<HTMLInputElement>`.

#### Usage

```tsx
import { Input } from '@/components/ui/input'

<Input 
  type="text" 
  placeholder="Enter name" 
  value={value}
  onChange={(e) => setValue(e.target.value)}
/>

<Input type="number" step="0.01" min="0" />
<Input type="date" />
<Input type="password" />
```

---

### Checkbox

**File**: `components/ui/checkbox.tsx`

An accessible checkbox built on Radix UI.

#### Props

```typescript
interface CheckboxProps extends Radix.CheckboxProps {
  // Inherits all Radix Checkbox props
}
```

#### Usage

```tsx
import { Checkbox } from '@/components/ui/checkbox'

<Checkbox 
  checked={isChecked}
  onCheckedChange={(checked) => setIsChecked(checked === true)}
/>

// With label
<label className="flex items-center gap-2">
  <Checkbox checked={agreed} onCheckedChange={setAgreed} />
  <span>I agree to the terms</span>
</label>
```

---

### Label

**File**: `components/ui/label.tsx`

An accessible label component built on Radix UI.

#### Usage

```tsx
import { Label } from '@/components/ui/label'

<Label htmlFor="name">Name</Label>
<Input id="name" />
```

---

## Error Boundary

**File**: `components/error-boundary.tsx`

A React error boundary component for graceful error handling.

### Features

- Catches JavaScript errors in child components
- Displays fallback UI instead of crashing
- Logs errors for debugging

### Usage

```tsx
import { ErrorBoundary } from '@/components/error-boundary'

<ErrorBoundary>
  <ComponentThatMightError />
</ErrorBoundary>
```

The ErrorBoundary wraps the entire application in `app/layout.tsx`.

---

## Feature Components

These components implement specific application features.

### AddBillItemForm

**File**: `app/receipts/[id]/add-bill-item-form.tsx`

Form for adding a person to a receipt's bill.

#### Props

```typescript
interface AddBillItemFormProps {
  receiptId: string
}
```

#### Features

- Name and amount inputs
- Form validation
- Optimistic UI updates
- Error display

#### Usage

```tsx
<AddBillItemForm receiptId={receipt.id} />
```

---

### AIAnalysis

**File**: `app/receipts/[id]/ai-analysis.tsx`

Collapsible panel for AI-powered receipt analysis.

#### Props

```typescript
interface AIAnalysisProps {
  receiptId: string
  imageUrls: string[]
  currentNotes: string | null
}
```

#### Features

- Expandable/collapsible UI
- Prompt input textarea
- Results preview with editing
- Individual item editing (name, amount)
- Item deletion
- Explanation display
- Option to save explanation to notes
- Import button

#### State

```typescript
const [isExpanded, setIsExpanded] = useState(false)
const [prompt, setPrompt] = useState('')
const [isAnalyzing, setIsAnalyzing] = useState(false)
const [isImporting, setIsImporting] = useState(false)
const [results, setResults] = useState<BillItem[] | null>(null)
const [explanation, setExplanation] = useState<string | null>(null)
const [saveToNotes, setSaveToNotes] = useState(true)
const [editingIndex, setEditingIndex] = useState<number | null>(null)
```

#### Usage

```tsx
<AIAnalysis 
  receiptId={receipt.id}
  imageUrls={getReceiptImages(receipt)}
  currentNotes={receipt.notes}
/>
```

---

### JsonUpload

**File**: `app/receipts/[id]/json-upload.tsx`

Collapsible panel for bulk importing bill items from JSON.

#### Props

```typescript
interface JsonUploadProps {
  receiptId: string
}
```

#### Features

- File upload (`.json` files)
- Text paste area
- Clipboard paste button
- JSON validation
- Flexible field name parsing
- Format example with copy button
- Error/success messages

#### Usage

```tsx
<JsonUpload receiptId={receipt.id} />
```

---

### ShareButton

**File**: `app/receipts/[id]/share-button.tsx`

Dropdown for generating and managing public share links.

#### Props

```typescript
interface ShareButtonProps {
  receiptId: string
  existingLinkId?: string
}
```

#### Features

- Generate new public link
- Display existing link
- Copy link to clipboard
- Open in new tab
- Close on outside click
- Keyboard navigation (Escape to close)
- Different states for shared/not shared

#### State

```typescript
const [linkId, setLinkId] = useState<string | null>(existingLinkId || null)
const [isOpen, setIsOpen] = useState(false)
const [isGenerating, setIsGenerating] = useState(false)
const [copied, setCopied] = useState(false)
```

#### Usage

```tsx
<ShareButton 
  receiptId={receipt.id}
  existingLinkId={receipt.public_links?.[0]?.id}
/>
```

---

### TogglePaid

**File**: `app/receipts/[id]/toggle-paid.tsx`

Checkbox for toggling a bill item's paid status.

#### Props

```typescript
interface TogglePaidProps {
  itemId: string
  receiptId: string
  paid: boolean
}
```

#### Features

- Checkbox with optimistic updates
- Loading state
- Error handling with rollback

#### Usage

```tsx
<TogglePaid 
  itemId={item.id}
  receiptId={receiptId}
  paid={item.paid}
/>
```

---

### DeleteBillItemButton

**File**: `app/receipts/[id]/delete-bill-item-button.tsx`

Button for removing a person from a receipt.

#### Props

```typescript
interface DeleteBillItemButtonProps {
  itemId: string
  receiptId: string
}
```

#### Features

- Icon button (trash)
- Loading state
- Confirmation (optional)

#### Usage

```tsx
<DeleteBillItemButton itemId={item.id} receiptId={receiptId} />
```

---

### DeleteReceiptButton

**File**: `app/receipts/[id]/delete-receipt-button.tsx`

Button for deleting an entire receipt.

#### Props

```typescript
interface DeleteReceiptButtonProps {
  receiptId: string
}
```

#### Features

- Destructive styling
- Confirmation dialog (recommended)
- Redirects after deletion

#### Usage

```tsx
<DeleteReceiptButton receiptId={receipt.id} />
```

---

### EditDate

**File**: `app/receipts/[id]/edit-date.tsx`

Inline date editor component.

#### Props

```typescript
interface EditDateProps {
  receiptId: string
  currentDate: string
}
```

#### Features

- Click to edit
- Date picker input
- Save on change/blur
- Loading state

#### Usage

```tsx
<EditDate receiptId={receipt.id} currentDate={receipt.date} />
```

---

### EditNotes

**File**: `app/receipts/[id]/edit-notes.tsx`

Expandable notes editor.

#### Props

```typescript
interface EditNotesProps {
  receiptId: string
  currentNotes: string | null
}
```

#### Features

- Textarea input
- Auto-save on blur
- Character count (optional)
- Expand/collapse UI

#### Usage

```tsx
<EditNotes receiptId={receipt.id} currentNotes={receipt.notes} />
```

---

### UploadImage

**File**: `app/receipts/[id]/upload-image.tsx`

Dropzone for adding receipt images. Images are appended, so a receipt can hold
several photos of the same bill.

#### Props

```typescript
interface UploadImageProps {
  receiptId: string
  hasExistingImages: boolean
}
```

#### Features

- File input trigger, multi-select and multi-file drag & drop
- Image compression
- Per-file upload progress ("Uploading image 2 of 3...")
- Success/error states
- Compact label once the receipt already has images

#### Usage

```tsx
<UploadImage receiptId={receipt.id} hasExistingImages={images.length > 0} />
```

---

### ReceiptImages

**File**: `app/receipts/[id]/receipt-images.tsx`

Gallery of a receipt's images, each removable. Collapses to the first two
images with a "Show N more" control so the sticky column stays a sane height.

#### Props

```typescript
interface ReceiptImagesProps {
  receiptId: string
  images: string[]
}
```

#### Usage

```tsx
<ReceiptImages receiptId={receipt.id} images={getReceiptImages(receipt)} />
```

---

### CopyZelleButton

**File**: `app/bill/[id]/copy-zelle-button.tsx`

Button for copying Zelle payment number to clipboard.

#### Props

```typescript
interface CopyZelleButtonProps {
  zelleNumber: string
}
```

#### Features

- Click to copy
- Visual feedback ("Copied!")
- Formatted phone number display

#### Usage

```tsx
<CopyZelleButton zelleNumber="4085858267" />
```

---

## Component Patterns

### Client vs Server Components

| Type | Marker | Use Case |
|------|--------|----------|
| Server Component | (none) | Data fetching, no interactivity |
| Client Component | `'use client'` | Interactivity, state, effects |

### Form Patterns

Using server actions with forms:

```tsx
// Server action form
<form action={serverAction}>
  <Input name="field" />
  <Button type="submit">Submit</Button>
</form>

// With client-side handling
'use client'
async function handleSubmit(formData: FormData) {
  const result = await serverAction(formData)
  if (result?.error) setError(result.error)
}

<form action={handleSubmit}>
  {/* ... */}
</form>
```

### Loading States

Using `useFormStatus` for button states:

```tsx
import { useFormStatus } from 'react-dom'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button disabled={pending}>
      {pending ? 'Saving...' : 'Save'}
    </Button>
  )
}
```

### Optimistic Updates

Pattern for toggle-style actions:

```tsx
const [optimisticPaid, setOptimisticPaid] = useState(paid)

async function handleToggle() {
  const newValue = !optimisticPaid
  setOptimisticPaid(newValue)  // Optimistic update
  
  const result = await toggleAction(newValue)
  if (result.error) {
    setOptimisticPaid(!newValue)  // Rollback on error
  }
}
```

---

## Styling Conventions

### Tailwind Classes

Components use Tailwind CSS with custom theme extensions:

```tsx
// Brand colors
className="text-brand-600 dark:text-brand-400"
className="bg-gradient-to-r from-brand-400 to-brand-600"

// Custom utility classes
className="card-receipt"      // Card with receipt styling
className="btn-brand"         // Primary button
className="text-gradient-brand"  // Gradient text
```

### Class Merging

Using `cn()` utility for conditional classes:

```tsx
import { cn } from '@/lib/utils'

<div className={cn(
  "base-classes",
  condition && "conditional-classes",
  className  // Allow override
)} />
```

### Dark Mode

All components support dark mode via Tailwind's `dark:` prefix:

```tsx
className="bg-white dark:bg-stone-900"
className="text-stone-800 dark:text-stone-200"
```

