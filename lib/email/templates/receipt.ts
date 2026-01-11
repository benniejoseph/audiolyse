import { sendEmail, wrapEmailTemplate, EMAIL_CONFIG } from '../client';

interface ReceiptEmailData {
  email: string;
  name?: string;
  transactionId: string;
  date: string;
  amount: number;
  currency: 'INR' | 'USD';
  type: 'subscription' | 'credits';
  subscriptionTier?: string;
  credits?: number;
  invoiceUrl?: string;
}

/**
 * Send payment receipt email
 */
export async function sendReceiptEmail(data: ReceiptEmailData) {
  const {
    email,
    name,
    transactionId,
    date,
    amount,
    currency,
    type,
    subscriptionTier,
    credits,
    invoiceUrl,
  } = data;

  const greeting = name ? `Hi ${name},` : 'Hi,';
  const currencySymbol = currency === 'INR' ? '₹' : '$';
  const formattedAmount = `${currencySymbol}${amount.toFixed(2)}`;
  const formattedDate = new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const isSubscription = type === 'subscription';
  const tierName = subscriptionTier 
    ? subscriptionTier.charAt(0).toUpperCase() + subscriptionTier.slice(1)
    : '';

  const content = `
    <p style="margin-top: 0;">${greeting}</p>
    
    <p>Thank you for your payment! Here's your receipt.</p>
    
    <div style="background: #f9fafb; border: 2px solid #e5e7eb; border-radius: 12px; padding: 24px; margin: 24px 0;">
      <div style="text-align: center; margin-bottom: 20px;">
        <span style="font-size: 48px;">🧾</span>
        <h2 style="margin: 8px 0 0 0; color: #111827;">Payment Receipt</h2>
      </div>
      
      <table style="width: 100%; border-collapse: collapse;">
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 12px 0; color: #6b7280;">Transaction ID</td>
          <td style="padding: 12px 0; text-align: right; font-weight: 600; color: #111827;">${transactionId}</td>
        </tr>
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 12px 0; color: #6b7280;">Date</td>
          <td style="padding: 12px 0; text-align: right; font-weight: 600; color: #111827;">${formattedDate}</td>
        </tr>
        ${isSubscription ? `
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 12px 0; color: #6b7280;">Plan</td>
          <td style="padding: 12px 0; text-align: right; font-weight: 600; color: #111827;">${tierName} Plan</td>
        </tr>
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 12px 0; color: #6b7280;">Billing</td>
          <td style="padding: 12px 0; text-align: right; font-weight: 600; color: #111827;">Monthly</td>
        </tr>
        ` : `
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 12px 0; color: #6b7280;">Credits</td>
          <td style="padding: 12px 0; text-align: right; font-weight: 600; color: #111827;">${credits} credits</td>
        </tr>
        `}
        <tr>
          <td style="padding: 16px 0; color: #111827; font-weight: 600; font-size: 18px;">Total Paid</td>
          <td style="padding: 16px 0; text-align: right; font-weight: 700; font-size: 24px; color: #00d9ff;">${formattedAmount}</td>
        </tr>
      </table>
    </div>
    
    <p style="color: #374151;">
      ${isSubscription 
        ? `Your ${tierName} subscription is now active! You can start using all the premium features.`
        : `Your ${credits} credits have been added to your account and are ready to use.`
      }
    </p>
    
    <div style="text-align: center; margin: 32px 0;">
      <a href="${EMAIL_CONFIG.siteUrl}/dashboard" class="btn">Go to Dashboard</a>
      ${invoiceUrl ? `<a href="${invoiceUrl}" class="btn btn-secondary" style="margin-left: 12px;">Download Invoice</a>` : ''}
    </div>
    
    <div class="divider"></div>
    
    <p class="text-muted">
      This receipt confirms your payment. Keep this email for your records.
      For billing questions, contact us at <a href="mailto:billing@audiolyse.com" style="color: #00d9ff;">billing@audiolyse.com</a>
    </p>
  `;

  return sendEmail({
    to: email,
    subject: isSubscription 
      ? `Payment Receipt - ${tierName} Plan Subscription`
      : `Payment Receipt - ${credits} Credits Purchased`,
    html: wrapEmailTemplate(content, `Your payment of ${formattedAmount} was successful`),
    tags: [
      { name: 'type', value: 'receipt' },
      { name: 'payment_type', value: type },
    ],
  });
}
