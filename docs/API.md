# API Routes Documentation

This document describes the REST API routes available in Receipt Split. All API routes are implemented using Next.js Route Handlers.

## Overview

| Endpoint | Method | Auth Required | Description |
|----------|--------|---------------|-------------|
| `/api/upload` | POST | Yes | Upload receipt images to Supabase Storage |
| `/api/analyze-receipt` | POST | Yes | Analyze receipts using OpenAI |

---

## POST `/api/upload`

**File**: `app/api/upload/route.ts`

Uploads receipt images to Supabase Storage and returns a public URL.

### Authentication

Requires valid JWT token in `auth_token` cookie.

### Request

**Content-Type**: `multipart/form-data`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | File | Yes | Image file to upload |

### Example Request

```typescript
const formData = new FormData()
formData.append('file', file)

const response = await fetch('/api/upload', {
  method: 'POST',
  body: formData,
})
```

### Response

**Success (200)**

```json
{
  "publicUrl": "https://xxx.supabase.co/storage/v1/object/public/receipts/1234567890-abc123.jpg",
  "path": "1234567890-abc123.jpg"
}
```

**Error Responses**

| Status | Body | Cause |
|--------|------|-------|
| 401 | `{ "error": "Unauthorized" }` | Missing or invalid auth token |
| 400 | `{ "error": "No file provided" }` | No file in form data |
| 500 | `{ "error": "..." }` | Supabase upload failure |

### Implementation Details

1. **Authentication Check**: Verifies JWT token from cookie
2. **File Processing**: 
   - Extracts file from `multipart/form-data`
   - Generates unique filename: `{timestamp}-{random}.{ext}`
   - Converts File to ArrayBuffer for server-side upload
3. **Storage Upload**: Uploads to Supabase `receipts` bucket
4. **URL Generation**: Returns public URL for the uploaded file

### Code Flow

```typescript
// Verify authentication
if (!(await verifyAuth(request))) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

// Get file from form data
const formData = await request.formData()
const file = formData.get('file') as File

// Generate unique filename
const uniqueFilename = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

// Upload to Supabase
const { error } = await supabase.storage
  .from('receipts')
  .upload(uniqueFilename, buffer, { contentType: file.type })

// Return public URL
const { data: { publicUrl } } = supabase.storage
  .from('receipts')
  .getPublicUrl(uniqueFilename)
```

---

## POST `/api/analyze-receipt`

**File**: `app/api/analyze-receipt/route.ts`

Analyzes receipt images or text descriptions using OpenAI to calculate bill splits.

### Authentication

Requires valid JWT token in `auth_token` cookie.

### Request

**Content-Type**: `application/json`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `imageUrls` | string[] | No | URLs of the receipt images (from Supabase Storage). Several images are treated as pages of one bill |
| `imageUrl` | string | No | **Deprecated.** Single image URL, still accepted for older clients. Ignored when `imageUrls` is present |
| `prompt` | string | Yes | Description of who ordered what |

### Example Requests

**With Images:**

```json
{
  "imageUrls": [
    "https://xxx.supabase.co/storage/v1/object/public/receipts/page-1.jpg",
    "https://xxx.supabase.co/storage/v1/object/public/receipts/page-2.jpg"
  ],
  "prompt": "John had the burger and fries. Jane had the Caesar salad. We split the nachos and added 20% tip."
}
```

**Without Image (Text-Only):**

```json
{
  "prompt": "John had the burger ($15) and fries ($5). Jane had the Caesar salad ($12). Tax was $3.50 and we added 20% tip."
}
```

### Response

**Success (200)**

```json
{
  "success": true,
  "items": [
    { "name": "John", "amount": 28.50 },
    { "name": "Jane", "amount": 21.30 }
  ],
  "explanation": "John's subtotal: $20.00 (burger $15, fries $5)\nJane's subtotal: $12.00 (salad)\n\nShared nachos: $5 each\n\nTax split proportionally:\n- John: $2.19\n- Jane: $1.31\n\n20% tip on subtotals:\n- John: $5.31\n- Jane: $3.19\n\nFinal totals:\n- John: $28.50\n- Jane: $21.30"
}
```

**Error Responses**

| Status | Body | Cause |
|--------|------|-------|
| 401 | `{ "error": "Unauthorized" }` | Missing or invalid auth token |
| 400 | `{ "error": "Prompt is required" }` | Missing prompt field |
| 500 | `{ "error": "OpenAI API key not configured" }` | Missing `OPENAI_API_KEY` |
| 500 | `{ "error": "..." }` | OpenAI API error |

