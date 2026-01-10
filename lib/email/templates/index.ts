/**
 * Email Templates - Central Export
 * 
 * All email templates for Audiolyse
 */

export { sendInvitationEmail } from './invitation';
export { sendWelcomeEmail } from './welcome';
export { sendAnalysisCompleteEmail } from './analysis-complete';
export { sendAssignmentEmail } from './assignment';
export { sendReceiptEmail } from './receipt';
export { sendPasswordResetEmail } from './password-reset';

// Re-export client utilities
export { sendEmail, sendBatchEmails, EMAIL_CONFIG } from '../client';
