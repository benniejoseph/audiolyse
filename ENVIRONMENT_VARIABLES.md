# Environment Variables Configuration

## Required Environment Variables

Add these to your Vercel project settings (or `.env.local` for local development):

### Razorpay Configuration
```bash
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
```

### Mailchimp Mandrill Configuration
```bash
MANDRILL_API_KEY=your_mandrill_api_key
FROM_EMAIL=receipts@audiolyse.com
FROM_NAME=Audiolyse
```

### Site Configuration
```bash
NEXT_PUBLIC_SITE_URL=https://audiolyse.vercel.app
```

### Existing Variables (Already Configured)
```bash
GOOGLE_GEMINI_API_KEY=your_gemini_api_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## How to Add in Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add each variable for:
   - **Production**
   - **Preview** (optional)
   - **Development** (optional)
4. Click **Save**
5. Redeploy your application

## Testing Locally

1. Create a `.env.local` file in the project root
2. Add all environment variables
3. Restart your development server

**Note**: Never commit `.env.local` to version control!

