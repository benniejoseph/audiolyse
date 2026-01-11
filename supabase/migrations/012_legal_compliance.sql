-- Migration: Legal Compliance Tables
-- Purpose: DPDP Act 2024, HIPAA, GDPR compliance
-- Date: January 2026

-- =====================================================
-- 1. CONSENT RECORDS TABLE
-- Tracks user consents for DPDP/GDPR compliance
-- =====================================================

CREATE TABLE IF NOT EXISTS consent_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  consent_type VARCHAR(50) NOT NULL,
  -- Types: 'audio_processing', 'ai_analysis', 'data_storage', 'marketing', 'third_party_sharing'
  consent_version VARCHAR(20) NOT NULL DEFAULT '1.0',
  consented BOOLEAN NOT NULL,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  withdrawn_at TIMESTAMPTZ,
  metadata JSONB
);

-- Index for fast user consent lookups
CREATE INDEX IF NOT EXISTS idx_consent_user_type ON consent_records(user_id, consent_type);
CREATE INDEX IF NOT EXISTS idx_consent_org ON consent_records(organization_id);

-- =====================================================
-- 2. AUDIT LOGS TABLE
-- Immutable audit trail for compliance
-- =====================================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  -- Actions: 'login', 'logout', 'data_access', 'data_export', 'data_delete', 
  -- 'settings_change', 'permission_change', 'call_upload', 'call_view', etc.
  resource_type VARCHAR(50),
  -- Types: 'user', 'organization', 'call_analysis', 'settings', etc.
  resource_id UUID,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for audit log queries
CREATE INDEX IF NOT EXISTS idx_audit_org_date ON audit_logs(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_user_date ON audit_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_resource ON audit_logs(resource_type, resource_id);

-- =====================================================
-- 3. DATA SUBJECT REQUESTS TABLE
-- Track DPDP/GDPR data subject requests
-- =====================================================

CREATE TABLE IF NOT EXISTS data_subject_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  request_type VARCHAR(50) NOT NULL,
  -- Types: 'access', 'rectification', 'erasure', 'portability', 'restriction', 'objection'
  status VARCHAR(20) DEFAULT 'pending',
  -- Status: 'pending', 'in_progress', 'completed', 'rejected'
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES profiles(id),
  response_notes TEXT,
  metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_dsr_user ON data_subject_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_dsr_status ON data_subject_requests(status);

-- =====================================================
-- 4. BAA TRACKING FOR HIPAA
-- Track Business Associate Agreements
-- =====================================================

ALTER TABLE organizations ADD COLUMN IF NOT EXISTS hipaa_covered_entity BOOLEAN DEFAULT false;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS baa_signed_at TIMESTAMPTZ;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS baa_document_url TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS baa_signatory_name VARCHAR(255);
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS baa_signatory_email VARCHAR(255);

-- =====================================================
-- 5. LEGAL DOCUMENT VERSIONS
-- Track versions of terms, privacy policy, etc.
-- =====================================================

CREATE TABLE IF NOT EXISTS legal_document_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_type VARCHAR(50) NOT NULL,
  -- Types: 'terms', 'privacy', 'cookie_policy', 'aup', 'baa', 'dpa'
  version VARCHAR(20) NOT NULL,
  content TEXT,
  summary_of_changes TEXT,
  effective_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  UNIQUE(document_type, version)
);

-- Track user acceptance of legal documents
CREATE TABLE IF NOT EXISTS user_document_acceptances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  document_type VARCHAR(50) NOT NULL,
  document_version VARCHAR(20) NOT NULL,
  accepted_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address INET,
  UNIQUE(user_id, document_type, document_version)
);

CREATE INDEX IF NOT EXISTS idx_doc_accept_user ON user_document_acceptances(user_id);

-- =====================================================
-- 6. PHI ACCESS LOGS (HIPAA)
-- Separate log for Protected Health Information access
-- =====================================================

CREATE TABLE IF NOT EXISTS phi_access_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  resource_type VARCHAR(50) NOT NULL,
  -- Types: 'call_analysis', 'transcript', 'audio', 'patient_data'
  resource_id UUID,
  action VARCHAR(50) NOT NULL,
  -- Actions: 'view', 'download', 'export', 'share', 'print'
  ip_address INET,
  user_agent TEXT,
  accessed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_phi_org_date ON phi_access_logs(organization_id, accessed_at DESC);
