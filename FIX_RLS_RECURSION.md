# Fix RLS Infinite Recursion Issue

## Problem
The error "infinite recursion detected in policy for relation 'organization_members'" occurs because RLS policies are querying the same table they protect, causing infinite loops.

## Solution
Run migration `007_simple_rls_fix.sql` which:
1. Drops all existing problematic policies
2. Creates helper functions with `SET LOCAL row_security = off` to truly bypass RLS
3. Recreates all policies using these helper functions

## How to Apply

### Option 1: Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the entire contents of `supabase/migrations/007_simple_rls_fix.sql`
4. Paste into the SQL Editor
5. Click **Run**
6. Verify no errors appear

### Option 2: Supabase CLI
```bash
# Make sure you're in the project directory
cd /Users/benniejoseph/Documents/CallTranscribe

# Link to your Supabase project (if not already linked)
supabase link --project-ref YOUR_PROJECT_REF

# Apply the migration
supabase db push

# Or apply specific migration
supabase migration up
```

### Option 3: Direct SQL Connection
If you have direct database access:
```bash
psql YOUR_DATABASE_URL < supabase/migrations/007_simple_rls_fix.sql
```

## What This Fix Does

1. **Drops all existing policies** on `organization_members` and related tables
2. **Creates helper functions** that use `SET LOCAL row_security = off` to bypass RLS
3. **Recreates policies** using these helper functions instead of direct queries
4. **Updates all related table policies** to use the new helper functions

## Verification

After applying the migration, test by:
1. Trying to purchase credits
2. Checking if the "infinite recursion" error is gone
3. Verifying organization membership queries work

## If Issues Persist

If you still see recursion errors:
1. Check Supabase logs for specific error messages
2. Verify the migration ran successfully
3. Check if there are any other policies not covered by the migration
4. Consider temporarily disabling RLS on `organization_members` for testing:
   ```sql
   ALTER TABLE organization_members DISABLE ROW LEVEL SECURITY;
   ```
   (Then re-enable and apply the fix)

## Razorpay Integration Notes

The RLS fix is separate from Razorpay integration. For Razorpay:
- Ensure `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` are set in environment variables
- Test with Razorpay test mode first
- Verify webhook URL is configured in Razorpay dashboard
- Check Razorpay logs for any API errors

