import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@/lib/supabase/server';
import Razorpay from 'razorpay';
import { SUBSCRIPTION_LIMITS, type SubscriptionTier } from '@/lib/types/database';

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

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, tier, amount, currency } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !tier) {
      return NextResponse.json({ error: 'Missing payment verification data' }, { status: 400 });
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
    const { data: membership } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Update organization subscription
    const limits = SUBSCRIPTION_LIMITS[tier as SubscriptionTier];
    const now = new Date();
    const nextMonth = new Date(now);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    const { error: updateError } = await supabase
      .from('organizations')
      .update({
        subscription_tier: tier as SubscriptionTier,
        subscription_status: 'active',
        calls_limit: limits.calls,
        storage_limit_mb: limits.storageMb,
        users_limit: limits.users,
        current_period_start: now.toISOString(),
        current_period_end: nextMonth.toISOString(),
        calls_used: 0, // Reset usage for new subscription
        updated_at: now.toISOString(),
      })
      .eq('id', membership.organization_id);

    if (updateError) {
      console.error('Error updating subscription:', updateError);
      return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 });
    }

    // Send email receipt
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', user.id)
        .single();

      if (profile?.email) {
        const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
        await fetch(`${origin}/api/email/send-receipt`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: profile.email,
            credits: 0, // Not applicable for subscriptions
            amount: amount,
            currency: currency,
            transactionId: razorpay_payment_id,
            date: new Date().toISOString(),
            subscriptionTier: tier,
          }),
        });
      }
    } catch (emailError) {
      console.error('Error sending receipt email:', emailError);
      // Don't fail the payment if email fails
    }

    return NextResponse.json({
      success: true,
      message: 'Subscription activated successfully',
      paymentId: razorpay_payment_id,
      tier: tier,
    });
  } catch (error) {
    console.error('Error verifying subscription payment:', error);
    return NextResponse.json(
      {
        error: 'Failed to verify payment',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

