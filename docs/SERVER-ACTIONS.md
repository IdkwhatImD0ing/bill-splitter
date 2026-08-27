# Server Actions Documentation

This document describes all Next.js Server Actions used in Receipt Split. Server Actions are async functions that run on the server and can be called directly from client components.

## Overview

Server actions are organized into two files:

| File | Actions | Purpose |
|------|---------|---------|
| `app/actions/auth.ts` | 2 | Authentication (login/logout) |
| `app/actions/receipts.ts` | 12 | Receipt and bill management |

---

## Authentication Actions

**File**: `app/actions/auth.ts`

### `login(formData: FormData)`

Authenticates a user with a password and creates a session.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `formData` | FormData | Contains `password` field |

**Returns:**
| Type | Description |
|------|-------------|
| `{ error: string }` | If authentication fails |
| `void` | Redirects to `/` on success |

**Flow:**
1. Extract password from form data
2. Validate password against `AUTH_PASSWORD` env variable
3. Create JWT token (7-day expiration)
4. Set HTTP-only cookie
5. Redirect to dashboard

**Example Usage:**

```tsx
// In a form component
<form action={login}>
  <input name="password" type="password" />
  <button type="submit">Login</button>
</form>
```

---

### `logout()`

Clears the authentication session and redirects to login.

**Parameters:** None

**Returns:** Redirects to `/login`

**Flow:**
1. Delete auth cookie
2. Redirect to login page

**Example Usage:**

```tsx
<form action={logout}>
  <button type="submit">Logout</button>
</form>
```

---

## Receipt Actions

**File**: `app/actions/receipts.ts`

All receipt actions (except `getPublicBill`) require authentication and will redirect to `/login` if the user is not authenticated.

### `getReceipts()`

Fetches all receipts with their bill items and public links.

**Parameters:** None

**Returns:**

```typescript
Receipt[] // Array of receipts with related data
```

**Query:**

```sql
SELECT *, bill_items (id, person_name, amount, paid), public_links (id)
FROM receipts
ORDER BY date DESC
```

**Example Usage:**

```tsx
// In a server component
const receipts = await getReceipts()
```

---

### `getReceipt(id: string)`

Fetches a single receipt by ID with all related data.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `id` | string | Receipt UUID |

**Returns:**

```typescript
Receipt // Single receipt with bill_items and public_links
```

**Throws:** Error if receipt not found

**Example Usage:**

```tsx
const receipt = await getReceipt(receiptId)
```

---

### `createReceipt(name: string, date: string, imageUrls: string[], notes?: string)`

Creates a new receipt.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `name` | string | Yes | Receipt name/title |
| `date` | string | Yes | Date in YYYY-MM-DD format |
| `imageUrls` | string[] | Yes | URLs of the receipt images (pass `[]` for none) |
| `notes` | string | No | Optional notes |

**Returns:**

```typescript
{ id: string }     // On success
{ error: string }  // On validation failure
```

**Example Usage:**

```tsx
const result = await createReceipt('Dinner', '2024-01-15', imageUrls, 'Team dinner')
if (result.error) {
  // Handle error
} else {
  // Redirect to /receipts/${result.id}
}
```

---

### `deleteReceipt(id: string)`

Deletes a receipt and its associated image from storage.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `id` | string | Receipt UUID |

**Returns:** Redirects to `/` after deletion

**Flow:**
1. Fetch receipt to get image URL
2. Delete image from Supabase Storage (if exists)
3. Delete receipt from database (cascades to bill_items and public_links)
4. Revalidate home page cache
5. Redirect to dashboard

**Example Usage:**

```tsx
<form action={() => deleteReceipt(receiptId)}>
  <button type="submit">Delete</button>
</form>
```

---

### `addBillItem(receiptId: string, formData: FormData)`

Adds a new person/amount to a receipt.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `receiptId` | string | Receipt UUID |
| `formData` | FormData | Contains `person_name` and `amount` |

**Returns:**

```typescript
{ error: string }  // On validation failure
void               // On success (page revalidated)
```

**Validation:**
- `person_name` must be non-empty string
- `amount` must be valid number

**Example Usage:**

```tsx
<form action={(formData) => addBillItem(receiptId, formData)}>
  <input name="person_name" placeholder="Name" />
  <input name="amount" type="number" step="0.01" />
  <button type="submit">Add</button>
</form>
```

---

### `deleteBillItem(itemId: string, receiptId: string)`

Removes a person from a receipt's bill.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `itemId` | string | Bill item UUID |
| `receiptId` | string | Receipt UUID (for cache revalidation) |

**Returns:** `void` (throws on error)

**Example Usage:**

```tsx
await deleteBillItem(item.id, receiptId)
```

---

### `toggleBillItemPaid(itemId: string, receiptId: string, paid: boolean)`

Toggles the paid status of a bill item.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `itemId` | string | Bill item UUID |
| `receiptId` | string | Receipt UUID |
| `paid` | boolean | New paid status |

**Returns:**

```typescript
{ success: true }   // On success
{ error: string }   // On failure
```

**Example Usage:**

```tsx
const result = await toggleBillItemPaid(itemId, receiptId, !currentPaid)
if (result.error) {
  // Handle error
}
```

---

### `addReceiptImages(receiptId: string, imageUrls: string[])`

