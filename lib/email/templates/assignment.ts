import { sendEmail, wrapEmailTemplate, EMAIL_CONFIG } from '../client';

interface AssignmentEmailData {
  email: string;
  assigneeName?: string;
  assignerName: string;
  callName: string;
  analysisId: string;
  overallScore?: number;
  message?: string;
}

/**
 * Send email when a call is assigned to someone
 */
export async function sendAssignmentEmail(data: AssignmentEmailData) {
  const {
    email,
    assigneeName,
    assignerName,
    callName,
    analysisId,
    overallScore,
    message,
  } = data;

  const greeting = assigneeName ? `Hi ${assigneeName},` : 'Hi,';
  const viewUrl = `${EMAIL_CONFIG.siteUrl}/history?id=${analysisId}`;

  const content = `
    <p style="margin-top: 0;">${greeting}</p>
    
    <p><strong>${assignerName}</strong> has assigned a call to you for review and coaching.</p>
    
    <div class="highlight-box">
      <h3 style="margin-top: 0; font-size: 16px; color: #111827;">📞 Call Details</h3>
      <p style="margin: 8px 0;"><strong>Call:</strong> ${callName}</p>
      ${overallScore !== undefined ? `<p style="margin: 8px 0;"><strong>Score:</strong> ${overallScore}/100</p>` : ''}
    </div>
    
    ${message ? `
    <div style="background: #f0f9ff; border-left: 4px solid #00d9ff; padding: 16px; margin: 20px 0;">
      <p style="margin: 0; color: #0369a1; font-weight: 500;">Message from ${assignerName}:</p>
      <p style="margin: 8px 0 0 0; color: #374151;">"${message}"</p>
    </div>
    ` : ''}
    
    <p>Please review the analysis and work on the suggested improvements. Your manager may follow up with you for a coaching session.</p>
    
    <div style="text-align: center; margin: 32px 0;">
      <a href="${viewUrl}" class="btn">View Call Analysis</a>
    </div>
    
    <div class="divider"></div>
    
    <p class="text-muted">
      💡 <strong>Tip:</strong> Focus on 2-3 key improvements at a time for best results. 
      Check your <a href="${EMAIL_CONFIG.siteUrl}/dashboard" style="color: #00d9ff;">dashboard</a> to track your progress.
    </p>
  `;

  return sendEmail({
    to: email,
    subject: `New Assignment: ${callName} - Review Required`,
    html: wrapEmailTemplate(content, `${assignerName} assigned a call for you to review`),
    tags: [
      { name: 'type', value: 'assignment' },
    ],
  });
}
