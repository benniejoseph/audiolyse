# Google OAuth Setup Guide for Production

## Overview
Google Sign-in is implemented using Supabase Auth. For it to work in production, you need to configure redirect URLs in both Supabase and Google Cloud Console.

## Current Implementation
- **OAuth Provider**: Google (via Supabase)
- **Redirect URL Pattern**: `${window.location.origin}/api/auth/callback?next=/dashboard`
- **Callback Route**: `/api/auth/callback`

## Setup Steps

### 1. Configure Supabase Dashboard

1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Navigate to **Authentication** → **URL Configuration**
3. Add your production site URL to **Site URL**:
   ```
   https://audiolyse.vercel.app
   ```
4. Add redirect URLs to **Redirect URLs**:
   ```
   https://audiolyse.vercel.app/api/auth/callback
   https://audiolyse.vercel.app/api/auth/callback?next=/dashboard
   https://audiolyse.vercel.app/api/auth/callback?next=/analyze
   ```
   (Add any other routes that might redirect after login)

### 2. Configure Google OAuth in Supabase

1. In Supabase dashboard, go to **Authentication** → **Providers**
2. Find **Google** in the list and click to configure
3. Enable Google provider
4. You'll need:
   - **Client ID** (from Google Cloud Console)
   - **Client Secret** (from Google Cloud Console)
5. The **Redirect URL** will be automatically set by Supabase (usually: `https://[your-project-ref].supabase.co/auth/v1/callback`)

### 3. Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select or create a project
3. Navigate to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth client ID**
5. If prompted, configure the OAuth consent screen first:
   - Choose **External** (unless you have a Google Workspace)
   - Fill in required fields:
     - App name: `Audiolyse`
     - User support email: Your email
     - Developer contact: Your email
   - Add scopes: `email`, `profile`, `openid`
   - Add test users (if in testing mode)
6. Create OAuth 2.0 Client ID:
   - Application type: **Web application**
   - Name: `Audiolyse Production`
   - **Authorized JavaScript origins**:
     ```
     https://audiolyse.vercel.app
     https://[your-project-ref].supabase.co
     ```
   - **Authorized redirect URIs**:
     ```
     https://[your-project-ref].supabase.co/auth/v1/callback
     ```
     (Replace `[your-project-ref]` with your actual Supabase project reference)

### 4. Get Supabase Redirect URL

1. In Supabase dashboard, go to **Authentication** → **Providers** → **Google**
2. Copy the **Redirect URL** shown (format: `https://[project-ref].supabase.co/auth/v1/callback`)
3. Add this exact URL to Google Cloud Console's **Authorized redirect URIs**

### 5. Add Credentials to Supabase

1. Copy the **Client ID** from Google Cloud Console
2. Copy the **Client Secret** from Google Cloud Console
3. Paste them into Supabase **Authentication** → **Providers** → **Google**
4. Click **Save**

### 6. Test in Production

1. Deploy your app to Vercel (already done)
2. Visit: `https://audiolyse.vercel.app/login`
3. Click "Continue with Google"
4. You should be redirected to Google's sign-in page
5. After signing in, you should be redirected back to your app

## Troubleshooting

### Common Issues

1. **"redirect_uri_mismatch" error**
   - Ensure the redirect URI in Google Cloud Console exactly matches Supabase's callback URL
   - Check for trailing slashes or protocol mismatches (http vs https)

2. **"Invalid client" error**
   - Verify Client ID and Client Secret are correct in Supabase
   - Ensure OAuth consent screen is configured

3. **Redirects to wrong page**
   - Check that Site URL in Supabase matches your production domain
   - Verify redirect URLs include all necessary paths

4. **Works locally but not in production**
   - Ensure production domain is added to Supabase redirect URLs
   - Verify Google OAuth credentials are configured for production domain
   - Check that `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set in Vercel environment variables

## Environment Variables (Already Set)

These should already be configured in Vercel:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Testing Checklist

- [ ] Supabase Site URL set to production domain
- [ ] Supabase redirect URLs include production callback
- [ ] Google OAuth consent screen configured
- [ ] Google OAuth client created (Web application)
- [ ] Google authorized origins include production domain
- [ ] Google authorized redirect URI matches Supabase callback URL
- [ ] Google Client ID and Secret added to Supabase
- [ ] Test Google sign-in in production

## Notes

- The redirect URL uses `window.location.origin` which automatically adapts to your domain
- Supabase handles the OAuth flow, so you only need to configure the callback URLs
- Google OAuth requires HTTPS in production (Vercel provides this automatically)
- If you change your domain, update all redirect URLs in both Supabase and Google

## Support

If you encounter issues:
1. Check browser console for errors
2. Check Supabase logs: **Logs** → **Auth Logs**
3. Check Google Cloud Console for OAuth errors
4. Verify all URLs match exactly (no typos, correct protocol)