Appends one or more images to a receipt. A receipt can hold any number of
images, which is useful when a single bill spans several photos.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `receiptId` | string | Receipt UUID |
| `imageUrls` | string[] | URLs of the newly uploaded images |

**Returns:**

```typescript
{ success: true }   // On success
{ error: string }   // On failure
```

**Flow:**
1. Fetch the receipt's current image list
2. Append the new URLs to it
3. Write `image_urls` (and mirror the first entry to the legacy `image_url`)
4. Revalidate page cache

**Example Usage:**

```tsx
const result = await addReceiptImages(receiptId, [url1, url2])
```

---

### `removeReceiptImage(receiptId: string, imageUrl: string)`

Removes a single image from a receipt and deletes it from storage.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `receiptId` | string | Receipt UUID |
| `imageUrl` | string | The image URL to remove |

**Returns:**

```typescript
{ success: true }   // On success
{ error: string }   // On failure, including when the URL isn't on the receipt
```

**Flow:**
1. Fetch the receipt's current image list
2. Drop the given URL from it and write the result
3. Delete the stored object only once the row no longer references it
4. Revalidate page cache

**Example Usage:**

```tsx
const result = await removeReceiptImage(receiptId, imageUrl)
```

---

### `updateReceiptDate(receiptId: string, date: string)`

Updates the receipt date.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `receiptId` | string | Receipt UUID |
| `date` | string | New date (YYYY-MM-DD) |

**Returns:**

```typescript
{ success: true }   // On success
{ error: string }   // On failure
```

**Example Usage:**

```tsx
const result = await updateReceiptDate(receiptId, '2024-01-20')
```

---

### `updateReceiptNotes(receiptId: string, notes: string)`

Updates or clears the receipt notes.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `receiptId` | string | Receipt UUID |
| `notes` | string | New notes (empty string clears notes) |

**Returns:**

```typescript
{ success: true }   // On success
{ error: string }   // On failure
```

**Example Usage:**

```tsx
const result = await updateReceiptNotes(receiptId, 'Team dinner at Italian place')
```

---

### `bulkAddBillItems(receiptId: string, items: { name: string; amount: number }[])`

Adds multiple people/amounts at once.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `receiptId` | string | Receipt UUID |
| `items` | Array | Array of `{ name, amount }` objects |

**Returns:**

```typescript
{ success: true, count: number }  // On success
{ error: string }                  // On failure
```

**Example Usage:**

```tsx
const items = [
  { name: 'John', amount: 25.50 },
  { name: 'Jane', amount: 30.00 }
]
const result = await bulkAddBillItems(receiptId, items)
if (result.success) {
  console.log(`Added ${result.count} people`)
}
```

---

### `generatePublicLink(receiptId: string)`

Creates a public sharing link for a receipt.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `receiptId` | string | Receipt UUID |

**Returns:**

```typescript
{ id: string }      // Public link ID
{ error: string }   // On failure
```

**Flow:**
1. Check if public link already exists for this receipt
2. If exists, return existing link ID
3. If not, create new public link
4. Revalidate page cache
5. Return link ID

**Note:** Each receipt can only have one public link (unique constraint).

**Example Usage:**

```tsx
const result = await generatePublicLink(receiptId)
if (result.id) {
  const publicUrl = `${window.location.origin}/bill/${result.id}`
}
```

---

### `getPublicBill(linkId: string)`

Fetches receipt data for public viewing. **Does NOT require authentication.**

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `linkId` | string | Public link UUID |

**Returns:**

```typescript
Receipt | null  // Receipt data or null if not found
```

**Flow:**
1. Look up public link by ID
2. If not found, return null
3. Fetch associated receipt with bill items
4. Return receipt data

**Security:** This action uses the public link ID (not receipt ID) to ensure only explicitly shared receipts are accessible.

**Example Usage:**

```tsx
// In public bill page
const receipt = await getPublicBill(linkId)
if (!receipt) {
  notFound()
}
```

---

## Authentication Helper

All protected actions use this helper:

```typescript
async function requireAuth() {
  if (!(await isAuthenticated())) {
    redirect('/login')
  }
}
```

This is called at the start of each action to ensure the user is authenticated before any database operations.

---

## Cache Revalidation

Actions that modify data call `revalidatePath()` to update the cache:

```typescript
revalidatePath('/receipts/[id]')  // After bill item changes
revalidatePath('/')               // After receipt deletion
```

This ensures the UI reflects the latest data after mutations.

---

## Error Handling Patterns

### Validation Errors

Return error object instead of throwing:

```typescript
if (!name) {
  return { error: 'Name is required' }
}
```

### Database Errors

Wrap in try-catch or check Supabase error:

```typescript
const { error } = await supabase.from('receipts').insert(...)
if (error) {
  return { error: `Failed to create: ${error.message}` }
}
```

### Critical Errors

Throw to trigger error boundary:

```typescript
if (error) throw error  // For read operations
```

---

## Type Definitions

See `lib/types.ts` for type definitions:

```typescript
interface BillItem {
  id: string
  person_name: string
  amount: number
  paid: boolean
}

interface Receipt {
  id: string
  name: string | null
  date: string
  image_urls: string[] | null  // source of truth, read via getReceiptImages()
  image_url: string | null     // deprecated, mirrors image_urls[0]
  notes: string | null
  bill_items?: BillItem[]
  public_links?: PublicLink[]
}
```

