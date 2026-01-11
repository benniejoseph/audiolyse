import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Dynamic import for Razorpay
let Razorpay: any;
if (typeof window === 'undefined') {
  Razorpay = require('razorpay');
}

// Create a service client for webhooks (bypasses RLS)
function createServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase URL or Service Role Key not configured');
  }

  return createSupabaseClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// Initialize Razorpay
function getRazorpayInstance() {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error('Razorpay credentials not configured');
  }
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

// Webhook secret from Razorpay dashboard
const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET;

export async function POST(request: Request) {
  try {
    // CRITICAL: Fail if webhook secret is not configured
    if (!WEBHOOK_SECRET) {
      console.error('[Webhook] RAZORPAY_WEBHOOK_SECRET is not configured');
      return NextResponse.json(
        { error: 'Webhook not configured' }, 
        { status: 500 }
      );
    }

    const body = await request.text();
    const signature = request.headers.get('x-razorpay-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    // Verify webhook signature with constant-time comparison
    const expectedSignature = crypto
      .createHmac('sha256', WEBHOOK_SECRET)
      .update(body)
      .digest('hex');

    // Use timing-safe comparison to prevent timing attacks
    if (!crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    )) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event = JSON.parse(body);
    const { event: eventType, payload } = event;

    // Handle payment success events
    if (eventType === 'payment.captured' || eventType === 'payment.authorized') {
      const payment = payload.payment.entity;
      const order = payload.order?.entity;

      // Get metadata from order notes
      const credits = parseInt(order?.notes?.credits || '0');
      const organizationId = order?.notes?.organization_id;
      const userId = order?.notes?.user_id;

      if (!credits || !organizationId || !userId) {
        // Log but acknowledge - might be a different type of payment
        console.warn('[Webhook] Missing metadata in order notes:', { credits, organizationId, userId });
        return NextResponse.json({ received: true, skipped: 'missing_metadata' });
      }

      // Use service client to bypass RLS
      const supabase = createServiceClient();
      
      // Check idempotency - prevent double-processing
      const idempotencyKey = `webhook_${order.id}_${payment.id}`;
      const { data: existingPayment } = await supabase
        .from('payment_idempotency')
        .select('id, status')
        .eq('razorpay_payment_id', payment.id)
        .eq('status', 'completed')
        .maybeSingle();

      if (existingPayment) {
        // Already processed - acknowledge webhook
        return NextResponse.json({ received: true, alreadyProcessed: true });
      }

      // Record attempt
      await supabase
        .from('payment_idempotency')
        .upsert({
          idempotency_key: idempotencyKey,
          razorpay_order_id: order.id,
          razorpay_payment_id: payment.id,
          organization_id: organizationId,
          user_id: userId,
          credits,
          amount: payment.amount / 100,
          currency: payment.currency === 'INR' ? 'INR' : 'USD',
          status: 'pending',
        }, { onConflict: 'idempotency_key' });

      // Add credits
      const { data: transactionId, error: creditError } = await supabase.rpc('add_credits', {
        org_id: organizationId,
        user_id: userId,
        credits: credits,
        amount_paid: payment.amount / 100,
        currency_type: payment.currency === 'INR' ? 'INR' : 'USD',
        description: `Purchased ${credits} credits via Razorpay (Payment: ${payment.id})`,
      });

      if (creditError) {
        console.error('[Webhook] Error adding credits:', creditError);
        await supabase
          .from('payment_idempotency')
          .update({ status: 'failed' })
          .eq('idempotency_key', idempotencyKey);
      } else {
        // Mark as completed
        await supabase
          .from('payment_idempotency')
          .update({ status: 'completed', processed_at: new Date().toISOString() })
          .eq('idempotency_key', idempotencyKey);
      }

      // Send email receipt (non-blocking)
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', userId)
          .maybeSingle();

        if (profile?.email) {
          const origin = process.env.NEXT_PUBLIC_SITE_URL || 'https://audiolyse.com';
          fetch(`${origin}/api/email/send-receipt`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: profile.email,
              credits,
              amount: payment.amount / 100,
              currency: payment.currency === 'INR' ? 'INR' : 'USD',
              transactionId: transactionId || payment.id,
              date: new Date().toISOString(),
            }),
          }).catch(() => {});
        }
      } catch {
        // Non-critical
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
