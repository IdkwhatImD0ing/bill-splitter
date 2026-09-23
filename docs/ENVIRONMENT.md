# Environment Setup Guide

This document describes how to configure the environment variables and external services required to run Bill Splitter.

## Environment Variables

Create a `.env.local` file in the project root with the following variables:

```bash
# ===================
# Supabase Configuration
# ===================
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SECRET_KEY=your-supabase-service-role-key

# ===================
# Authentication
# ===================
AUTH_PASSWORD=your-secure-password
AUTH_SECRET=your-jwt-secret-at-least-32-characters-long

# ===================
# OpenAI (Optional - for AI features)
# ===================
OPENAI_API_KEY=sk-your-openai-api-key

# ===================
# Site Configuration (Optional)
# ===================
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

---

## Variable Reference

### NEXT_PUBLIC_SUPABASE_URL

**Required:** Yes  
**Type:** URL  
**Example:** `https://abcdefghij.supabase.co`

The URL of your Supabase project. Find this in:
1. Supabase Dashboard → Project Settings → API
2. Look for "Project URL"

**Note:** The `NEXT_PUBLIC_` prefix makes this available in client-side code.

---

### SUPABASE_SECRET_KEY

**Required:** Yes  
**Type:** String  
**Example:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

The service role key for server-side Supabase operations. Find this in:
1. Supabase Dashboard → Project Settings → API
2. Look for "service_role" under "Project API keys"

**Security:** This key has full access to your database. Never expose it in client-side code or commit it to version control.

---

### AUTH_PASSWORD

**Required:** Yes  
**Type:** String  
**Example:** `MySecurePassword123!`

The password users must enter to log in. Choose a strong password that you'll share with authorized users.

**Recommendations:**
- Minimum 12 characters
- Mix of letters, numbers, symbols
- Not easily guessable

---

### AUTH_SECRET

**Required:** Yes  
**Type:** String (min 32 characters)  
**Example:** `your-super-secret-jwt-key-at-least-32-chars`

The secret key used to sign JWT tokens. This must be:
- At least 32 characters long
- Random and unpredictable
- Never shared publicly

**Generate a secure secret:**

```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Using OpenSSL
openssl rand -hex 32
```

---

### OPENAI_API_KEY

