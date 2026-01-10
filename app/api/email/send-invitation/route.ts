import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendInvitationEmail } from '@/lib/email/templates';

export const runtime = 'nodejs';

interface InvitationRequest {
  email: string;
  inviterName: string;
  organizationName: string;
  role: string;
  inviteToken: string;
  expiresAt: string;
}

export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body: InvitationRequest = await req.json();
    const { email, inviterName, organizationName, role, inviteToken, expiresAt } = body;

    // Validate required fields
    if (!email || !inviterName || !organizationName || !inviteToken || !expiresAt) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Send the invitation email
    const result = await sendInvitationEmail({
      email,
      inviterName,
      organizationName,
      role: role || 'member',
      inviteToken,
      expiresAt,
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Invitation email sent successfully',
        messageId: result.messageId,
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to send invitation email' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error sending invitation email:', error);
    return NextResponse.json(
      { error: 'Failed to send invitation email' },
      { status: 500 }
    );
  }
}
