import { sendEmail, wrapEmailTemplate, EMAIL_CONFIG } from '../client';

interface AnalysisCompleteEmailData {
  email: string;
  name?: string;
  callName: string;
  analysisId: string;
  overallScore: number;
  sentiment: string;
  summary: string;
  strengths?: string[];
  improvements?: string[];
}

/**
 * Send email when call analysis is complete
 */
export async function sendAnalysisCompleteEmail(data: AnalysisCompleteEmailData) {
  const {
    email,
    name,
    callName,
    analysisId,
    overallScore,
    sentiment,
    summary,
    strengths = [],
    improvements = [],
  } = data;

  const greeting = name ? `Hi ${name},` : 'Hi,';
  const viewUrl = `${EMAIL_CONFIG.siteUrl}/history?id=${analysisId}`;
  
  // Score color based on value
  const scoreColor = overallScore >= 80 ? '#10b981' : overallScore >= 60 ? '#f59e0b' : '#ef4444';
  const scoreEmoji = overallScore >= 80 ? '🌟' : overallScore >= 60 ? '👍' : '📈';

  const content = `
    <p style="margin-top: 0;">${greeting}</p>
    
    <p>Your call analysis for <strong>"${callName}"</strong> is ready!</p>
    
    <div class="highlight-box" style="text-align: center;">
      <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">Overall Score</p>
      <p style="margin: 0; font-size: 48px; font-weight: 700; color: ${scoreColor};">${overallScore} ${scoreEmoji}</p>
      <p style="margin: 8px 0 0 0; color: #6b7280; font-size: 14px;">Sentiment: ${sentiment}</p>
    </div>
    
    <h3 style="font-size: 16px; color: #111827;">📝 Summary</h3>
    <p style="color: #374151; background: #f9fafb; padding: 16px; border-radius: 8px;">${summary}</p>
    
    ${strengths.length > 0 ? `
    <h3 style="font-size: 16px; color: #10b981;">✅ Strengths</h3>
    <ul style="margin: 0; padding-left: 20px; color: #374151;">
      ${strengths.slice(0, 3).map(s => `<li style="margin-bottom: 4px;">${s}</li>`).join('')}
    </ul>
    ` : ''}
    
    ${improvements.length > 0 ? `
    <h3 style="font-size: 16px; color: #f59e0b;">💡 Areas for Improvement</h3>
    <ul style="margin: 0; padding-left: 20px; color: #374151;">
      ${improvements.slice(0, 3).map(i => `<li style="margin-bottom: 4px;">${i}</li>`).join('')}
    </ul>
    ` : ''}
    
    <div style="text-align: center; margin: 32px 0;">
      <a href="${viewUrl}" class="btn">View Full Analysis</a>
    </div>
    
    <p class="text-muted">
      Want to improve your scores? Check out our <a href="${EMAIL_CONFIG.siteUrl}/help" style="color: #00d9ff;">coaching tips</a>.
    </p>
  `;

  return sendEmail({
    to: email,
    subject: `Analysis Complete: ${callName} - Score: ${overallScore}`,
    html: wrapEmailTemplate(content, `Your call analysis is ready with a score of ${overallScore}`),
    tags: [
      { name: 'type', value: 'analysis_complete' },
      { name: 'score', value: String(overallScore) },
    ],
  });
}
