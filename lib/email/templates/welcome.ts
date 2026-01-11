import { sendEmail, wrapEmailTemplate, EMAIL_CONFIG } from '../client';

interface WelcomeEmailData {
  email: string;
  name?: string;
  organizationName?: string;
}

/**
 * Send welcome email to new users
 */
export async function sendWelcomeEmail(data: WelcomeEmailData) {
  const { email, name, organizationName } = data;
  const greeting = name ? `Hi ${name}!` : 'Welcome!';

  const content = `
    <h2 style="margin-top: 0; color: #111827;">${greeting} 🚀</h2>
    
    <p>Welcome to Audiolyse! We're excited to have you on board${organizationName ? ` at ${organizationName}` : ''}.</p>
    
    <p>Audiolyse uses AI to transform your sales and support calls into actionable insights, helping you and your team improve every conversation.</p>
    
    <div class="highlight-box">
      <h3 style="margin-top: 0; font-size: 16px; color: #111827;">🎯 Quick Start Guide</h3>
      <ol style="margin: 0; padding-left: 20px; color: #374151;">
        <li style="margin-bottom: 8px;"><strong>Upload a call</strong> - Go to Analyze and upload your first audio file</li>
        <li style="margin-bottom: 8px;"><strong>Review insights</strong> - Get AI-powered coaching and scores</li>
        <li style="margin-bottom: 8px;"><strong>Track progress</strong> - See your improvement over time</li>
      </ol>
    </div>
    
    <div style="text-align: center; margin: 32px 0;">
      <a href="${EMAIL_CONFIG.siteUrl}/analyze" class="btn">Upload Your First Call</a>
    </div>
    
    <div class="divider"></div>
    
    <h3 style="font-size: 16px; color: #111827;">📚 Helpful Resources</h3>
    <ul style="margin: 0; padding-left: 20px; color: #374151;">
      <li style="margin-bottom: 8px;"><a href="${EMAIL_CONFIG.siteUrl}/help" style="color: #00d9ff;">Help Center</a> - Tutorials and FAQs</li>
      <li style="margin-bottom: 8px;"><a href="${EMAIL_CONFIG.siteUrl}/settings" style="color: #00d9ff;">Settings</a> - Customize your AI analysis context</li>
      <li style="margin-bottom: 8px;"><a href="${EMAIL_CONFIG.siteUrl}/contact" style="color: #00d9ff;">Contact Support</a> - We're here to help!</li>
    </ul>
    
    <p class="text-muted" style="margin-top: 24px;">
      Questions? Just reply to this email or reach out at support@audiolyse.com.
    </p>
  `;

  return sendEmail({
    to: email,
    subject: 'Welcome to Audiolyse! 🎉',
    html: wrapEmailTemplate(content, 'Welcome to Audiolyse - Get started with AI call analysis'),
    tags: [
      { name: 'type', value: 'welcome' },
    ],
  });
}
