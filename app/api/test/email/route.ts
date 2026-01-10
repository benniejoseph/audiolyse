/**
 * Email Testing API Endpoint
 * 
 * This endpoint is for testing email templates in development.
 * It should be disabled in production or restricted to admin users.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import {
  sendInvitationEmail,
  sendWelcomeEmail,
  sendAnalysisCompleteEmail,
  sendAssignmentEmail,
  sendReceiptEmail,
  sendPasswordResetEmail,
} from '@/lib/email/templates';

// Only allow in development or for admin users
const isDev = process.env.NODE_ENV !== 'production';

export async function POST(request: NextRequest) {
  try {
    // Auth check
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // In production, only allow admins
    if (!isDev) {
      let serviceClient;
      try {
        serviceClient = createServiceClient();
      } catch {
        return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
      }

      const { data: profile } = await serviceClient
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();

      if (!profile?.is_admin) {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
      }
    }

    const body = await request.json();
    const { template, testEmail } = body;

    if (!template) {
      return NextResponse.json({ error: 'Template name is required' }, { status: 400 });
    }

    const email = testEmail || user.email;
    if (!email) {
      return NextResponse.json({ error: 'No email address available' }, { status: 400 });
    }

    let result;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    switch (template) {
      case 'invitation':
        result = await sendInvitationEmail({
          email,
          inviterName: 'Test User',
          organizationName: 'Test Organization',
          inviteToken: 'test-token-123456',
          role: 'member',
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
        });
        break;

      case 'welcome':
        result = await sendWelcomeEmail({
          email,
          name: 'Test User',
          organizationName: 'Test Organization',
        });
        break;

      case 'analysis-complete':
        result = await sendAnalysisCompleteEmail({
          email,
          name: 'Test User',
          callName: 'sales_call_2024-01-15.mp3',
          analysisId: 'test-analysis-123',
          overallScore: 85,
          sentiment: 'Positive',
          summary: 'The call demonstrated excellent rapport building and effective objection handling. The agent showed strong product knowledge and maintained a professional tone throughout.',
          strengths: [
            'Strong opening with personalized greeting',
            'Effective discovery questions asked',
            'Good handling of pricing objection',
          ],
          improvements: [
            'Could ask more open-ended questions',
            'Consider summarizing key points before closing',
          ],
        });
        break;

      case 'assignment':
        result = await sendAssignmentEmail({
          email,
          assigneeName: 'Test User',
          assignerName: 'Manager Name',
          callName: 'customer_support_call.mp3',
          analysisId: 'test-analysis-456',
          overallScore: 72,
          message: 'Please review this call for coaching purposes. Pay attention to the objection handling section around the 5-minute mark.',
        });
        break;

      case 'receipt':
        result = await sendReceiptEmail({
          email,
          name: 'Test User',
          type: 'credits',
          credits: 50,
          amount: 225,
          currency: 'INR',
          transactionId: 'pay_test_123456789',
          date: new Date().toISOString(),
        });
        break;

      case 'password-reset':
        result = await sendPasswordResetEmail({
          email,
          name: 'Test User',
          resetLink: `${siteUrl}/reset-password?token=test-reset-token-123`,
          expiresIn: '1 hour',
        });
        break;

      default:
        return NextResponse.json({ 
          error: 'Unknown template',
          availableTemplates: [
            'invitation',
            'welcome',
            'analysis-complete',
            'assignment',
            'receipt',
            'password-reset',
          ],
        }, { status: 400 });
    }

    if (result?.error) {
      const errorMessage = typeof result.error === 'string' 
        ? result.error 
        : (result.error as any)?.message || 'Failed to send email';
      return NextResponse.json({ 
        success: false, 
        error: errorMessage,
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `${template} email sent successfully to ${email}`,
      messageId: result?.messageId,
    });
  } catch (error) {
    console.error('Email test error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to send test email',
    }, { status: 500 });
  }
}

/**
 * GET endpoint to list available templates
 */
export async function GET() {
  return NextResponse.json({
    availableTemplates: [
      { name: 'invitation', description: 'Team invitation email' },
      { name: 'welcome', description: 'Welcome email for new users' },
      { name: 'analysis-complete', description: 'Notification when call analysis is done' },
      { name: 'assignment', description: 'Notification when a call is assigned' },
      { name: 'receipt', description: 'Payment receipt email' },
      { name: 'password-reset', description: 'Password reset email' },
    ],
    usage: {
      method: 'POST',
      body: {
        template: 'string (required) - template name',
        testEmail: 'string (optional) - override recipient email',
      },
    },
  });
}
