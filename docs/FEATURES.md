# Features Documentation

This document provides comprehensive documentation for all features in Bill Splitter.

## Feature Overview

| Feature | Description | Location |
|---------|-------------|----------|
| [Authentication](#authentication) | Password-based login with JWT | `/login` |
| [Receipt Management](#receipt-management) | Create, view, edit, delete receipts | `/`, `/receipts/*` |
| [Image Upload](#image-upload) | Upload and compress receipt images | Receipt pages |
| [Bill Splitting](#bill-splitting) | Add people and track amounts | `/receipts/[id]` |
| [AI Analysis](#ai-analysis) | Automatic receipt analysis | `/receipts/[id]` |
| [JSON Import](#json-bulk-import) | Bulk add from JSON data | `/receipts/[id]` |
| [Public Sharing](#public-sharing) | Share bills with friends | `/bill/[id]` |
| [Payment Tracking](#payment-tracking) | Mark items as paid | Receipt pages |
| [Notes](#notes-management) | Add notes to receipts | `/receipts/[id]` |

---

## Authentication

Bill Splitter uses a simple password-based authentication system with JWT tokens.

### How It Works

1. **Single Password**: One shared password for all users (configured via `AUTH_PASSWORD` env variable)
2. **JWT Tokens**: Upon successful login, a JWT token is created and stored in an HTTP-only cookie
3. **Session Duration**: Tokens expire after 7 days
4. **Protected Routes**: All routes except `/login` and `/bill/[id]` require authentication

### Login Process

1. Navigate to `/login`
2. Enter the configured password
3. On success, redirected to dashboard (`/`)
4. On failure, error message displayed

### Security Features

- **HTTP-only Cookies**: Token cannot be accessed by JavaScript
- **Secure Flag**: Cookie only sent over HTTPS in production
- **SameSite**: Set to `lax` to prevent CSRF attacks
- **Password Validation**: Server-side only, password never exposed to client

### Logout

Click the "Logout" button in the dashboard header to clear the session and return to login.

---

## Receipt Management

### Creating a Receipt

1. Click "Create New Receipt" on the dashboard
2. Fill in the required fields:
   - **Name**: Give your receipt a descriptive name (e.g., "Dinner at Joe's Pizza")
   - **Date**: Select the date (defaults to today)
3. Optionally add:
   - **Notes**: Any additional information
   - **Image**: Upload a photo of the receipt
4. Click "Create Receipt"
5. You'll be redirected to the receipt detail page

### Viewing Receipts

The dashboard displays all receipts as cards showing:
- Receipt name
- Date
- Number of people
- Total amount
- Shared status badge

Click any receipt card to view its details.

### Editing a Receipt

On the receipt detail page, you can:
- Click the date to edit it inline
- Edit notes in the expandable notes section
- Upload or replace the receipt image

### Deleting a Receipt

1. Open the receipt detail page
2. Click the trash icon in the header
3. Confirm the deletion

**Warning**: This permanently deletes the receipt, all bill items, and any public sharing links.

---

## Image Upload

### Supported Formats

- JPEG/JPG
- PNG
- WebP
- Any image format up to 50MB

### Compression

Images are automatically compressed before upload:
- **Maximum Size**: 2MB
- **Maximum Dimensions**: 1920px (width or height)
- **Format**: Preserves original format

This ensures fast uploads and optimal storage usage.

### Upload Methods

**Drag and Drop:**
1. Drag an image file over the upload area
2. Drop it to select

**Click to Browse:**
1. Click the upload area
2. Select a file from your device

### Image Preview

Selected images show a preview before upload. Click the X button to remove and select a different image.

### Replacing Images

On existing receipts, click "Upload Image" or "Replace Image" to update the receipt image. The old image is automatically deleted from storage.

---

## Bill Splitting

### Adding People

1. Open a receipt detail page
2. In the "Who Owes What" section, enter:
   - Person's name
   - Amount they owe
3. Click "Add" or press Enter

### Viewing the Bill

Each person is displayed with:
- Their name
- Amount owed
- Paid status checkbox
- Delete button

The total is calculated automatically at the bottom.

### Deleting a Person

Click the trash icon next to any person to remove them from the bill.

---

## AI Analysis

The AI Analysis feature uses OpenAI's GPT-5.2 to automatically calculate bill splits from receipt images or text descriptions.

### With Receipt Image

1. Ensure your receipt has an uploaded image
2. Expand the "AI Analysis" section
3. Describe who ordered what:
   ```
   John had the burger and fries.
   Jane had the Caesar salad.
   We split the appetizer nachos and added 20% tip.
   ```
4. Click "Analyze Receipt"

The AI will:
- Read the receipt image
- Match items to people
- Calculate tax proportionally
- Calculate tip proportionally
- Show each person's total

### Without Receipt Image

AI Analysis also works without an image:

1. Describe the items with prices:
   ```
   John had the burger ($15) and fries ($5).
   Jane had the Caesar salad ($12).
   Tax was $3.50 and we added 20% tip.
   ```
2. Click "Analyze Receipt"

### Editing Results

Before importing, you can:
- Click any name or amount to edit
- Remove people using the trash icon
- View the calculation explanation

### Importing Results

1. Review the calculated amounts
2. Optionally check "Save explanation to notes"
3. Click "Import X People"

The people and amounts are added to your receipt.

### Tips for Best Results

- Be specific about who ordered what
- Mention shared items explicitly
- Include tax and tip information
- For text-only mode, include prices

---

## JSON Bulk Import

Add multiple people at once using JSON data.

### Expected Format

```json
[
  { "name": "John", "amount": 25.50 },
  { "name": "Jane", "amount": 30.00 },
  { "name": "Bob", "amount": 15.75 }
]
```

### Flexible Field Names

The importer accepts alternative field names:

| Accepted Name Fields | Accepted Amount Fields |
|---------------------|----------------------|
| `name` | `amount` |
| `person_name` | `value` |
| `person` | `total` |

### Import Methods

**Upload JSON File:**
1. Expand the "Bulk Import" section
2. Click "Upload JSON File"
3. Select your `.json` file

**Paste JSON Data:**
1. Click "Paste JSON Data"
2. Paste your JSON into the textarea (or click "Paste" to read from clipboard)
3. Click "Import"

### Example Workflow

1. Export data from a spreadsheet or other tool
2. Format as JSON array
3. Upload or paste into Bill Splitter
4. All people are added instantly

---

## Public Sharing

Share receipts with friends so they can see what they owe without logging in.

### Generating a Share Link

1. Open the receipt detail page
2. Click the "Share" button
3. Click "Generate Link"
4. Copy the generated URL

### Sharing the Link

The public URL format is:
```
https://yoursite.com/bill/[unique-id]
```

Share this link via:
- Text message
- Email
- Chat apps
- Social media

### What Friends See

The public bill page shows:
- Receipt name and date
- List of people and amounts
- Paid/unpaid status
- Total amount
- Zelle payment information
- Notes (if any)
- Receipt image (if uploaded)

### Privacy

- Friends can only VIEW the bill (no editing)
- The public link ID is separate from the receipt ID
- Only receipts with generated links are accessible
- No login required to view

### Share Link Status

On the dashboard, receipts with public links show a "Shared" badge.

---

## Payment Tracking

Track who has paid their share.

### Marking as Paid

On the receipt detail page:
1. Find the person in the list
2. Click the checkbox next to their name
3. Their row turns green and shows as paid

### Paid Status Display

- **Dashboard**: Shows total amount (includes all, paid or not)
- **Receipt Detail**: Green highlight and checkmark for paid items
- **Public Bill**: Checkmark and "PAID" badge for paid items

### Updating Status

Click the checkbox again to toggle between paid and unpaid.

---

## Notes Management

Add additional information to receipts.

### Adding Notes

1. Open the receipt detail page
2. Find the "Notes" section
3. Click to edit
4. Type your notes
5. Click "Save" or click outside to save

### Use Cases

- Record what the occasion was
- Note any special circumstances
- Keep track of payment methods
- Store AI analysis explanations

### Notes in Public Bills

If notes exist, they are displayed on the public bill page so friends can see any relevant information.

---

## Zelle Payment Integration

The public bill page includes Zelle payment information.

### How It Works

1. The owner's Zelle phone number is displayed
2. Friends can tap to copy the number
3. Friends open their bank's Zelle feature
4. Paste the number to send payment

### Copy Functionality

Click the phone number button to:
1. Copy number to clipboard
2. See "Copied!" confirmation
3. Include their name in the memo when sending

### Configuration

The Zelle number is currently hardcoded in the application. To change it, update the number in `app/bill/[id]/page.tsx`.

---

## Design System

Bill Splitter uses a warm, receipt-paper inspired design.

### Color Philosophy

| Color | Usage | Reasoning |
|-------|-------|-----------|
| Terracotta/Amber | Primary brand color | Warm, friendly feeling |
| Paper backgrounds | Page backgrounds | Evokes physical receipts |
| Emerald green | Paid status | Universal success color |
| Red | Errors only | Reserved for destructive actions |

### CSS Variables

```css
/* Light Mode Brand Colors */
--brand-400: oklch(0.72 0.14 55);
--brand-500: oklch(0.62 0.15 50);
--brand-600: oklch(0.55 0.14 45);

/* Semantic Colors */
--success: oklch(0.65 0.16 155);
--destructive: oklch(0.55 0.2 25);
```

### Utility Classes

| Class | Purpose |
|-------|---------|
| `.bg-receipt-pattern` | Subtle radial gradient background |
| `.text-gradient-brand` | Gradient text for headings |
| `.btn-brand` | Primary action button styling |
| `.card-receipt` | Card with shadow and backdrop blur |

### Dark Mode

Full dark mode support with automatic detection based on system preferences.

---

## Progressive Web App (PWA)

Bill Splitter can be installed as a PWA on mobile devices.

### Installation

**iOS:**
1. Open in Safari
2. Tap Share button
3. Select "Add to Home Screen"

**Android:**
1. Open in Chrome
2. Tap menu (three dots)
3. Select "Add to Home Screen"

### PWA Features

- Works offline (cached pages)
- Home screen icon
- Full-screen experience
- Native-like performance

---

## SEO Features

### Metadata

All pages have appropriate metadata for search engines:
- Title and description
- OpenGraph tags for social sharing
- Twitter card tags
- Robots directives (private pages excluded from indexing)

### Structured Data

Public bill pages include JSON-LD structured data for better search engine understanding.

### Sitemap and Robots

- `robots.txt` generated dynamically
- `sitemap.xml` for search engine crawlers