CREATE INDEX IF NOT EXISTS idx_phi_user ON phi_access_logs(user_id);

-- =====================================================
-- 7. DATA RETENTION POLICIES
-- Per-organization retention settings
-- =====================================================

CREATE TABLE IF NOT EXISTS data_retention_policies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE UNIQUE,
  call_retention_days INTEGER DEFAULT 30,
  audio_retention_days INTEGER DEFAULT 30,
  audit_log_retention_days INTEGER DEFAULT 730, -- 2 years default
  auto_delete_enabled BOOLEAN DEFAULT true,
  legal_hold_active BOOLEAN DEFAULT false,
  legal_hold_reason TEXT,
  legal_hold_started_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 8. ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Consent Records RLS
ALTER TABLE consent_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own consent records"
ON consent_records FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own consent records"
ON consent_records FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own consent records"
ON consent_records FOR UPDATE
USING (user_id = auth.uid());

-- Audit Logs RLS (Read-only for users, admins see org logs)
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own audit logs"
ON audit_logs FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Service role can insert audit logs"
ON audit_logs FOR INSERT
WITH CHECK (true);

-- Data Subject Requests RLS
ALTER TABLE data_subject_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own DSR"
ON data_subject_requests FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can create own DSR"
ON data_subject_requests FOR INSERT
WITH CHECK (user_id = auth.uid());

-- PHI Access Logs RLS (Read-only, org admins can view)
ALTER TABLE phi_access_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own PHI access logs"
ON phi_access_logs FOR SELECT
USING (user_id = auth.uid());

-- Data Retention Policies RLS
ALTER TABLE data_retention_policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view retention policies"
ON data_retention_policies FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  )
);

-- Legal Document Versions (public read)
ALTER TABLE legal_document_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view legal documents"
ON legal_document_versions FOR SELECT
USING (true);

-- User Document Acceptances RLS
ALTER TABLE user_document_acceptances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own acceptances"
ON user_document_acceptances FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own acceptances"
ON user_document_acceptances FOR INSERT
WITH CHECK (user_id = auth.uid());

-- =====================================================
-- 9. HELPER FUNCTIONS
-- =====================================================

-- Function to log audit events
CREATE OR REPLACE FUNCTION log_audit_event(
  p_organization_id UUID,
  p_user_id UUID,
  p_action VARCHAR(100),
  p_resource_type VARCHAR(50),
  p_resource_id UUID,
  p_metadata JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO audit_logs (
    organization_id, user_id, action, resource_type, resource_id, metadata
  ) VALUES (
    p_organization_id, p_user_id, p_action, p_resource_type, p_resource_id, p_metadata
  )
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has given consent
CREATE OR REPLACE FUNCTION check_user_consent(
  p_user_id UUID,
  p_consent_type VARCHAR(50)
)
RETURNS BOOLEAN AS $$
DECLARE
  v_consented BOOLEAN;
BEGIN
  SELECT consented INTO v_consented
  FROM consent_records
  WHERE user_id = p_user_id 
    AND consent_type = p_consent_type
    AND withdrawn_at IS NULL
  ORDER BY created_at DESC
  LIMIT 1;
  
  RETURN COALESCE(v_consented, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get organization retention policy
CREATE OR REPLACE FUNCTION get_retention_days(p_organization_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_days INTEGER;
BEGIN
  SELECT call_retention_days INTO v_days
  FROM data_retention_policies
  WHERE organization_id = p_organization_id;
  
  -- If no custom policy, return default based on tier
  IF v_days IS NULL THEN
    SELECT 
      CASE subscription_tier
        WHEN 'free' THEN 7
        WHEN 'individual' THEN 30
        WHEN 'team' THEN 90
        WHEN 'enterprise' THEN 365
        ELSE 30
      END INTO v_days
    FROM organizations
    WHERE id = p_organization_id;
  END IF;
  
  RETURN COALESCE(v_days, 30);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 10. INSERT DEFAULT LEGAL DOCUMENTS
-- =====================================================

INSERT INTO legal_document_versions (document_type, version, effective_date, summary_of_changes)
VALUES 
  ('terms', '1.0', '2025-01-01', 'Initial Terms of Service'),
  ('privacy', '1.0', '2025-01-01', 'Initial Privacy Policy'),
  ('cookie_policy', '1.0', '2025-01-01', 'Initial Cookie Policy')
ON CONFLICT (document_type, version) DO NOTHING;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