**Required:** No (AI features won't work without it)  
**Type:** String  
**Example:** `sk-proj-abc123...`

Your OpenAI API key for the AI receipt analysis feature. Get one from:
1. Go to [platform.openai.com](https://platform.openai.com)
2. Navigate to API Keys
3. Create a new key

**Cost:** AI analysis uses GPT-5.2 with medium reasoning effort. Monitor your usage in the OpenAI dashboard.

---

### NEXT_PUBLIC_SITE_URL

**Required:** No  
**Type:** URL  
**Default:** `https://bills.art3m1s.me`  
**Example:** `https://your-domain.com`

The public URL of your deployed application. Used for:
- OpenGraph meta tags
- Canonical URLs
- Sitemap generation
- Share link generation

---

## Supabase Setup

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign in or create an account
3. Click "New Project"
4. Choose organization, name, and password
5. Select a region close to your users
6. Wait for project to initialize

### 2. Configure Database

Run the schema SQL in the SQL Editor:

1. Go to SQL Editor in Supabase Dashboard
2. Click "New Query"
3. Paste contents of `supabase-schema.sql`
4. Click "Run"

```sql
-- Copy from supabase-schema.sql
CREATE TABLE receipts (...);
CREATE TABLE bill_items (...);
CREATE TABLE public_links (...);
CREATE INDEX ...;
```

### 3. Create Storage Bucket

1. Go to Storage in Supabase Dashboard
2. Click "New Bucket"
3. Name: `receipts`
4. **Important:** Toggle "Public bucket" to ON
5. Click "Create bucket"

### 4. Get API Credentials

1. Go to Project Settings → API
2. Copy "Project URL" → `NEXT_PUBLIC_SUPABASE_URL`
3. Copy "service_role" key → `SUPABASE_SECRET_KEY`

---

## OpenAI Setup

### 1. Create Account

1. Go to [platform.openai.com](https://platform.openai.com)
2. Sign up or sign in
3. Add payment method (required for API access)

### 2. Create API Key

1. Navigate to API Keys section
2. Click "Create new secret key"
3. Name it (e.g., "Bill Splitter")
4. Copy the key immediately (won't be shown again)
5. Paste into `OPENAI_API_KEY` variable

### 3. Set Usage Limits (Recommended)

1. Go to Settings → Limits
2. Set monthly spending limit
3. Set notification threshold

---

## Local Development

### 1. Clone Repository

```bash
git clone <repository-url>
cd Taxes
```

### 2. Install Dependencies

```bash
# Using pnpm (recommended)
pnpm install

# Using npm
npm install
```

### 3. Create Environment File

```bash
# Create .env.local from example
cp .env.example .env.local

# Edit with your values
code .env.local  # or your preferred editor
```

### 4. Run Development Server

```bash
pnpm dev
# or
npm run dev
```

The app will be available at `http://localhost:3000`.

---

## Production Deployment

### Vercel (Recommended)

1. **Connect Repository**
   - Go to [vercel.com](https://vercel.com)
   - Import your Git repository

2. **Configure Environment Variables**
   - In project settings, add all required env variables
   - Mark sensitive variables as "Encrypted"

3. **Deploy**
   - Push to main branch
   - Vercel automatically builds and deploys

### Environment Variables in Vercel

| Variable | Settings |
|----------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Production, Preview, Development |
| `SUPABASE_SECRET_KEY` | Production, Preview (Encrypted) |
| `AUTH_PASSWORD` | Production, Preview (Encrypted) |
| `AUTH_SECRET` | Production, Preview (Encrypted) |
| `OPENAI_API_KEY` | Production, Preview (Encrypted) |
| `NEXT_PUBLIC_SITE_URL` | Production only |

### Other Platforms

The app can be deployed to any platform supporting Next.js:
- Netlify
- Railway
- Render
- Self-hosted with Node.js

Ensure environment variables are configured in your platform's dashboard.

---

## Security Best Practices

### Environment Files

```gitignore
# .gitignore should include:
.env
.env.local
.env.*.local
```

Never commit `.env.local` or any file containing secrets.

### Secret Rotation

Periodically rotate sensitive credentials:

1. **AUTH_SECRET**: Generate new secret, update env variable, existing sessions will be invalidated
2. **AUTH_PASSWORD**: Update and notify users
3. **OPENAI_API_KEY**: Rotate in OpenAI dashboard
4. **SUPABASE_SECRET_KEY**: Regenerate in Supabase dashboard

### Access Control

- Limit who has access to production environment variables
- Use separate Supabase projects for development and production
- Monitor OpenAI usage for unexpected activity

---

## Troubleshooting

### "AUTH_SECRET is not set"

**Cause:** Missing `AUTH_SECRET` in environment variables.

**Solution:** Add `AUTH_SECRET` with at least 32 characters to `.env.local`.

---

### "AUTH_PASSWORD is not set"

**Cause:** Missing `AUTH_PASSWORD` in environment variables.

**Solution:** Add `AUTH_PASSWORD` to `.env.local`.

---

### Database Connection Errors

**Cause:** Invalid Supabase credentials or network issues.

**Solutions:**
1. Verify `NEXT_PUBLIC_SUPABASE_URL` is correct
2. Verify `SUPABASE_SECRET_KEY` is the service_role key (not anon)
3. Check Supabase project is active (not paused)

---

### "OpenAI API key not configured"

**Cause:** Missing `OPENAI_API_KEY` environment variable.

**Solution:** Add your OpenAI API key to `.env.local`. AI features will be unavailable without it.

---

### Image Upload Fails

**Causes:**
1. Storage bucket doesn't exist
2. Bucket not set to public
3. Invalid Supabase credentials

**Solutions:**
1. Create `receipts` bucket in Supabase Storage
2. Enable public access on the bucket
3. Verify credentials

---

### "Invalid password"

**Cause:** Entered password doesn't match `AUTH_PASSWORD`.

**Solutions:**
1. Check for extra spaces or typos
2. Verify `AUTH_PASSWORD` in `.env.local`
3. Restart dev server after changing env variables

---

## Example .env.local

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghij.supabase.co
SUPABASE_SECRET_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWoiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNjQxNzY5MjAwLCJleHAiOjE5NTczNDUyMDB9.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Auth
AUTH_PASSWORD=MySecurePassword123!
AUTH_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4

# OpenAI (optional)
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Site URL (optional, for production)
NEXT_PUBLIC_SITE_URL=https://bills.art3m1s.me
```

**Remember:** Never commit this file to version control!

