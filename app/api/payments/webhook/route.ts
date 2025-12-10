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
const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || '';

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-razorpay-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac('sha256', WEBHOOK_SECRET)
      .update(body)
      .digest('hex');

    if (signature !== expectedSignature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event = JSON.parse(body);
    const { event: eventType, payload } = event;

    // Handle payment success events
    if (eventType === 'payment.captured' || eventType === 'payment.authorized') {
      const payment = payload.payment.entity;
      const order = payload.order.entity;

      // Get metadata from order notes
      const credits = parseInt(order.notes?.credits || '0');
      const organizationId = order.notes?.organization_id;
      const userId = order.notes?.user_id;

      if (!credits || !organizationId || !userId) {
        console.error('Missing metadata in order notes');
        return NextResponse.json({ error: 'Invalid order metadata' }, { status: 400 });
      }

      // Use service client to bypass RLS
      const supabase = createServiceClient();
      
      // Add credits (if not already added)
      const { data: transactionId, error: creditError } = await supabase.rpc('add_credits', {
        org_id: organizationId,
        user_id: userId,
        credits: credits,
        amount_paid: payment.amount / 100, // Convert from paise/cents
        currency_type: payment.currency === 'INR' ? 'INR' : 'USD',
        description: `Purchased ${credits} credits via Razorpay (Payment: ${payment.id})`,
      });

      if (creditError) {
        console.error('Error adding credits via webhook:', creditError);
        // Don't return error - webhook should acknowledge receipt
      }

      // Send email receipt
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', userId)
          .maybeSingle();

        if (profile?.email) {
          const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
          await fetch(`${origin}/api/email/send-receipt`, {
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
          });
        }
      } catch (emailError) {
        console.error('Error sending receipt email via webhook:', emailError);
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
