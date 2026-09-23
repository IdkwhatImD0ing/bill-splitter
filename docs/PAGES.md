# Pages Documentation

This document describes all pages in the Bill Splitter application, including their routes, functionality, and implementation details.

## Page Overview

| Route | Page | Auth Required | Description |
|-------|------|---------------|-------------|
| `/` | Dashboard | Yes | Main dashboard showing all receipts |
| `/login` | Login | No | Password authentication page |
| `/receipts/new` | New Receipt | Yes | Create a new receipt |
| `/receipts/[id]` | Receipt Detail | Yes | View and manage a specific receipt |
| `/bill/[id]` | Public Bill | No | Public view of a shared bill |
| `/not-found` | 404 | No | Not found error page |

---

## Dashboard (`/`)

**File**: `app/page.tsx`

The main dashboard page displays all receipts created by the authenticated user.

### Features

- Lists all receipts sorted by date (newest first)
- Shows receipt summary (name, date, people count, total amount)
- Indicates which receipts have public sharing enabled
- Provides quick access to create new receipts
- Logout functionality

### Data Fetching

```typescript
const receipts = await getReceipts()
```

Fetches receipts with related `bill_items` and `public_links` using Supabase JOIN query.

### UI Components

- **Receipt Cards**: Clickable cards linking to receipt detail pages
- **Create Receipt CTA**: Dashed border card that links to `/receipts/new`
- **Empty State**: Displayed when no receipts exist
- **Logout Button**: Form action that calls the `logout` server action

### Metadata

```typescript
export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Manage your receipts and bill splits in one place.',
  robots: {
    index: false, // Private dashboard - not indexed
    follow: false,
  },
}
```

### Screenshot Description

The dashboard displays a gradient background with a receipt-paper pattern. The header shows the app logo and logout button. Below is a prominent "Create New Receipt" card, followed by a list of receipt cards showing:
- Receipt name
- Date
- Number of people
- Total amount
- "Shared" badge if public link exists

---

## Login Page (`/login`)

**File**: `app/login/page.tsx`

A simple password-based authentication page.

### Features

- Password input field
- Form validation
- Error message display
- Automatic redirect on success

### Authentication Flow

1. User enters password
2. Form submits to `login` server action
3. Password is validated against `AUTH_PASSWORD` env variable
4. On success: JWT token created, cookie set, redirect to `/`
5. On failure: Error message displayed

### Component Structure

```typescript
// Client component for form state management
'use client'

function SubmitButton() {
  const { pending } = useFormStatus()
  // Shows loading state during submission
}

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null)
  // Form with password input
}
```

### Error Handling

- Empty password: "Password is required"
- Wrong password: "Invalid password"

### Layout

The login page has its own layout file (`app/login/layout.tsx`) for any login-specific wrapping.

---

## New Receipt Page (`/receipts/new`)

**File**: `app/receipts/new/page.tsx`

Page for creating a new receipt with optional image upload.

### Features

- Name input (required)
- Date picker (required, defaults to today in PST)
- Notes textarea (optional)
- Image upload with drag-and-drop (optional)
- Image preview before submission
- Client-side image compression

### Form Fields

| Field | Type | Required | Default |
|-------|------|----------|---------|
| Name | Text | Yes | - |
| Date | Date | Yes | Today (PST) |
| Notes | Textarea | No | - |
| Image | File | No | - |

### Image Upload Process

1. User selects/drops image file
2. Preview displayed immediately (FileReader)
3. On form submit:
   - Image compressed client-side (max 2MB, 1920px)
   - Uploaded via `/api/upload` endpoint
   - Public URL returned
4. Receipt created with image URL
5. Redirect to `/receipts/[id]`

### State Management

```typescript
const [error, setError] = useState<string | null>(null)
const [isSubmitting, setIsSubmitting] = useState(false)
const [progress, setProgress] = useState<string | null>(null)
const [preview, setPreview] = useState<string | null>(null)
const [selectedFile, setSelectedFile] = useState<File | null>(null)
const [isDragging, setIsDragging] = useState(false)
```

### Progress States

- "Uploading image..." - During image upload
- "Creating receipt..." - During database insert

---

## Receipt Detail Page (`/receipts/[id]`)

**File**: `app/receipts/[id]/page.tsx`

The main receipt management page with full CRUD capabilities.

### Features

- View receipt image
- Upload/replace receipt image
- Edit receipt date
- Edit receipt notes
- Add bill items (people + amounts)
- Delete bill items
- Toggle paid status
- AI-powered receipt analysis
- JSON bulk import
- Generate/view public share link
- Delete receipt

### Dynamic Metadata

```typescript
export async function generateMetadata({ params }: ReceiptPageProps): Promise<Metadata> {
  const receipt = await getReceipt(id)
  return {
    title: receipt.name || 'Receipt Details',
    description: `Managing ${title} - $${totalAmount.toFixed(2)} split between ${peopleCount} people`,
    robots: { index: false, follow: false },
  }
}
```

### Page Layout

