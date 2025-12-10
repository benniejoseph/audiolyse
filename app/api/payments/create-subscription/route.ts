import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SUBSCRIPTION_LIMITS, type SubscriptionTier } from '@/lib/types/database';

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

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { tier, currency } = body;

    if (!tier || !currency) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate tier
    const validTiers: SubscriptionTier[] = ['individual', 'team', 'enterprise'];
    if (!validTiers.includes(tier as SubscriptionTier)) {
      return NextResponse.json({ error: 'Invalid subscription tier' }, { status: 400 });
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

    // Get subscription price
    const limits = SUBSCRIPTION_LIMITS[tier as SubscriptionTier];
    const amount = limits.price[currency as 'INR' | 'USD'];

    if (amount === 0) {
      return NextResponse.json({ error: 'Invalid subscription tier' }, { status: 400 });
    }

    // Create Razorpay order
    const orderOptions = {
      amount: Math.round(amount * 100), // Convert to paise (for INR) or cents
      currency: currency === 'INR' ? 'INR' : 'USD',
      receipt: `subscription_${tier}_${Date.now()}`,
      notes: {
        subscription_tier: tier,
        organization_id: membership.organization_id,
        user_id: user.id,
        description: `Subscribe to ${tier} plan`,
        type: 'subscription',
      },
    };

    const razorpay = getRazorpayInstance();
    const order = await razorpay.orders.create(orderOptions);

    return NextResponse.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID,
      tier: tier,
    });
  } catch (error) {
    console.error('Error creating subscription order:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create payment order',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

