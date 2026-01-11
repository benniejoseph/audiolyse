# Fix RLS Infinite Recursion Issue

## The Problem
The error "infinite recursion detected in policy for relation 'organization_members'" occurs because RLS policies query the same table they protect, causing infinite loops.

## Solution (REQUIRED)

### Step 1: Add the Supabase Service Role Key

The **main fix** is to use the Supabase Service Role Key for server-side operations. This bypasses RLS entirely.

1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **API**
3. Copy the **Service Role Key** (keep it secret!)
4. Add it to your environment variables:

**For Vercel:**
- Go to your Vercel project → Settings → Environment Variables
- Add: `SUPABASE_SERVICE_ROLE_KEY` = your service role key
- Redeploy

**For Local Development:**
- Add to `.env.local`:
```bash
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Step 2: (Optional) Apply Database Migration

If you also want to fix the RLS policies for other operations, run migration `007_simple_rls_fix.sql`:

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the entire contents of `supabase/migrations/007_simple_rls_fix.sql`
4. Paste into the SQL Editor
5. Click **Run**

## How This Fix Works

The application now uses two Supabase clients:

1. **Regular Client** (`createClient`): Uses the anon key, respects RLS - for user authentication
2. **Service Client** (`createServiceClient`): Uses the service role key, bypasses RLS - for payment operations

This ensures that:
- User authentication still works with RLS
- Payment operations can access `organization_members` without recursion
- Database operations are secure (service key is server-side only)

## Verification

After adding the service role key:
1. Redeploy your application
2. Try to purchase credits or upgrade subscription
3. The "infinite recursion" error should be gone

## Troubleshooting

### Still Getting Recursion Error?

1. **Check environment variable is set**: Verify `SUPABASE_SERVICE_ROLE_KEY` exists in your deployment
2. **Redeploy**: Make sure you redeployed after adding the variable
3. **Check Supabase logs**: Look for specific error messages

### Service Key Not Working?

1. Verify the key starts with `eyJ...` (JWT format)
2. Make sure you copied the **Service Role** key, not the Anon key
3. Check Supabase dashboard → Settings → API to confirm the key

## Security Note

⚠️ **NEVER expose the Service Role Key to the client/browser!**

- It's only used in server-side API routes (`/api/*`)
- Never include it in `NEXT_PUBLIC_*` variables
- Keep it in environment variables only
