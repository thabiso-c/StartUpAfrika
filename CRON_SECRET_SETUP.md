# Cron Secret Setup Guide

This guide will help you fix the 500 Internal Server Error from your cron job.

## What is CRON_SECRET?

`CRON_SECRET` is a security token that protects your `/api/cron/paraphrase-articles` endpoint from unauthorized access. Both Vercel and cron-job.org need to use the same secret value.

---

## Step-by-Step Setup

### 1. Generate a Secure Secret

Choose a random, unique string. Here are some examples:

**Option A: Use an online generator**
- Visit: https://www.random.org/strings/
- Generate a 32-character string
- Example: `a7x9K2mP4qR8vW5nY1bZ3cD6fG8hJ0kL`

**Option B: Use the command line**
```bash
# On Windows PowerShell
openssl rand -hex 32

# On Mac/Linux
openssl rand -hex 32
```

**Option C: Create your own**
Use a mix of uppercase, lowercase, numbers, and symbols (minimum 20 characters).
Example: `MyCronSecret_2026!StartupAfrika#XYZ`

---

### 2. Add to Vercel Environment Variables

1. Go to **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**

2. Add a new environment variable:
   - **Name:** `CRON_SECRET`
   - **Value:** `[paste your generated secret here]`
   - **Environment:** Select all (Production, Preview, Development)

3. Click **Save**

4. **Redeploy your application** (required for env vars to take effect)
   - Go to **Deployments** tab
   - Click the **three dots** on the latest deployment
   - Select **Redeploy**

---

### 3. Update cron-job.org Configuration

In your cron-job.org settings, update the **Headers** section:

**Header 1:**
```
Key: x-cron-secret
Value: [paste the EXACT same secret you used in Vercel]
```

**Example:**
```
Key: x-cron-secret
Value: a7x9K2mP4qR8vW5nY1bZ3cD6fG8hJ0kL
```

⚠️ **CRITICAL:** The value in cron-job.org MUST EXACTLY match the CRON_SECRET in Vercel (case-sensitive, no spaces).

---

### 4. Verify the Setup

#### Test Option A: Direct API Call
```bash
# Replace with your actual domain and secret
curl -X POST https://your-domain.vercel.app/api/cron/paraphrase-articles \
  -H "x-cron-secret: your-secret-here" \
  -H "Content-Type: application/json" \
  -v
```

**Expected Response:**
```json
{
  "success": true,
  "processed": 1,
  "activeKeyIndex": 0,
  "totalKeys": 3,
  "timestamp": "2026-07-30T..."
}
```

#### Test Option B: Use cron-job.org Test Run
1. Go to cron-job.org
2. Click **"Run now"** on your cron job
3. Check the response status (should be 200, not 500)

---

## Troubleshooting

### Still Getting 500 Error?

After setting up CRON_SECRET, a 500 error means something else is failing. Check:

#### 1. Verify Other Environment Variables
Make sure these are also set in Vercel:
- `GNEWS_API_KEY` or `NEWSAPI_KEY` - For fetching news articles
- `GEMINI_API_KEY` - For AI paraphrasing
- `FIREBASE_PROJECT_ID` - For database (optional but recommended)

#### 2. Check Vercel Function Logs
1. Go to Vercel Dashboard → Your Project
2. Click **Functions** tab
3. Find the failed cron invocation
4. Look for error messages like:
   - `[News Task] API key not configured` → Missing news API key
   - `[Gemini Pool] No Gemini API keys configured` → Missing Gemini key
   - `Error: Timeout` → Execution taking too long

#### 3. Check Vercel Deployment Logs
1. Go to **Deployments** tab
2. Click on the latest deployment
3. Click **"View Function Logs"**
4. Search for `[Cron Job]` to see detailed execution logs

---

## Common Error Messages

| Error Message | Likely Cause | Solution |
|---------------|--------------|----------|
| `Unauthorized` | CRON_SECRET mismatch | Verify secret matches exactly in both places |
| `API key not configured` | Missing GNEWS_API_KEY | Add to Vercel env vars |
| `No Gemini API keys` | Missing GEMINI_API_KEY | Add to Vercel env vars |
| `GEMINI_QUOTA_EXHAUSTED` | Daily quota reached | Wait for quota reset (UTC midnight) |
| `Timeout` | Processing too slow | Reduce to 1 article per cron run |

---

## Your Current Configuration (from screenshots)

**cron-job.org settings:**
- URL: `https://www.startupafrika.co.za/api/cron/paraphrase-articles`
- Method: POST
- Headers:
  - `Content-Type: application/json`
  - `x-cron-secret: [your Vercel CRON_SECRET value]` ← **Needs actual value**
- Schedule: Every 8 hours ✓
- Timezone: Africa/Johannesburg ✓
- Timeout: 30 seconds ✓

**Required Vercel Env Vars:**
```env
CRON_SECRET=<generate-and-add-this>
GNEWS_API_KEY=<your-news-api-key>
GEMINI_API_KEY=<your-gemini-api-key>
# Optional but recommended:
GEMINI_API_KEY_2=<second-gemini-key>
GEMINI_API_KEY_3=<third-gemini-key>
```

---

## Quick Setup Summary

1. [ ] Generate a secure random string (e.g., `openssl rand -hex 32`)
2. [ ] Add `CRON_SECRET` to Vercel environment variables
3. [ ] Redeploy on Vercel
4. [ ] Update cron-job.org header with the exact same secret
5. [ ] Test the endpoint with curl or cron-job.org test run
6. [ ] Verify it returns `success: true`

---

## Need Help?

If you're still experiencing issues after following this guide:

1. Share the exact error from Vercel Function Logs
2. Confirm all environment variables are set
3. Verify the CRON_SECRET matches exactly (no extra spaces, correct case)

The most common mistake is using placeholder text like `[your-cron-secret]` instead of an actual generated secret value.