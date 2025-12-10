import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

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
    const { data: membership } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // TODO: Integrate with payment gateway (Stripe/Razorpay)
    // For now, we'll simulate successful payment and add credits
    
    // Call the add_credits function
    const { data, error } = await supabase.rpc('add_credits', {
      org_id: membership.organization_id,
      user_id: user.id,
      credits: credits,
      amount_paid: amount,
      currency_type: currency,
      description: description || `Purchased ${credits} credits`,
    });

    if (error) {
      console.error('Error adding credits:', error);
      return NextResponse.json({ error: 'Failed to add credits' }, { status: 500 });
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
            credits,
            amount,
            currency,
            transactionId: data,
            date: new Date().toISOString(),
          }),
        });
      }
    } catch (emailError) {
      console.error('Error sending receipt email:', emailError);
      // Don't fail the purchase if email fails
    }

    return NextResponse.json({ 
      success: true, 
      transactionId: data,
      message: 'Credits added successfully' 
    });
  } catch (error) {
    console.error('Purchase error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

