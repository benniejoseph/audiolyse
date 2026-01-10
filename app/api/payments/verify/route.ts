import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { checkRateLimit, getClientIdentifier } from '@/lib/rateLimit';

// Dynamic import for Razorpay
let Razorpay: any;
if (typeof window === 'undefined') {
  Razorpay = require('razorpay');
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

export async function POST(request: NextRequest) {
  try {
    // 1. Rate limiting for payment endpoints
    const clientId = getClientIdentifier(request.headers);
    const rateLimitResult = checkRateLimit(clientId, 'payment');
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many payment requests. Please try again later.' },
        { 
          status: 429,
          headers: { 'Retry-After': String(Math.ceil(rateLimitResult.resetIn / 1000)) }
        }
      );
    }

    // 2. Auth check
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 3. Service client setup
    let serviceClient;
    try {
      serviceClient = createServiceClient();
    } catch (e: any) {
      return NextResponse.json({ 
        error: 'Server configuration error'
      }, { status: 500 });
    }

    const body = await request.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, credits, amount, currency } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ error: 'Missing payment verification data' }, { status: 400 });
    }

    // 4. Check idempotency - prevent double-processing
    const idempotencyKey = `${razorpay_order_id}_${razorpay_payment_id}`;
    const { data: existingPayment } = await serviceClient
      .from('payment_idempotency')
      .select('id, status')
      .or(`razorpay_order_id.eq.${razorpay_order_id},razorpay_payment_id.eq.${razorpay_payment_id}`)
      .eq('status', 'completed')
      .maybeSingle();

    if (existingPayment) {
      // Payment already processed - return success without reprocessing
      return NextResponse.json({
        success: true,
        message: 'Payment already processed',
        transactionId: existingPayment.id,
        paymentId: razorpay_payment_id,
        alreadyProcessed: true,
      });
    }

    // 5. Verify the payment signature
    const text = `${razorpay_order_id}|${razorpay_payment_id}`;
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
      .update(text)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 });
    }

    // 6. Verify payment with Razorpay
    const razorpay = getRazorpayInstance();
    const payment = await razorpay.payments.fetch(razorpay_payment_id);

    if (payment.status !== 'captured' && payment.status !== 'authorized') {
      return NextResponse.json({ error: 'Payment not successful' }, { status: 400 });
    }

    // 7. Get organization
    const { data: membership, error: membershipError } = await serviceClient
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (membershipError || !membership?.organization_id) {
      return NextResponse.json({ 
        error: 'No organization found. Please contact support.'
      }, { status: 404 });
    }

    // 8. Record payment attempt (idempotency)
    await serviceClient
      .from('payment_idempotency')
      .insert({
        idempotency_key: idempotencyKey,
        razorpay_order_id,
        razorpay_payment_id,
        organization_id: membership.organization_id,
        user_id: user.id,
        credits,
        amount,
        currency,
        status: 'pending',
      });

    // 9. Add credits to the organization
    const { data: transactionId, error: creditError } = await serviceClient.rpc('add_credits', {
      org_id: membership.organization_id,
      user_id: user.id,
      credits: credits,
      amount_paid: amount,
      currency_type: currency,
      description: `Purchased ${credits} credits via Razorpay (Order: ${razorpay_order_id})`,
    });

    if (creditError) {
      // Mark payment as failed
      await serviceClient
        .from('payment_idempotency')
        .update({ status: 'failed' })
        .eq('idempotency_key', idempotencyKey);
      
      return NextResponse.json({ error: 'Failed to add credits' }, { status: 500 });
    }

    // 10. Mark payment as completed
    await serviceClient
      .from('payment_idempotency')
      .update({ status: 'completed', processed_at: new Date().toISOString() })
      .eq('idempotency_key', idempotencyKey);

    // 11. Generate invoice (non-blocking)
    let invoiceNumber: string | undefined;
    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    try {
      const invoiceResponse = await fetch(`${origin}/api/invoice/generate`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Cookie': request.headers.get('cookie') || '', // Pass auth cookies
        },
        body: JSON.stringify({
          type: 'credits',
          paymentId: razorpay_payment_id,
          amount,
          currency,
          credits,
        }),
      });
      const invoiceData = await invoiceResponse.json();
      if (invoiceData.success) {
        invoiceNumber = invoiceData.invoiceNumber;
      }
    } catch {
      // Non-critical - invoice can be regenerated later
    }

    // 12. Send email receipt (non-blocking)
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
            credits,
            amount,
            currency,
            transactionId: transactionId || razorpay_payment_id,
            date: new Date().toISOString(),
            invoiceNumber,
          }),
        }).catch(() => {}); // Fire and forget
      }
    } catch {
      // Don't fail the payment if email fails
    }

    return NextResponse.json({
      success: true,
      message: 'Payment verified and credits added successfully',
      transactionId,
      paymentId: razorpay_payment_id,
      invoiceNumber,
    });
  } catch (error) {
    // Generic error - don't expose details in production
    const message = process.env.NODE_ENV === 'production' 
      ? 'Failed to verify payment' 
      : (error instanceof Error ? error.message : 'Unknown error');
    
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
