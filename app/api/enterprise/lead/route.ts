import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendEmail, wrapEmailTemplate, EMAIL_CONFIG } from '@/lib/email/client';

export const runtime = 'nodejs';

interface EnterpriseLeadRequest {
  companyName: string;
  contactName: string;
  email: string;
  phone?: string;
  companySize: string;
  industry?: string;
  estimatedMonthlyCalls?: number;
  currentSolution?: string;
  requirements?: string;
  source?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: EnterpriseLeadRequest = await req.json();
    
    const {
      companyName,
      contactName,
      email,
      phone,
      companySize,
      industry,
      estimatedMonthlyCalls,
      currentSolution,
      requirements,
      source = 'pricing_page',
    } = body;

    // Validate required fields
    if (!companyName || !contactName || !email) {
      return NextResponse.json(
        { error: 'Company name, contact name, and email are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Check if lead already exists
    const { data: existingLead } = await supabase
      .from('enterprise_leads')
      .select('id, status')
      .eq('email', email.toLowerCase())
      .single();

    if (existingLead) {
      // Update existing lead instead of creating new
      const { error: updateError } = await supabase
        .from('enterprise_leads')
        .update({
          company_name: companyName,
          contact_name: contactName,
          phone,
          company_size: companySize,
          industry,
          estimated_monthly_calls: estimatedMonthlyCalls,
          current_solution: currentSolution,
          requirements,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingLead.id);

      if (updateError) {
        console.error('Error updating enterprise lead:', updateError);
        return NextResponse.json(
          { error: 'Failed to update your request' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "We've updated your enterprise inquiry. Our team will be in touch soon!",
        leadId: existingLead.id,
        isUpdate: true,
      });
    }

    // Create new lead
    const { data: newLead, error: insertError } = await supabase
      .from('enterprise_leads')
      .insert({
        company_name: companyName,
        contact_name: contactName,
        email: email.toLowerCase(),
        phone,
        company_size: companySize,
        industry,
        estimated_monthly_calls: estimatedMonthlyCalls,
        current_solution: currentSolution,
        requirements,
        source,
        status: 'new',
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('Error creating enterprise lead:', insertError);
      return NextResponse.json(
        { error: 'Failed to submit your request' },
        { status: 500 }
      );
    }

    // Send confirmation email to the lead
    try {
      const confirmationContent = `
        <h2 style="margin-top: 0; color: #111827;">Thank you for your interest! 🏢</h2>
        
        <p>Hi ${contactName},</p>
        
        <p>We've received your enterprise inquiry for <strong>${companyName}</strong>. Our enterprise team will review your requirements and get back to you within 24-48 hours.</p>
        
        <div class="highlight-box">
          <h3 style="margin-top: 0; font-size: 16px; color: #111827;">Your Request Details</h3>
          <p style="margin: 8px 0;"><strong>Company:</strong> ${companyName}</p>
          <p style="margin: 8px 0;"><strong>Team Size:</strong> ${companySize}</p>
          ${industry ? `<p style="margin: 8px 0;"><strong>Industry:</strong> ${industry}</p>` : ''}
          ${estimatedMonthlyCalls ? `<p style="margin: 8px 0;"><strong>Estimated Monthly Calls:</strong> ${estimatedMonthlyCalls}</p>` : ''}
        </div>
        
        <p><strong>What happens next?</strong></p>
        <ol style="margin: 16px 0; padding-left: 20px; color: #374151;">
          <li style="margin-bottom: 8px;">Our enterprise specialist will review your requirements</li>
          <li style="margin-bottom: 8px;">We'll reach out to schedule a personalized demo</li>
          <li style="margin-bottom: 8px;">You'll receive a custom proposal tailored to your needs</li>
        </ol>
        
        <p class="text-muted">In the meantime, feel free to explore our <a href="${EMAIL_CONFIG.siteUrl}/help" style="color: #00d9ff;">Help Center</a> to learn more about our features.</p>
        
        <div class="divider"></div>
        
        <p class="text-muted">Questions? Reply to this email or call us directly.</p>
      `;

      await sendEmail({
        to: email,
        subject: `Enterprise Inquiry Received - ${companyName}`,
        html: wrapEmailTemplate(confirmationContent, `Thank you for your enterprise inquiry`),
        tags: [
          { name: 'type', value: 'enterprise_lead_confirmation' },
        ],
      });
    } catch (emailError) {
      console.warn('Failed to send lead confirmation email:', emailError);
      // Don't fail the request if email fails
    }

    // Optionally send notification to sales team
    try {
      const salesNotificationContent = `
        <h2 style="margin-top: 0; color: #111827;">🚀 New Enterprise Lead!</h2>
        
        <div class="highlight-box">
          <h3 style="margin-top: 0; font-size: 16px; color: #111827;">Lead Details</h3>
          <p style="margin: 8px 0;"><strong>Company:</strong> ${companyName}</p>
          <p style="margin: 8px 0;"><strong>Contact:</strong> ${contactName}</p>
          <p style="margin: 8px 0;"><strong>Email:</strong> ${email}</p>
          ${phone ? `<p style="margin: 8px 0;"><strong>Phone:</strong> ${phone}</p>` : ''}
          <p style="margin: 8px 0;"><strong>Company Size:</strong> ${companySize}</p>
          ${industry ? `<p style="margin: 8px 0;"><strong>Industry:</strong> ${industry}</p>` : ''}
          ${estimatedMonthlyCalls ? `<p style="margin: 8px 0;"><strong>Est. Monthly Calls:</strong> ${estimatedMonthlyCalls}</p>` : ''}
        </div>
        
        ${requirements ? `
        <h3 style="font-size: 16px; color: #111827;">Requirements</h3>
        <p style="background: #f9fafb; padding: 16px; border-radius: 8px; color: #374151;">${requirements}</p>
        ` : ''}
        
        ${currentSolution ? `
        <h3 style="font-size: 16px; color: #111827;">Current Solution</h3>
        <p style="background: #f9fafb; padding: 16px; border-radius: 8px; color: #374151;">${currentSolution}</p>
        ` : ''}
        
        <p><strong>Source:</strong> ${source}</p>
        
        <div style="text-align: center; margin: 32px 0;">
          <a href="${EMAIL_CONFIG.siteUrl}/admin/leads" class="btn">View in Admin</a>
        </div>
      `;

      // Send to admin email if configured
      const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_FROM;
      if (adminEmail) {
        await sendEmail({
          to: adminEmail,
          subject: `🚀 New Enterprise Lead: ${companyName}`,
          html: wrapEmailTemplate(salesNotificationContent, `New enterprise lead from ${companyName}`),
          tags: [
            { name: 'type', value: 'enterprise_lead_notification' },
          ],
        });
      }
    } catch (notifyError) {
      console.warn('Failed to send sales notification:', notifyError);
    }

    return NextResponse.json({
      success: true,
      message: "Thank you! Our enterprise team will contact you within 24-48 hours.",
      leadId: newLead?.id,
    });
  } catch (error) {
    console.error('Enterprise lead API error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
