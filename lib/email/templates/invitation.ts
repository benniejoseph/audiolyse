import { sendEmail, wrapEmailTemplate, EMAIL_CONFIG } from '../client';

interface InvitationEmailData {
  email: string;
  inviterName: string;
  organizationName: string;
  role: string;
  inviteToken: string;
  expiresAt: string;
}

/**
 * Send team invitation email
 */
export async function sendInvitationEmail(data: InvitationEmailData) {
  const {
    email,
    inviterName,
    organizationName,
    role,
    inviteToken,
    expiresAt,
  } = data;

  const inviteUrl = `${EMAIL_CONFIG.siteUrl}/invite/accept?token=${inviteToken}`;
  const expiryDate = new Date(expiresAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const roleDescription = role === 'admin' 
    ? 'As an Admin, you\'ll be able to manage team members and access all features.'
    : 'As a Member, you\'ll be able to upload and analyze calls, and view team insights.';

  const content = `
    <h2 style="margin-top: 0; color: #111827;">You're Invited! 🎉</h2>
    
    <p><strong>${inviterName}</strong> has invited you to join <strong>${organizationName}</strong> on Audiolyse.</p>
    
    <div class="highlight-box">
      <p style="margin: 0;"><strong>Your Role:</strong> ${role.charAt(0).toUpperCase() + role.slice(1)}</p>
      <p style="margin: 8px 0 0 0; color: #6b7280; font-size: 14px;">${roleDescription}</p>
    </div>
    
    <p>Audiolyse is an AI-powered call analysis platform that helps teams improve their sales and support conversations through intelligent insights and coaching.</p>
    
    <div style="text-align: center; margin: 32px 0;">
      <a href="${inviteUrl}" class="btn">Accept Invitation</a>
    </div>
    
    <div class="divider"></div>
    
    <p class="text-muted">
      This invitation will expire on <strong>${expiryDate}</strong>. 
      If you didn't expect this invitation, you can safely ignore this email.
    </p>
    
    <p class="text-muted">
      If the button doesn't work, copy and paste this link into your browser:<br>
      <a href="${inviteUrl}" style="color: #00d9ff; word-break: break-all;">${inviteUrl}</a>
    </p>
  `;

  return sendEmail({
    to: email,
    subject: `${inviterName} invited you to join ${organizationName} on Audiolyse`,
    html: wrapEmailTemplate(content, `You've been invited to join ${organizationName}`),
    tags: [
      { name: 'type', value: 'invitation' },
      { name: 'organization', value: organizationName },
    ],
  });
}
