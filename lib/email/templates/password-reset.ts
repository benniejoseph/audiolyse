import { sendEmail, wrapEmailTemplate, EMAIL_CONFIG } from '../client';

interface PasswordResetEmailData {
  email: string;
  name?: string;
  resetLink: string;
  expiresIn?: string; // e.g., "1 hour"
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(data: PasswordResetEmailData) {
  const { email, name, resetLink, expiresIn = '1 hour' } = data;
  const greeting = name ? `Hi ${name},` : 'Hi there,';

  const content = `
    <h2 style="margin-top: 0; color: #111827;">Reset Your Password 🔐</h2>
    
    <p>${greeting}</p>
    
    <p>We received a request to reset your password for your Audiolyse account. Click the button below to create a new password:</p>
    
    <div style="text-align: center; margin: 32px 0;">
      <a href="${resetLink}" class="btn">Reset Password</a>
    </div>
    
    <div class="highlight-box" style="background-color: #fef3c7; border-left-color: #f59e0b;">
      <p style="margin: 0; color: #92400e;">
        <strong>⏰ This link expires in ${expiresIn}</strong><br>
        For security reasons, this password reset link will expire soon.
      </p>
    </div>
    
    <p>If the button doesn't work, copy and paste this link into your browser:</p>
    <p style="word-break: break-all; background: #f3f4f6; padding: 12px; border-radius: 6px; font-size: 14px; color: #4b5563;">
      ${resetLink}
    </p>
    
    <div class="divider"></div>
    
    <div class="highlight-box" style="background-color: #fef2f2; border-left-color: #ef4444;">
      <p style="margin: 0; color: #991b1b;">
        <strong>🚫 Didn't request this?</strong><br>
        If you didn't request a password reset, please ignore this email. Your password will remain unchanged. 
        If you're concerned about your account security, please <a href="${EMAIL_CONFIG.siteUrl}/contact" style="color: #dc2626;">contact our support team</a>.
      </p>
    </div>
    
    <div class="divider"></div>
    
    <h3 style="font-size: 16px; color: #111827;">🔒 Security Tips</h3>
    <ul style="margin: 0; padding-left: 20px; color: #374151;">
      <li style="margin-bottom: 8px;">Use a strong, unique password (at least 12 characters)</li>
      <li style="margin-bottom: 8px;">Don't reuse passwords from other websites</li>
      <li style="margin-bottom: 8px;">Consider using a password manager</li>
      <li style="margin-bottom: 8px;">Enable two-factor authentication when available</li>
    </ul>
    
    <p class="text-muted" style="margin-top: 24px;">
      Need help? Contact us at support@audiolyse.com
    </p>
  `;

  return sendEmail({
    to: email,
    subject: 'Reset Your Audiolyse Password',
    html: wrapEmailTemplate(content, 'Password Reset Request - Audiolyse'),
    tags: [
      { name: 'type', value: 'password-reset' },
    ],
  });
}
