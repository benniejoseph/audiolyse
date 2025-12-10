import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
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
    } catch (e: any) {
      console.error('Service client error:', e.message);
      return NextResponse.json({ 
        error: 'Server configuration error',
        details: 'SUPABASE_SERVICE_ROLE_KEY is not configured. Please add it to your Vercel environment variables.'
      }, { status: 500 });
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

    // Get organization using service client (bypasses RLS)
    const { data: membership, error: membershipError } = await serviceClient
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (membershipError) {
      console.error('Error fetching organization membership:', membershipError);
      return NextResponse.json({ 
        error: 'Failed to fetch organization',
        details: membershipError.message 
      }, { status: 500 });
    }

    if (!membership || !membership.organization_id) {
      console.error('No organization found for user:', user.id);
      return NextResponse.json({ 
        error: 'No organization found. Please contact support.',
        details: 'Your account may not have an organization set up. Please contact support to resolve this issue.'
      }, { status: 404 });
    }

    // Get subscription price
    const limits = SUBSCRIPTION_LIMITS[tier as SubscriptionTier];
    const amount = limits.price[currency as 'INR' | 'USD'];

    if (amount === 0) {
      return NextResponse.json({ error: 'Invalid subscription tier' }, { status: 400 });
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
      receipt: `subscription_${tier}_${Date.now()}`,
      notes: {
        subscription_tier: tier,
        organization_id: membership.organization_id,
        user_id: user.id,
        description: `Subscribe to ${tier} plan`,
        type: 'subscription',
      },
    };

    let order;
    try {
      const razorpay = getRazorpayInstance();
      order = await razorpay.orders.create(orderOptions);
    } catch (razorpayError: any) {
      console.error('Razorpay API error:', razorpayError);
      return NextResponse.json(
        { 
          error: 'Failed to create payment order',
          details: razorpayError?.error?.description || razorpayError?.message || 'Razorpay API error',
          code: razorpayError?.error?.code || 'RAZORPAY_ERROR'
        },
        { status: 500 }
      );
    }

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
    
    // Check if it's a Razorpay-specific error
    if (error && typeof error === 'object' && 'error' in error) {
      const razorpayError = (error as any).error;
      return NextResponse.json(
        { 
          error: 'Failed to create payment order',
          details: razorpayError?.description || razorpayError?.message || 'Razorpay API error',
          code: razorpayError?.code || 'RAZORPAY_ERROR'
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to create payment order',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
