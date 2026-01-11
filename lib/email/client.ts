import { Resend } from 'resend';

/**
 * Email Client using Resend
 * Free tier: 3,000 emails/month - perfect for cost efficiency
 * 
 * Setup: Add RESEND_API_KEY to your environment variables
 * Get your API key from: https://resend.com/api-keys
 */

// Lazy-initialized Resend client (to avoid errors during build when env var is not set)
let resendClient: Resend | null = null;

function getResendClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) {
    return null;
  }
  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
}

// Configuration
export const EMAIL_CONFIG = {
  from: process.env.EMAIL_FROM || 'Audiolyse <noreply@audiolyse.com>',
  replyTo: process.env.EMAIL_REPLY_TO || 'support@audiolyse.com',
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://audiolyse.vercel.app',
};

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
  tags?: { name: string; value: string }[];
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send an email using Resend
 */
export async function sendEmail(options: SendEmailOptions): Promise<EmailResult> {
  // Get the Resend client (lazy initialization)
  const resend = getResendClient();
  
  // Check if API key is configured
  if (!resend) {
    console.warn('[Email] RESEND_API_KEY not configured - email not sent');
    return { 
      success: false, 
      error: 'Email service not configured. Set RESEND_API_KEY environment variable.' 
    };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: options.from || EMAIL_CONFIG.from,
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
      html: options.html,
      text: options.text,
      replyTo: options.replyTo || EMAIL_CONFIG.replyTo,
      tags: options.tags,
    });

    if (error) {
      console.error('[Email] Resend API error:', error);
      return { success: false, error: error.message };
    }

    console.log('[Email] Sent successfully:', data?.id);
    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error('[Email] Error sending email:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Send a batch of emails
 */
export async function sendBatchEmails(
  emails: SendEmailOptions[]
): Promise<{ success: boolean; results: EmailResult[] }> {
  const results: EmailResult[] = [];
  
  for (const email of emails) {
    const result = await sendEmail(email);
    results.push(result);
  }
  
  const allSuccess = results.every(r => r.success);
  return { success: allSuccess, results };
}

/**
 * Common email wrapper with consistent branding
 */
export function wrapEmailTemplate(content: string, preheader?: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Audiolyse</title>
  ${preheader ? `<span style="display:none;font-size:1px;color:#ffffff;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">${preheader}</span>` : ''}
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333333;
      margin: 0;
      padding: 0;
      background-color: #f4f4f4;
      -webkit-font-smoothing: antialiased;
    }
    .email-wrapper {
      width: 100%;
      background-color: #f4f4f4;
      padding: 30px 0;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%);
      padding: 32px;
      text-align: center;
    }
    .logo {
      font-size: 28px;
      font-weight: 700;
      color: #ffffff;
      margin: 0;
    }
    .logo-accent {
      background: linear-gradient(135deg, #00d9ff, #8b5cf6);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .content {
      padding: 40px 32px;
    }
    .btn {
      display: inline-block;
      padding: 14px 28px;
      background: linear-gradient(135deg, #00d9ff, #8b5cf6);
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
      text-align: center;
      margin: 20px 0;
    }
    .btn:hover {
      opacity: 0.9;
    }
    .btn-secondary {
      background: #f3f4f6;
      color: #374151 !important;
    }
    .footer {
      padding: 24px 32px;
      background-color: #f9fafb;
      text-align: center;
      font-size: 12px;
      color: #6b7280;
    }
    .footer a {
      color: #00d9ff;
      text-decoration: none;
    }
    .divider {
      height: 1px;
      background-color: #e5e7eb;
      margin: 24px 0;
    }
    .highlight-box {
      background: linear-gradient(135deg, rgba(0, 217, 255, 0.1), rgba(139, 92, 246, 0.1));
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
    }
    .text-muted {
      color: #6b7280;
      font-size: 14px;
    }
    .text-center {
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="email-container">
      <div class="header">
        <h1 class="logo">Audio<span class="logo-accent">lyse</span></h1>
      </div>
      <div class="content">
        ${content}
      </div>
      <div class="footer">
        <p>© ${new Date().getFullYear()} Audiolyse. All rights reserved.</p>
        <p>
          <a href="${EMAIL_CONFIG.siteUrl}/help">Help Center</a> • 
          <a href="${EMAIL_CONFIG.siteUrl}/privacy">Privacy</a> • 
          <a href="${EMAIL_CONFIG.siteUrl}/terms">Terms</a>
        </p>
        <p class="text-muted" style="margin-top: 16px;">
          You're receiving this email because you have an Audiolyse account.
        </p>
      </div>
    </div>
  </div>
</body>
</html>
`;
}