Two-column layout on large screens:

**Left Column:**
- Receipt image display
- Upload/replace image button

**Right Column:**
- Bill items card
  - Add person form
  - List of people with amounts
  - Toggle paid checkboxes
  - Delete buttons
  - Total calculation
- Notes editor
- AI Analysis panel (collapsible)
- JSON Upload panel (collapsible)

### Child Components

| Component | File | Purpose |
|-----------|------|---------|
| AddBillItemForm | `add-bill-item-form.tsx` | Form to add new person |
| ShareButton | `share-button.tsx` | Generate/copy public link |
| DeleteReceiptButton | `delete-receipt-button.tsx` | Delete receipt with confirmation |
| DeleteBillItemButton | `delete-bill-item-button.tsx` | Remove person from bill |
| EditDate | `edit-date.tsx` | Inline date editor |
| EditNotes | `edit-notes.tsx` | Notes textarea |
| JsonUpload | `json-upload.tsx` | Bulk import from JSON |
| AIAnalysis | `ai-analysis.tsx` | OpenAI receipt analysis |
| TogglePaid | `toggle-paid.tsx` | Checkbox to mark as paid |
| UploadImage | `upload-image.tsx` | Image upload button |

### Loading State

**File**: `app/receipts/[id]/loading.tsx`

Displays skeleton UI while receipt data is loading.

---

## Public Bill Page (`/bill/[id]`)

**File**: `app/bill/[id]/page.tsx`

Public, read-only view of a shared bill. No authentication required.

### Features

- Display receipt name and date
- Show all people and amounts
- Indicate paid/unpaid status
- Display total amount
- Show Zelle payment info with copy button
- Display notes (if any)
- Show receipt image (if any)
- SEO-optimized with OpenGraph tags

### Access Control

This page does NOT require authentication. The `[id]` parameter is the public link ID (not the receipt ID), ensuring:
- Only receipts with generated public links are accessible
- Original receipt ID is never exposed
- Lookup happens through `public_links` table

### Data Fetching

```typescript
const receipt = await getPublicBill(id)
// Returns null if link doesn't exist
if (!receipt) notFound()
```

### Dynamic Metadata & SEO

```typescript
export async function generateMetadata({ params }): Promise<Metadata> {
  return {
    title: receipt.name,
    description: `${title} - $${total} split between ${count} people`,
    openGraph: {
      title,
      description,
      type: 'website',
      // every receipt image, in order
      images: images.length > 0 ? images.map(url => ({ url })) : undefined,
    },
    twitter: {
      card: images.length > 0 ? 'summary_large_image' : 'summary',
      images: images.length > 0 ? [images[0]] : undefined, // Twitter shows one
    },
  }
}
```

### JSON-LD Structured Data

```typescript
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: receiptName,
  description: `Bill split for ${receiptName}`,
  breadcrumb: { /* ... */ },
}
```

### UI Elements

- **Header**: Receipt name, date, app logo
- **Bill Items Card**: List of people with amounts and paid status
- **Zelle Card**: Payment info with copy-to-clipboard button
- **Notes Card**: Displayed if notes exist
- **Receipt Image**: Displayed if image exists
- **Footer**: "Shared via Bill Splitter" branding

### Child Components

| Component | File | Purpose |
|-----------|------|---------|
| CopyZelleButton | `copy-zelle-button.tsx` | Copy Zelle number to clipboard |

---

## Not Found Page (`/not-found`)

**File**: `app/not-found.tsx`

Custom 404 error page displayed when a route doesn't exist.

### Usage

Automatically displayed by Next.js when:
- Route doesn't match any page
- `notFound()` function is called in a page

---

## Root Layout (`/layout.tsx`)

**File**: `app/layout.tsx`

The root layout wrapping all pages.

### Features

- Font loading (Geist Sans, Geist Mono)
- Global CSS import
- Error boundary wrapper
- Comprehensive metadata configuration

### Metadata Configuration

```typescript
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://taxes.art3m1s.me'),
  title: {
    default: "Bill Splitter - Split Bills Easily",
    template: "%s | Bill Splitter"
  },
  description: "Split bills and track who owes what...",
  keywords: ["bill split", "receipt", "expense sharing"],
  openGraph: { /* ... */ },
  twitter: { /* ... */ },
  robots: { /* ... */ },
  icons: { /* ... */ },
  manifest: "/manifest.webmanifest",
}
```

### Viewport Configuration

```typescript
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#c4663a" },
    { media: "(prefers-color-scheme: dark)", color: "#1a1512" },
  ],
}
```

---

## Loading State (`/loading.tsx`)

**File**: `app/loading.tsx`

Global loading component displayed during page transitions.

---

## Additional Route Files

### robots.ts

**File**: `app/robots.ts`

Generates `robots.txt` for search engine crawlers.

### sitemap.ts

**File**: `app/sitemap.ts`

Generates `sitemap.xml` for SEO.

### manifest.ts

**File**: `app/manifest.ts`

Generates PWA manifest for installable web app support.

