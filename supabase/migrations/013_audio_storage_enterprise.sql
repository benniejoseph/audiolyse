-- Migration: Audio Storage & Enterprise Features
-- Purpose: Enable audio file persistence and enterprise lead capture
-- Date: January 2026

-- =====================================================
-- 1. STORAGE BUCKET FOR AUDIO FILES
-- Note: Bucket creation is done via Supabase Dashboard or CLI
-- This migration handles the RLS policies
-- =====================================================

-- Add file_path column if not exists
ALTER TABLE call_analyses ADD COLUMN IF NOT EXISTS file_path TEXT;
ALTER TABLE call_analyses ADD COLUMN IF NOT EXISTS audio_url TEXT;
ALTER TABLE call_analyses ADD COLUMN IF NOT EXISTS storage_bucket VARCHAR(50) DEFAULT 'call-recordings';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_call_analyses_file_path ON call_analyses(file_path) WHERE file_path IS NOT NULL;

-- =====================================================
-- 2. ENTERPRISE LEADS TABLE
-- For capturing enterprise contact requests
-- =====================================================

CREATE TABLE IF NOT EXISTS enterprise_leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_name VARCHAR(255) NOT NULL,
  contact_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  company_size VARCHAR(50), -- 'startup', '10-50', '51-200', '201-500', '500+'
  industry VARCHAR(100),
  estimated_monthly_calls INTEGER,
  current_solution TEXT,
  requirements TEXT,
  source VARCHAR(100) DEFAULT 'pricing_page', -- where the lead came from
  status VARCHAR(50) DEFAULT 'new', -- 'new', 'contacted', 'qualified', 'proposal', 'closed_won', 'closed_lost'
  notes TEXT,
  assigned_to UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  contacted_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_enterprise_leads_status ON enterprise_leads(status);
CREATE INDEX IF NOT EXISTS idx_enterprise_leads_email ON enterprise_leads(email);
CREATE INDEX IF NOT EXISTS idx_enterprise_leads_created ON enterprise_leads(created_at DESC);

-- =====================================================
-- 3. PAYMENT RECEIPTS/INVOICES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS payment_receipts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  razorpay_payment_id VARCHAR(255),
  razorpay_order_id VARCHAR(255),
  razorpay_subscription_id VARCHAR(255),
  receipt_number VARCHAR(50) UNIQUE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'INR',
  tax_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  payment_type VARCHAR(50) NOT NULL, -- 'subscription', 'credits', 'one_time'
  description TEXT,
  billing_name VARCHAR(255),
  billing_email VARCHAR(255),
  billing_address TEXT,
  gstin VARCHAR(20), -- GST Number (India)
  status VARCHAR(50) DEFAULT 'paid', -- 'paid', 'refunded', 'partially_refunded'
  pdf_url TEXT, -- Link to generated PDF invoice
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_receipts_org ON payment_receipts(organization_id);
CREATE INDEX IF NOT EXISTS idx_receipts_user ON payment_receipts(user_id);
CREATE INDEX IF NOT EXISTS idx_receipts_number ON payment_receipts(receipt_number);

-- =====================================================
-- 4. NOTIFICATIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  -- Types: 'assignment', 'analysis_complete', 'team_invite', 'subscription', 
  --        'quota_warning', 'feedback_request', 'system'
  title VARCHAR(255) NOT NULL,
  message TEXT,
  link VARCHAR(500), -- Link to related resource
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, read_at);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

-- =====================================================
-- 5. ROW LEVEL SECURITY
-- =====================================================

-- Enterprise Leads RLS (admin only)
ALTER TABLE enterprise_leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view enterprise leads" ON enterprise_leads;
CREATE POLICY "Admins can view enterprise leads"
ON enterprise_leads FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true
  )
);

DROP POLICY IF EXISTS "Anyone can create enterprise leads" ON enterprise_leads;
CREATE POLICY "Anyone can create enterprise leads"
ON enterprise_leads FOR INSERT
WITH CHECK (true);

-- Payment Receipts RLS
ALTER TABLE payment_receipts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own receipts" ON payment_receipts;
CREATE POLICY "Users can view own receipts"
ON payment_receipts FOR SELECT
USING (
  user_id = auth.uid() OR
  organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  )
);

-- Notifications RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
CREATE POLICY "Users can view own notifications"
ON notifications FOR SELECT
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
CREATE POLICY "Users can update own notifications"
ON notifications FOR UPDATE
USING (user_id = auth.uid());

-- =====================================================
-- 6. HELPER FUNCTIONS
-- =====================================================

-- Function to generate receipt number
CREATE OR REPLACE FUNCTION generate_receipt_number()
RETURNS TEXT AS $$
DECLARE
  v_year TEXT;
  v_seq INTEGER;
  v_receipt TEXT;
BEGIN
  v_year := to_char(NOW(), 'YYYY');
  
  -- Get next sequence number for this year
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(receipt_number FROM 'INV' || v_year || '(\d+)') AS INTEGER)
  ), 0) + 1 INTO v_seq
  FROM payment_receipts
  WHERE receipt_number LIKE 'INV' || v_year || '%';
  
  v_receipt := 'INV' || v_year || LPAD(v_seq::TEXT, 6, '0');
  
  RETURN v_receipt;
END;
$$ LANGUAGE plpgsql;

-- Function to create notification
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_organization_id UUID,
  p_type VARCHAR(50),
  p_title VARCHAR(255),
  p_message TEXT DEFAULT NULL,
  p_link VARCHAR(500) DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO notifications (
    user_id, organization_id, type, title, message, link, metadata
  ) VALUES (
    p_user_id, p_organization_id, p_type, p_title, p_message, p_link, p_metadata
  )
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 7. UPDATE ORGANIZATIONS TABLE
-- Add annual billing support
-- =====================================================

ALTER TABLE organizations ADD COLUMN IF NOT EXISTS billing_interval VARCHAR(20) DEFAULT 'monthly';
-- Values: 'monthly', 'annual'
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS annual_discount_applied BOOLEAN DEFAULT false;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
