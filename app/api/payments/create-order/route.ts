import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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
    const { credits, amount, currency, description } = body;

    if (!credits || !amount || !currency) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get organization
    const { data: membership, error: membershipError } = await supabase
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

    // Get user profile for name
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', user.id)
      .single();

    // Create Razorpay order
    const orderOptions = {
      amount: Math.round(amount * 100), // Convert to paise (for INR) or cents
      currency: currency === 'INR' ? 'INR' : 'USD',
      receipt: `credits_${credits}_${Date.now()}`,
      notes: {
        credits: credits.toString(),
        organization_id: membership.organization_id,
        user_id: user.id,
        description: description || `Purchase ${credits} credits`,
      },
    };

    const razorpay = getRazorpayInstance();
    const order = await razorpay.orders.create(orderOptions);

    return NextResponse.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID, // Frontend needs this for Razorpay Checkout
    });
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create payment order',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

