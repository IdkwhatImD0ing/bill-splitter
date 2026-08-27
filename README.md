# Receipt Split

A simple app to split receipts with friends and share public links for them to see what they owe.

## Setup

### 1. Environment Variables

Create a `.env.local` file with:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SECRET_KEY=your_supabase_secret_key

# Auth
AUTH_PASSWORD=your_secure_password
AUTH_SECRET=your_jwt_secret_at_least_32_characters_long

# OpenAI (optional, for AI Analysis feature)
OPENAI_API_KEY=your_openai_api_key
```

### 2. Supabase Database

Run the SQL in `supabase-schema.sql` in your Supabase SQL Editor to create the tables.

#### Migrations

If you have an existing database, check the `migrations/` folder for any schema updates:

- `001_add_notes_column.sql` - Adds a separate notes column and renames the original `notes` column to `name`
- `002_add_breakdown_column.sql` - Adds a `breakdown` JSONB column to bill_items for storing itemized cost breakdowns from AI analysis
- `003_add_image_urls.sql` - Adds an `image_urls` array so a receipt can hold multiple images, backfilled from the existing `image_url`

### 3. Supabase Storage

1. Go to Supabase Dashboard → Storage
2. Create a new bucket called `receipts`
3. Set it to **Public** (so images can be viewed on public bill pages)

### 4. Run the App

```bash
npm install
npm run dev
```

## Usage

1. Go to `/login` and enter your password
2. Click "Create New Receipt" to upload a receipt image
3. Add people and the amounts they owe
4. Add optional notes to keep track of additional details
5. Generate a public link to share with friends
6. Friends can view the bill at `/bill/[id]` without needing to log in

## AI Analysis

The AI Analysis feature (Beta) can automatically calculate how much each person owes based on a receipt image and your description of who ordered what.

### How to Use

1. Upload a receipt image to your receipt
2. Expand the "AI Analysis" section
3. Describe who ordered what (e.g., "John had the burger and fries. Jane had the salad. We split the appetizer.")
4. Click "Analyze Receipt"
5. Review the results - each person shows their total with an expandable breakdown
6. Click the chevron next to each person to see:
   - Individual items they ordered
   - Shared items (split with others)
   - Their subtotal, tax share, and tip share
7. Edit any amounts if needed, then click "Import" to add everyone to the receipt

The breakdown information is saved with each bill item, so you can always expand a person's row to see how their total was calculated.

**Note:** Requires `OPENAI_API_KEY` environment variable to be set.

## Bulk Import

You can add multiple people at once using the Bulk Import feature on any receipt page. Either:
- **Upload a JSON file** - Click "Upload JSON File" and select your file
- **Paste JSON data** - Click "Paste JSON Data" and paste your JSON directly

### Expected Format

```json
[
  { "name": "John", "amount": 25.50 },
  { "name": "Jane", "amount": 30.00 }
]
```

**Flexible field names:** The importer also accepts `person_name` or `person` for names, and `value` or `total` for amounts.

## Design System

Receipt Split uses a warm, receipt-paper inspired color palette that balances friendliness with financial trustworthiness.

### Color Philosophy

| Purpose | Reasoning |
|---------|-----------|
| **Warm Terracotta/Amber** | Bill splitting is social - warm tones feel friendly and inviting |
| **Paper-like backgrounds** | Evokes the familiar feel of physical receipts |
| **Emerald for "Paid"** | Universal success/positive color for completed payments |
| **Red only for errors** | Reserved exclusively for destructive actions to avoid financial anxiety |

### Brand Colors (CSS Variables)

```css
/* Light Mode */
--brand-400: oklch(0.72 0.14 55);  /* Primary amber-terracotta */
--brand-500: oklch(0.62 0.15 50);  /* Main brand color */
--brand-600: oklch(0.55 0.14 45);  /* Darker accent */

/* Semantic */
--success: oklch(0.65 0.16 155);   /* Paid/completed states */
--destructive: oklch(0.55 0.2 25); /* Errors only */
```

### Utility Classes

| Class | Purpose |
|-------|---------|
| `.bg-receipt-pattern` | Subtle radial gradient background |
| `.text-gradient-brand` | Gradient text for headings |
| `.btn-brand` | Primary action button styling |
| `.card-receipt` | Card with subtle shadow and backdrop blur |
