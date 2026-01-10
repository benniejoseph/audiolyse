import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import Razorpay from 'razorpay';
import { SUBSCRIPTION_LIMITS, type SubscriptionTier } from '@/lib/types/database';
import { checkRateLimit, getClientIdentifier } from '@/lib/rateLimit';

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

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientId = getClientIdentifier(request.headers);
    const rateLimitResult = checkRateLimit(clientId, 'payment');
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(rateLimitResult.resetIn / 1000)) } }
      );
    }

    // Use regular client for auth check
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use service client to bypass RLS
    let serviceClient;
    try {
      serviceClient = createServiceClient();
    } catch {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const body = await request.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, tier, amount, currency, billingInterval = 'monthly' } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !tier) {
      return NextResponse.json({ error: 'Missing payment verification data' }, { status: 400 });
    }

    // Check idempotency - prevent double-processing
    const idempotencyKey = `sub_${razorpay_order_id}_${razorpay_payment_id}`;
    const { data: existingPayment } = await serviceClient
      .from('payment_idempotency')
      .select('id, status')
      .eq('razorpay_payment_id', razorpay_payment_id)
      .eq('status', 'completed')
      .maybeSingle();

    if (existingPayment) {
      return NextResponse.json({
        success: true,
        message: 'Subscription already activated',
        paymentId: razorpay_payment_id,
        tier: tier,
        alreadyProcessed: true,
      });
    }

    // Verify the payment signature
    const text = `${razorpay_order_id}|${razorpay_payment_id}`;
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
      .update(text)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 });
    }

    // Verify payment with Razorpay
    const razorpay = getRazorpayInstance();
    const payment = await razorpay.payments.fetch(razorpay_payment_id);

    if (payment.status !== 'captured' && payment.status !== 'authorized') {
      return NextResponse.json({ error: 'Payment not successful' }, { status: 400 });
    }

    // Get organization
    const { data: membership } = await serviceClient
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!membership?.organization_id) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    // Record payment attempt
    await serviceClient
      .from('payment_idempotency')
      .insert({
        idempotency_key: idempotencyKey,
        razorpay_order_id,
        razorpay_payment_id,
        organization_id: membership.organization_id,
        user_id: user.id,
        credits: 0,
        amount,
        currency,
        status: 'pending',
        metadata: { type: 'subscription', tier, billingInterval },
      });

    // Update organization subscription
    const limits = SUBSCRIPTION_LIMITS[tier as SubscriptionTier];
    const now = new Date();
    const periodEnd = new Date(now);
    
    // Set period end based on billing interval
    if (billingInterval === 'annual') {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    } else {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    }

    const { error: updateError } = await serviceClient
      .from('organizations')
      .update({
        subscription_tier: tier as SubscriptionTier,
        subscription_status: 'active',
        calls_limit: limits.calls,
        storage_limit_mb: limits.storageMb,
        users_limit: limits.users,
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
        calls_used: 0,
        billing_interval: billingInterval,
        annual_discount_applied: billingInterval === 'annual',
        updated_at: now.toISOString(),
      })
      .eq('id', membership.organization_id);

    if (updateError) {
      await serviceClient
        .from('payment_idempotency')
        .update({ status: 'failed' })
        .eq('idempotency_key', idempotencyKey);
      return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 });
    }

    // Mark payment as completed
    await serviceClient
      .from('payment_idempotency')
      .update({ status: 'completed', processed_at: new Date().toISOString() })
      .eq('idempotency_key', idempotencyKey);

    // Generate invoice (non-blocking)
    let invoiceNumber: string | undefined;
    const origin = process.env.NEXT_PUBLIC_SITE_URL || 'https://audiolyse.com';
    try {
      const invoiceResponse = await fetch(`${origin}/api/invoice/generate`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Cookie': request.headers.get('cookie') || '', // Pass auth cookies
        },
        body: JSON.stringify({
          type: 'subscription',
          paymentId: razorpay_payment_id,
          amount,
          currency,
          tier,
          billingInterval,
        }),
      });
      const invoiceData = await invoiceResponse.json();
      if (invoiceData.success) {
        invoiceNumber = invoiceData.invoiceNumber;
      }
    } catch {
      // Non-critical - invoice can be regenerated later
    }

    // Send email receipt (non-blocking)
    try {
      const { data: profile } = await serviceClient
        .from('profiles')
        .select('email')
        .eq('id', user.id)
        .maybeSingle();

      if (profile?.email) {
        fetch(`${origin}/api/email/send-receipt`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: profile.email,
            credits: 0,
            amount,
            currency,
            transactionId: razorpay_payment_id,
            date: new Date().toISOString(),
            subscriptionTier: tier,
            billingInterval: billingInterval,
            invoiceNumber,
          }),
        }).catch(() => {});
      }
    } catch {
      // Non-critical
    }

    return NextResponse.json({
      success: true,
      message: 'Subscription activated successfully',
      paymentId: razorpay_payment_id,
      tier: tier,
      billingInterval: billingInterval,
      invoiceNumber,
    });
  } catch (error) {
    const message = process.env.NODE_ENV === 'production' 
      ? 'Failed to verify payment' 
      : (error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
