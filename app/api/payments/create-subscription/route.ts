import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { SUBSCRIPTION_LIMITS, type SubscriptionTier } from '@/lib/types/database';
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
    const { tier, currency, billingInterval = 'monthly' } = body;

    if (!tier || !currency) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Validate billing interval
    const validIntervals = ['monthly', 'annual'];
    if (!validIntervals.includes(billingInterval)) {
      return NextResponse.json({ error: 'Invalid billing interval' }, { status: 400 });
    }

    // Validate tier
    const validTiers: SubscriptionTier[] = ['individual', 'team', 'enterprise'];
    if (!validTiers.includes(tier as SubscriptionTier)) {
      return NextResponse.json({ error: 'Invalid subscription tier' }, { status: 400 });
    }

    // Get organization using service client (bypasses RLS)
    const { data: membership, error: membershipError } = await serviceClient
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (membershipError || !membership?.organization_id) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    // Get subscription price
    const limits = SUBSCRIPTION_LIMITS[tier as SubscriptionTier];
    const baseMonthlyPrice = limits.price[currency as 'INR' | 'USD'];

    if (baseMonthlyPrice === 0) {
      return NextResponse.json({ error: 'Invalid subscription tier' }, { status: 400 });
    }
    
    // Calculate amount based on billing interval
    // Annual billing gets 20% discount
    const ANNUAL_DISCOUNT = 0.20;
    let amount: number;
    let description: string;
    
    if (billingInterval === 'annual') {
      const discountedMonthly = Math.round(baseMonthlyPrice * (1 - ANNUAL_DISCOUNT));
      amount = discountedMonthly * 12; // Full year upfront
      description = `${tier} plan (Annual - ${Math.round(ANNUAL_DISCOUNT * 100)}% discount)`;
    } else {
      amount = baseMonthlyPrice;
      description = `${tier} plan (Monthly)`;
    }

    // Validate minimum amount (Razorpay minimum: 1 INR or 0.01 USD)
    const minAmount = currency === 'INR' ? 1 : 0.01;
    if (amount < minAmount) {
      return NextResponse.json({ 
        error: `Minimum amount is ${currency === 'INR' ? '₹' : '$'}${minAmount}` 
      }, { status: 400 });
    }

    // Create Razorpay order
    // Razorpay expects amount in smallest currency unit (paise for INR, cents for USD)
    const amountInSmallestUnit = Math.round(amount * 100);
    
    // Ensure minimum amount (100 paise = 1 INR, 1 cent = 0.01 USD)
    if (amountInSmallestUnit < (currency === 'INR' ? 100 : 1)) {
      return NextResponse.json({ 
        error: `Amount too small. Minimum is ${currency === 'INR' ? '₹1' : '$0.01'}` 
      }, { status: 400 });
    }

    const orderOptions: any = {
      amount: amountInSmallestUnit,
      currency: currency === 'INR' ? 'INR' : 'USD',
      receipt: `subscription_${tier}_${billingInterval}_${Date.now()}`,
      notes: {
        subscription_tier: tier,
        billing_interval: billingInterval,
        organization_id: membership.organization_id,
        user_id: user.id,
        description: description,
        type: 'subscription',
      },
    };

    let order;
    try {
      const razorpay = getRazorpayInstance();
      order = await razorpay.orders.create(orderOptions);
    } catch {
      return NextResponse.json({ error: 'Failed to create payment order' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID,
      tier: tier,
      billingInterval: billingInterval,
    });
  } catch {
    return NextResponse.json({ error: 'Failed to create payment order' }, { status: 500 });
  }
}
