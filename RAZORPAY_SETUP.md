# Razorpay Payment Gateway Setup Guide

## Step 1: Create Razorpay Account

1. Sign up at [Razorpay](https://razorpay.com/)
2. Complete KYC verification (required for live mode)
3. Navigate to Dashboard

## Step 2: Get API Keys

### For Test Mode:
1. Go to **Settings** → **API Keys**
2. Click **Generate Test Key**
3. Copy the **Key ID** and **Key Secret**

### For Live Mode:
1. Complete KYC verification
2. Go to **Settings** → **API Keys**
3. Click **Generate Live Key**
4. Copy the **Key ID** and **Key Secret**

## Step 3: Set Up Webhook

1. Go to **Settings** → **Webhooks**
2. Click **Add New Webhook**
3. Set the webhook URL: `https://your-domain.com/api/payments/webhook`
4. Select events:
   - `payment.captured`
   - `payment.authorized`
   - `payment.failed`
5. Copy the **Webhook Secret**

## Step 4: Configure Environment Variables

Add these to your Vercel environment variables (or `.env.local` for local development):

```bash
# Razorpay Configuration
RAZORPAY_KEY_ID=your_key_id_here
RAZORPAY_KEY_SECRET=your_key_secret_here
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_here

# Email Configuration (Mailchimp Mandrill)
MANDRILL_API_KEY=your_mandrill_api_key_here
FROM_EMAIL=receipts@audiolyse.com
FROM_NAME=Audiolyse

# Site URL (for email links)
NEXT_PUBLIC_SITE_URL=https://audiolyse.vercel.app
```

## Step 5: Test the Integration

1. Use Razorpay test cards:
   - **Success**: `4111 1111 1111 1111`
   - **CVV**: Any 3 digits
   - **Expiry**: Any future date
   - **Name**: Any name

2. Test the payment flow:
   - Go to `/credits` page
   - Select a credit package
   - Complete payment with test card
   - Verify credits are added
   - Check email for receipt

## Step 6: Go Live

1. Replace test keys with live keys in environment variables
2. Update webhook URL to production domain
3. Test with a small real transaction
4. Monitor webhook logs in Razorpay dashboard

## Important Notes

- **Never commit API keys to version control**
- **Use test mode during development**
- **Webhook secret is required for webhook verification**
- **Keep webhook URL accessible (no authentication required)**
- **Monitor webhook logs for failed deliveries**

## Support

- Razorpay Docs: https://razorpay.com/docs/
- Razorpay Support: support@razorpay.com

