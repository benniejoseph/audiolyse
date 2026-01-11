# Mailchimp Mandrill Setup Guide

## Step 1: Create Mandrill Account

1. Go to [Mandrill](https://mandrillapp.com/) (Mailchimp's transactional email service)
2. Sign up or log in with your Mailchimp account
3. Complete account verification

## Step 2: Get API Key

1. Log in to Mandrill dashboard
2. Go to **Settings** → **SMTP & API Info**
3. Click **Add API Key**
4. Give it a name (e.g., "Audiolyse Production")
5. Copy the generated API key (you won't see it again!)

## Step 3: Verify Sending Domain

1. Go to **Settings** → **Sending Domains**
2. Add your domain (e.g., `audiolyse.com`)
3. Add the required DNS records:
   - **SPF Record**: `v=spf1 include:spf.mandrillapp.com ?all`
   - **DKIM Record**: (provided by Mandrill)
   - **Return-Path**: (provided by Mandrill)

## Step 4: Configure Environment Variables

Add to your Vercel environment variables (or `.env.local`):

```bash
# Mandrill Configuration
MANDRILL_API_KEY=your_mandrill_api_key_here
FROM_EMAIL=receipts@audiolyse.com
FROM_NAME=Audiolyse
```

## Step 5: Test Email Sending

1. Use the test endpoint or make a test purchase
2. Check Mandrill dashboard → **Activity** → **Sent** for delivery status
3. Verify email arrives in inbox (check spam folder)

## Step 6: Monitor Email Delivery

- **Mandrill Dashboard**: View sent emails, bounces, spam reports
- **Activity Feed**: Real-time email delivery status
- **Reports**: Delivery rates, open rates, click rates

## Important Notes

- **Mandrill has a free tier**: 500 emails/day
- **API key is sensitive**: Never commit to version control
- **Domain verification required**: For better deliverability
- **Monitor bounces**: Remove invalid email addresses
- **Rate limits**: 25 emails/second on free tier

## Alternative: Using Mailchimp Marketing API

If you prefer using Mailchimp's Marketing API instead of Mandrill:

1. Get API key from Mailchimp dashboard
2. Use Mailchimp's Transactional API
3. Update the email sending function accordingly

## Support

- Mandrill Docs: https://mailchimp.com/developer/transactional/
- Mandrill Support: support@mandrillapp.com

