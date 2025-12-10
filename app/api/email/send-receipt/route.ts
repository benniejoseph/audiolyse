import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// Email service configuration
// You can use services like Resend, SendGrid, or AWS SES
const EMAIL_SERVICE_URL = process.env.EMAIL_SERVICE_URL || '';
const EMAIL_API_KEY = process.env.EMAIL_API_KEY || '';

interface ReceiptData {
  email: string;
  credits: number;
  amount: number;
  currency: 'INR' | 'USD';
  transactionId: string;
  date: string;
}

async function sendEmail(to: string, subject: string, html: string) {
  // TODO: Integrate with your email service provider
  // Example using Resend:
  /*
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${EMAIL_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Audiolyse <receipts@audiolyse.com>',
      to: [to],
      subject,
      html,
    }),
  });
  return res.json();
  */

  // For now, just log the email (replace with actual email service)
  console.log('Email would be sent:', { to, subject, html });
  return { success: true };
}

export async function POST(request: Request) {
  try {
    const body: ReceiptData = await request.json();
    const { email, credits, amount, currency, transactionId, date } = body;

    const currencySymbol = currency === 'INR' ? '₹' : '$';
    const formattedAmount = `${currencySymbol}${amount.toFixed(2)}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #00d9ff, #8b5cf6); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .header h1 { color: #fff; margin: 0; font-size: 24px; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .receipt-box { background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0; }
            .receipt-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
            .receipt-row:last-child { border-bottom: none; }
            .label { color: #6b7280; font-weight: 500; }
            .value { color: #111827; font-weight: 600; }
            .total { font-size: 18px; color: #00d9ff; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Audiolyse - Credit Purchase Receipt</h1>
            </div>
            <div class="content">
              <p>Thank you for your purchase!</p>
              <div class="receipt-box">
                <div class="receipt-row">
                  <span class="label">Transaction ID:</span>
                  <span class="value">${transactionId}</span>
                </div>
                <div class="receipt-row">
                  <span class="label">Date:</span>
                  <span class="value">${date}</span>
                </div>
                <div class="receipt-row">
                  <span class="label">Credits Purchased:</span>
                  <span class="value">${credits} credits</span>
                </div>
                <div class="receipt-row">
                  <span class="label">Amount:</span>
                  <span class="value">${formattedAmount}</span>
                </div>
                <div class="receipt-row total">
                  <span class="label">Total:</span>
                  <span class="value">${formattedAmount}</span>
                </div>
              </div>
              <p>Your credits have been added to your account and are ready to use.</p>
              <p>If you have any questions, please contact our support team.</p>
              <div class="footer">
                <p>© 2024 Audiolyse. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    await sendEmail(email, `Credit Purchase Receipt - ${transactionId}`, html);

    return NextResponse.json({ success: true, message: 'Receipt sent successfully' });
  } catch (error) {
    console.error('Error sending receipt:', error);
    return NextResponse.json({ error: 'Failed to send receipt' }, { status: 500 });
  }
}