### OpenAI Configuration

**Model**: GPT-5.2  
**Reasoning**: Medium effort  
**Output Format**: Structured JSON schema

### JSON Schema for Response

```typescript
const billSplitSchema = {
  type: 'json_schema',
  name: 'bill_split',
  schema: {
    type: 'object',
    properties: {
      items: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Name of the person' },
            amount: { type: 'number', description: 'Total amount this person owes' }
          },
          required: ['name', 'amount']
        }
      },
      explanation: {
        type: 'string',
        description: 'Explanation of how the bill was split'
      }
    },
    required: ['items', 'explanation']
  },
  strict: true
}
```

### System Prompts

**Image Analysis Prompt:**

Used when at least one image is provided. Multiple images are treated as pages
or close-ups of the *same* bill, merged into one item list with duplicate lines
counted once. Instructs the AI to:
1. Identify all items across the receipt images and their prices
2. Match items to people based on the user's description
3. Calculate subtotals for each person
4. Apply tax proportionally
5. Apply tip proportionally (if present)
6. Handle shared items by splitting equally

**Text-Only Prompt:**

Used when no image is provided. Instructs the AI to:
1. Extract items and prices from the text description
2. Match items to people
3. Calculate proportional tax/tip
4. Make reasonable assumptions for missing prices

### Calculation Rules

1. Each person pays only for their assigned items
2. Shared items are split equally among sharers
3. Tax is applied proportionally: `(person_subtotal / total_subtotal) × tax`
4. Tip is applied proportionally: `(person_subtotal / total_subtotal) × tip`
5. All amounts rounded to 2 decimal places

### Implementation Details

```typescript
// Accept the image list, falling back to the deprecated single-image field
const images = Array.isArray(imageUrls)
  ? imageUrls.filter(url => typeof url === 'string' && url.length > 0)
  : imageUrl ? [imageUrl] : []

const systemPrompt = images.length > 0 ? IMAGE_SYSTEM_PROMPT : TEXT_ONLY_SYSTEM_PROMPT

// Every image is sent alongside a single prompt
const userContent = [
  ...images.map(url => ({ type: 'input_image', image_url: url, detail: 'auto' })),
  { type: 'input_text', text: prompt }
]

// Call OpenAI Responses API
const response = await openai.responses.create({
  model: 'gpt-5.2',
  reasoning: { effort: 'medium' },
  input: [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userContent }
  ],
  text: { format: billSplitSchema }
})

// Parse structured output
const result = JSON.parse(response.output_text)
```

---

## Authentication Helper

Both API routes use a shared authentication verification function:

```typescript
const AUTH_COOKIE_NAME = 'auth_token'

async function verifyAuth(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value
  if (!token) return false
  
  try {
    const secret = process.env.AUTH_SECRET
    if (!secret) return false
    const secretKey = new TextEncoder().encode(secret)
    await jwtVerify(token, secretKey)
    return true
  } catch {
    return false
  }
}
```

---

## Client-Side Usage

### Upload Helper

**File**: `lib/upload.ts`

Provides a client-side wrapper with image compression:

```typescript
import imageCompression from 'browser-image-compression'

export async function uploadImage(file: File): Promise<UploadResult> {
  // Compress image (max 2MB, 1920px)
  const compressedFile = await compressImage(file)

  const formData = new FormData()
  formData.append('file', compressedFile)

  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to upload')
  }

  return response.json()
}
```

### AI Analysis Component

**File**: `app/receipts/[id]/ai-analysis.tsx`

Example usage in React component:

```typescript
const response = await fetch('/api/analyze-receipt', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ imageUrls, prompt: prompt.trim() })
})

const data = await response.json()

if (data.items && data.items.length > 0) {
  setResults(data.items)
  setExplanation(data.explanation)
}
```

---

## Error Handling

All API routes follow consistent error handling:

1. **Authentication errors**: Return 401 with `{ "error": "Unauthorized" }`
2. **Validation errors**: Return 400 with descriptive error message
3. **Server errors**: Return 500 with error details
4. **Logging**: Errors logged to server console for debugging

```typescript
try {
  // ... operation
} catch (error) {
  console.error('Operation error:', error)
  
  if (error instanceof Error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json({ error: 'Operation failed' }, { status: 500 })
}
```

