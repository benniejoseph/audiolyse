import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

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

    const body = await request.json();
    const { credits, amount, currency, description } = body;

    if (!credits || !amount || !currency) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate minimum amount (Razorpay minimum: 1 INR or 0.01 USD)
    const minAmount = currency === 'INR' ? 1 : 0.01;
    if (amount < minAmount) {
      return NextResponse.json({ 
        error: `Minimum amount is ${currency === 'INR' ? '₹' : '$'}${minAmount}` 
      }, { status: 400 });
    }

    // Use service role client to bypass RLS for organization lookup
    let serviceClient;
    try {
      serviceClient = createServiceClient();
    } catch (e) {
      console.error('Service client not configured, using regular client');
      serviceClient = supabase;
    }

    // Get organization using service client (bypasses RLS)
    let { data: membership, error: membershipError } = await serviceClient
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

    // If no organization, try to create one using service client
    if (!membership || !membership.organization_id) {
      console.warn('No organization found for user, attempting to create one:', user.id);
      
      // Call the ensure organization endpoint logic inline
      const user_name = user.user_metadata?.full_name || 
                       user.user_metadata?.name || 
                       user.email?.split('@')[0] || 
                       'User';
      
      // Ensure profile exists (using service client)
      const { data: profile } = await serviceClient
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (!profile) {
        await serviceClient
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email || '',
            full_name: user_name,
          });
      }

      // Create organization (using service client)
      const org_slug = user.email 
        ? (user.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Math.random().toString(36).substring(2, 10))
        : ('user-' + Math.random().toString(36).substring(2, 10));

      const { data: newOrg, error: createOrgError } = await serviceClient
        .from('organizations')
        .insert({
          name: `${user_name}'s Workspace`,
          slug: org_slug,
          owner_id: user.id,
          billing_email: user.email || null,
          subscription_tier: 'free',
          subscription_status: 'active',
          calls_limit: 10,
          calls_used: 0,
          storage_limit_mb: 100,
          storage_used_mb: 0,
          users_limit: 1,
          daily_reset_date: new Date().toISOString().split('T')[0],
          credits_balance: 0,
        })
        .select()
        .single();

      if (createOrgError || !newOrg) {
        console.error('Error creating organization:', createOrgError);
        return NextResponse.json({ 
          error: 'Failed to create organization',
          details: createOrgError?.message || 'Unknown error'
        }, { status: 500 });
      }

      // Create membership (using service client)
      const { error: memberError } = await serviceClient
        .from('organization_members')
        .insert({
          organization_id: newOrg.id,
          user_id: user.id,
          role: 'owner',
        });

      if (memberError) {
        console.error('Error creating membership:', memberError);
        return NextResponse.json({ 
          error: 'Failed to create organization membership',
          details: memberError.message 
        }, { status: 500 });
      }

      membership = { organization_id: newOrg.id };
    }

    // Get user profile for name (optional - not required for order creation)
    const { data: profile } = await serviceClient
      .from('profiles')
      .select('email, full_name')
      .eq('id', user.id)
      .maybeSingle();

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
      receipt: `credits_${credits}_${Date.now()}`,
      notes: {
        credits: credits.toString(),
        organization_id: membership.organization_id,
        user_id: user.id,
        description: description || `Purchase ${credits} credits`,
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
      key: process.env.RAZORPAY_KEY_ID, // Frontend needs this for Razorpay Checkout
    });
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    
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

