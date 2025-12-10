import { NextResponse } from 'next/server';

// Mailchimp Mandrill configuration
// Get your API key from: https://mandrillapp.com/settings/index
const MANDRILL_API_KEY = process.env.MANDRILL_API_KEY || '';
const FROM_EMAIL = process.env.FROM_EMAIL || 'receipts@audiolyse.com';
const FROM_NAME = process.env.FROM_NAME || 'Audiolyse';

interface ReceiptData {
  email: string;
  credits?: number;
  amount: number;
  currency: 'INR' | 'USD';
  transactionId: string;
  date: string;
  subscriptionTier?: string;
}

async function sendEmailViaMandrill(to: string, subject: string, html: string) {
  if (!MANDRILL_API_KEY) {
    console.warn('MANDRILL_API_KEY not set, skipping email send');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    // Using Mandrill REST API
    const response = await fetch('https://mandrillapp.com/api/1.0/messages/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        key: MANDRILL_API_KEY,
        message: {
          html,
          subject,
          from_email: FROM_EMAIL,
          from_name: FROM_NAME,
          to: [
            {
              email: to,
              type: 'to',
            },
          ],
          important: false,
          track_opens: true,
          track_clicks: true,
          auto_text: true,
          auto_html: false,
          inline_css: true,
          preserve_recipients: false,
        },
      }),
    });

    const result = await response.json();

    if (response.ok && result[0]?.status === 'sent') {
      return { success: true, messageId: result[0]._id };
    } else {
      console.error('Mandrill API error:', result);
      return { success: false, error: result.message || 'Failed to send email' };
    }
  } catch (error) {
    console.error('Error sending email via Mandrill:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function POST(request: Request) {
  try {
    const body: ReceiptData = await request.json();
    const { email, credits, amount, currency, transactionId, date, subscriptionTier } = body;

    const currencySymbol = currency === 'INR' ? '₹' : '$';
    const formattedAmount = `${currencySymbol}${amount.toFixed(2)}`;
    const isSubscription = !!subscriptionTier;
    const tierName = subscriptionTier ? subscriptionTier.charAt(0).toUpperCase() + subscriptionTier.slice(1) : '';

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; 
              line-height: 1.6; 
              color: #333; 
              margin: 0; 
              padding: 0;
              background-color: #f4f4f4;
            }
            .email-container { 
              max-width: 600px; 
              margin: 0 auto; 
              background-color: #ffffff;
            }
            .header { 
              background: linear-gradient(135deg, #00d9ff, #8b5cf6); 
              padding: 40px 30px; 
              text-align: center; 
            }
            .header h1 { 
              color: #fff; 
              margin: 0; 
              font-size: 28px; 
              font-weight: 700;
            }
            .content { 
              padding: 40px 30px; 
            }
            .greeting {
              font-size: 16px;
              color: #333;
              margin-bottom: 20px;
            }
            .receipt-box { 
              background: #f9fafb; 
              border: 2px solid #e5e7eb; 
              border-radius: 12px; 
              padding: 24px; 
              margin: 24px 0; 
            }
            .receipt-row { 
              display: flex; 
              justify-content: space-between; 
              padding: 12px 0; 
              border-bottom: 1px solid #e5e7eb; 
            }
            .receipt-row:last-child { 
              border-bottom: none; 
            }
            .label { 
              color: #6b7280; 
              font-weight: 500; 
              font-size: 14px;
            }
            .value { 
              color: #111827; 
              font-weight: 600; 
              font-size: 14px;
            }
            .total { 
              font-size: 18px; 
              padding-top: 12px;
              margin-top: 12px;
              border-top: 2px solid #e5e7eb;
            }
            .total .value {
              color: #00d9ff;
              font-size: 20px;
            }
            .footer { 
              text-align: center; 
              margin-top: 40px; 
              padding-top: 30px;
              border-top: 1px solid #e5e7eb;
              color: #6b7280; 
              font-size: 12px; 
            }
            .footer a {
              color: #00d9ff;
              text-decoration: none;
            }
            .cta-button {
              display: inline-block;
              margin-top: 20px;
              padding: 12px 24px;
              background: linear-gradient(135deg, #00d9ff, #8b5cf6);
              color: #ffffff;
              text-decoration: none;
              border-radius: 8px;
              font-weight: 600;
            }
          </style>
        </head>
        <body>
          <div class="email-container">
            <div class="header">
              <h1>Audiolyse</h1>
            </div>
            <div class="content">
              <p class="greeting">Thank you for your purchase!</p>
              <p>${isSubscription ? `Your ${tierName} subscription has been successfully activated.` : 'Your credits have been successfully added to your account.'}</p>
              
              <div class="receipt-box">
                <div class="receipt-row">
                  <span class="label">Transaction ID:</span>
                  <span class="value">${transactionId}</span>
                </div>
                <div class="receipt-row">
                  <span class="label">Date:</span>
                  <span class="value">${new Date(date).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</span>
                </div>
                ${isSubscription ? `
                <div class="receipt-row">
                  <span class="label">Subscription Plan:</span>
                  <span class="value">${tierName}</span>
                </div>
                <div class="receipt-row">
                  <span class="label">Billing Period:</span>
                  <span class="value">Monthly</span>
                </div>
                ` : `
                <div class="receipt-row">
                  <span class="label">Credits Purchased:</span>
                  <span class="value">${credits || 0} credits</span>
                </div>
                `}
                <div class="receipt-row">
                  <span class="label">Amount:</span>
                  <span class="value">${formattedAmount}</span>
                </div>
                <div class="receipt-row total">
                  <span class="label">Total Paid:</span>
                  <span class="value">${formattedAmount}</span>
                </div>
              </div>
              
              <p>${isSubscription ? `Your subscription is now active and you can start using all the features of the ${tierName} plan.` : 'Your credits are now available in your account and ready to use for call analysis.'}</p>
              <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
              
              <div style="text-align: center; margin-top: 30px;">
                <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://audiolyse.vercel.app'}/dashboard" class="cta-button">
                  Go to Dashboard
                </a>
              </div>
              
              <div class="footer">
                <p>© 2024 Audiolyse. All rights reserved.</p>
                <p>
                  <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://audiolyse.vercel.app'}/contact">Contact Support</a> | 
                  <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://audiolyse.vercel.app'}/terms">Terms of Service</a>
                </p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    const subject = isSubscription 
      ? `Subscription Receipt - ${tierName} Plan - ${transactionId}`
      : `Credit Purchase Receipt - ${transactionId}`;

    const result = await sendEmailViaMandrill(
      email,
      subject,
      html
    );

    if (result.success) {
      return NextResponse.json({ 
        success: true, 
        message: 'Receipt sent successfully',
        messageId: result.messageId 
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        error: result.error || 'Failed to send receipt' 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error sending receipt:', error);
    return NextResponse.json({ 
      error: 'Failed to send receipt',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
