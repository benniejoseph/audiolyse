import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { 
  createSubscriptionInvoice, 
  createCreditsInvoice, 
  generateInvoiceNumber,
  calculateTax,
  type InvoiceData 
} from '@/lib/invoice/generator';

export async function POST(request: NextRequest) {
  try {
    // Auth check
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let serviceClient;
    try {
      serviceClient = createServiceClient();
    } catch {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const body = await request.json();
    const { 
      type, // 'subscription' or 'credits'
      paymentId,
      amount,
      currency,
      // For subscriptions
      tier,
      billingInterval,
      // For credits
      credits,
    } = body;

    if (!type || !paymentId || !amount || !currency) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get user profile
    const { data: profile } = await serviceClient
      .from('profiles')
      .select('full_name, email')
      .eq('id', user.id)
      .single();

    // Get organization
    const { data: membership } = await serviceClient
      .from('organization_members')
      .select('organization_id, organization:organizations(name)')
      .eq('user_id', user.id)
      .maybeSingle();

    const customerName = profile?.full_name || user.email?.split('@')[0] || 'Customer';
    const customerEmail = profile?.email || user.email || '';
    const organizationName = (membership?.organization as any)?.name;

    // Generate invoice data based on type
    let invoiceData: InvoiceData;

    if (type === 'subscription') {
      if (!tier || !billingInterval) {
        return NextResponse.json({ error: 'Missing subscription details' }, { status: 400 });
      }
      invoiceData = createSubscriptionInvoice({
        tier,
        amount,
        currency,
        paymentId,
        customerName,
        customerEmail,
        organizationName,
        billingInterval,
      });
    } else if (type === 'credits') {
      if (!credits) {
        return NextResponse.json({ error: 'Missing credits amount' }, { status: 400 });
      }
      invoiceData = createCreditsInvoice({
        credits,
        amount,
        currency,
        paymentId,
        customerName,
        customerEmail,
        organizationName,
      });
    } else {
      return NextResponse.json({ error: 'Invalid invoice type' }, { status: 400 });
    }

    // Store invoice in payment_receipts table
    const { data: receipt, error: receiptError } = await serviceClient
      .from('payment_receipts')
      .insert({
        organization_id: membership?.organization_id,
        user_id: user.id,
        payment_id: paymentId,
        invoice_number: invoiceData.invoiceNumber,
        amount: invoiceData.total,
        currency: currency,
        payment_type: type,
        payment_method: 'razorpay',
        status: 'completed',
        invoice_data: invoiceData as any, // Store full invoice data as JSON
        metadata: {
          tier,
          credits,
          billingInterval,
          tax: invoiceData.tax,
          discount: invoiceData.discount,
        },
      })
      .select('id')
      .single();

    if (receiptError) {
      console.error('Error storing receipt:', receiptError);
      // Don't fail - invoice generation succeeded
    }

    return NextResponse.json({
      success: true,
      invoiceNumber: invoiceData.invoiceNumber,
      invoiceData,
      receiptId: receipt?.id,
    });
  } catch (error) {
    console.error('Invoice generation error:', error);
    return NextResponse.json({ error: 'Failed to generate invoice' }, { status: 500 });
  }
}
