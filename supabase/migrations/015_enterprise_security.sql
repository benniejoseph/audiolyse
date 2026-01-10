-- =====================================================
-- SPRINT 3: ENTERPRISE SECURITY FEATURES
-- =====================================================
-- MFA, Session Management, Login History, Password Policy
-- =====================================================

-- =====================================================
-- 1. MFA FACTORS TABLE (extends Supabase auth)
-- =====================================================

CREATE TABLE IF NOT EXISTS mfa_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mfa_enabled BOOLEAN DEFAULT FALSE,
  mfa_method TEXT DEFAULT 'totp' CHECK (mfa_method IN ('totp', 'sms', 'email')),
  backup_codes TEXT[], -- encrypted backup codes
  recovery_email TEXT,
  recovery_phone TEXT,
  last_mfa_challenge TIMESTAMPTZ,
  failed_attempts INT DEFAULT 0,
  locked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- =====================================================
-- 2. LOGIN HISTORY TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS login_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  
  -- Login details
  event_type TEXT NOT NULL CHECK (event_type IN ('login', 'logout', 'failed_login', 'password_reset', 'mfa_challenge', 'mfa_success', 'mfa_failure', 'session_refresh')),
  success BOOLEAN DEFAULT TRUE,
  
  -- Device & Location
  ip_address INET,
  user_agent TEXT,
  device_type TEXT, -- desktop, mobile, tablet
  browser TEXT,
  os TEXT,
  country TEXT,
  city TEXT,
  
  -- Session info
  session_id TEXT,
  
  -- Risk assessment
  risk_score INT DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
  risk_factors TEXT[],
  is_suspicious BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_login_history_user ON login_history(user_id);
CREATE INDEX idx_login_history_org ON login_history(organization_id);
CREATE INDEX idx_login_history_created ON login_history(created_at DESC);
CREATE INDEX idx_login_history_suspicious ON login_history(is_suspicious) WHERE is_suspicious = TRUE;

-- =====================================================
-- 3. ACTIVE SESSIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Session details
  session_token TEXT NOT NULL UNIQUE,
  refresh_token TEXT,
  
  -- Device info
  ip_address INET,
  user_agent TEXT,
  device_type TEXT,
  device_name TEXT,
  browser TEXT,
  os TEXT,
  
  -- Location
  country TEXT,
  city TEXT,
  
  -- Status
  is_current BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Timestamps
  last_activity TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  revoked_at TIMESTAMPTZ
);

CREATE INDEX idx_user_sessions_user ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_active ON user_sessions(is_active) WHERE is_active = TRUE;

-- =====================================================
-- 4. SECURITY ALERTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS security_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  
  -- Alert details
  alert_type TEXT NOT NULL CHECK (alert_type IN (
    'suspicious_login', 'new_device', 'new_location', 
    'multiple_failures', 'password_change', 'mfa_disabled',
    'session_hijack', 'impossible_travel', 'brute_force'
  )),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  title TEXT NOT NULL,
  description TEXT,
  
  -- Related data
  login_history_id UUID REFERENCES login_history(id),
  session_id UUID REFERENCES user_sessions(id),
  
  -- Status
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'acknowledged', 'resolved', 'dismissed')),
  acknowledged_by UUID REFERENCES auth.users(id),
  acknowledged_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_security_alerts_user ON security_alerts(user_id);
CREATE INDEX idx_security_alerts_org ON security_alerts(organization_id);
CREATE INDEX idx_security_alerts_status ON security_alerts(status) WHERE status = 'new';

-- =====================================================
-- 5. PASSWORD POLICY TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS password_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Password requirements
  min_length INT DEFAULT 8,
  require_uppercase BOOLEAN DEFAULT TRUE,
  require_lowercase BOOLEAN DEFAULT TRUE,
  require_numbers BOOLEAN DEFAULT TRUE,
  require_special BOOLEAN DEFAULT TRUE,
  
  -- History & expiry
  password_history_count INT DEFAULT 5, -- prevent reuse of last N passwords
  max_age_days INT DEFAULT 90, -- force change after N days (0 = never)
  
  -- Lockout policy
  max_failed_attempts INT DEFAULT 5,
  lockout_duration_minutes INT DEFAULT 30,
  
  -- MFA requirements
  require_mfa BOOLEAN DEFAULT FALSE,
  mfa_grace_period_days INT DEFAULT 7, -- days before MFA required for new users
  
  -- Session policy
  session_timeout_minutes INT DEFAULT 480, -- 8 hours
  concurrent_sessions INT DEFAULT 5, -- max sessions per user
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id)
);

-- =====================================================
-- 6. PASSWORD HISTORY TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS password_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  password_hash TEXT NOT NULL, -- bcrypt hash for comparison
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_password_history_user ON password_history(user_id);

-- =====================================================
-- 7. ENHANCED ROLES & PERMISSIONS
-- =====================================================

-- Permissions table
CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  category TEXT NOT NULL, -- calls, team, settings, billing, admin
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default permissions
INSERT INTO permissions (name, description, category) VALUES
  -- Call permissions
  ('calls.view_own', 'View own call analyses', 'calls'),
  ('calls.view_team', 'View team call analyses', 'calls'),
  ('calls.view_all', 'View all organization call analyses', 'calls'),
  ('calls.analyze', 'Analyze new calls', 'calls'),
  ('calls.delete', 'Delete call analyses', 'calls'),
  ('calls.export', 'Export call data', 'calls'),
  ('calls.assign', 'Assign calls to team members', 'calls'),
  
  -- Team permissions
  ('team.view', 'View team members', 'team'),
  ('team.invite', 'Invite new team members', 'team'),
  ('team.manage', 'Manage team member roles', 'team'),
  ('team.remove', 'Remove team members', 'team'),
  
  -- Customer permissions
  ('customers.view', 'View customer profiles', 'customers'),
  ('customers.edit', 'Edit customer profiles', 'customers'),
  ('customers.delete', 'Delete customer profiles', 'customers'),
  
  -- Settings permissions
  ('settings.view', 'View organization settings', 'settings'),
  ('settings.edit', 'Edit organization settings', 'settings'),
  ('settings.ai', 'Configure AI settings', 'settings'),
  
  -- Billing permissions
  ('billing.view', 'View billing information', 'billing'),
  ('billing.manage', 'Manage billing and subscriptions', 'billing'),
  
  -- Admin permissions
  ('admin.dashboard', 'Access admin dashboard', 'admin'),
  ('admin.audit', 'View audit logs', 'admin'),
  ('admin.security', 'Manage security settings', 'admin')
ON CONFLICT (name) DO NOTHING;

-- Role permissions mapping
CREATE TABLE IF NOT EXISTS role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'manager', 'member', 'viewer')),
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(role, permission_id)
);

-- Assign default permissions to roles
INSERT INTO role_permissions (role, permission_id)
SELECT 'owner', id FROM permissions
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role, permission_id)
SELECT 'admin', id FROM permissions WHERE name NOT IN ('admin.dashboard')
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role, permission_id)
SELECT 'manager', id FROM permissions WHERE category IN ('calls', 'team', 'customers') OR name IN ('settings.view', 'settings.ai')
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role, permission_id)
SELECT 'member', id FROM permissions WHERE name IN (
  'calls.view_own', 'calls.analyze', 'calls.export',
  'team.view', 'customers.view', 'settings.view'
)
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role, permission_id)
SELECT 'viewer', id FROM permissions WHERE name IN (
  'calls.view_own', 'team.view', 'customers.view'
)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 8. TEAM HIERARCHY (REPORTS_TO)
-- =====================================================

-- Add reports_to column to organization_members
ALTER TABLE organization_members 
ADD COLUMN IF NOT EXISTS reports_to UUID REFERENCES organization_members(id),
ADD COLUMN IF NOT EXISTS department TEXT,
ADD COLUMN IF NOT EXISTS title TEXT;

-- Create index for hierarchy queries
CREATE INDEX IF NOT EXISTS idx_org_members_reports_to ON organization_members(reports_to);
CREATE INDEX IF NOT EXISTS idx_org_members_department ON organization_members(department);

-- =====================================================
-- 9. COACHING SESSIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS coaching_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Participants
  coach_id UUID NOT NULL REFERENCES auth.users(id),
  agent_id UUID NOT NULL REFERENCES auth.users(id),
  
  -- Session details
  session_type TEXT DEFAULT 'one_on_one' CHECK (session_type IN ('one_on_one', 'group', 'training', 'review')),
  title TEXT NOT NULL,
  description TEXT,
  
  -- Scheduling
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INT DEFAULT 30,
  
  -- Status
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled', 'no_show')),
  completed_at TIMESTAMPTZ,
  
  -- Related calls for review
  call_ids UUID[] DEFAULT '{}',
  
  -- Notes and outcomes
  agenda TEXT,
  notes TEXT,
  action_items JSONB DEFAULT '[]',
  goals JSONB DEFAULT '[]',
  
  -- Ratings
  agent_rating INT CHECK (agent_rating >= 1 AND agent_rating <= 5),
  coach_notes TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_coaching_sessions_org ON coaching_sessions(organization_id);
CREATE INDEX idx_coaching_sessions_coach ON coaching_sessions(coach_id);
CREATE INDEX idx_coaching_sessions_agent ON coaching_sessions(agent_id);
CREATE INDEX idx_coaching_sessions_scheduled ON coaching_sessions(scheduled_at);

-- =====================================================
-- 10. MANAGER ALERTS CONFIGURATION
-- =====================================================

CREATE TABLE IF NOT EXISTS manager_alert_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  manager_id UUID NOT NULL REFERENCES auth.users(id),
  
  -- Alert triggers
  low_score_threshold INT DEFAULT 60,
  negative_sentiment_alert BOOLEAN DEFAULT TRUE,
  forced_sale_alert BOOLEAN DEFAULT TRUE,
  compliance_violation_alert BOOLEAN DEFAULT TRUE,
  
  -- Notification channels
  email_alerts BOOLEAN DEFAULT TRUE,
  in_app_alerts BOOLEAN DEFAULT TRUE,
  
  -- Alert frequency
  alert_frequency TEXT DEFAULT 'realtime' CHECK (alert_frequency IN ('realtime', 'hourly', 'daily', 'weekly')),
  digest_time TIME DEFAULT '09:00',
  
  -- Monitored agents (null = all reports)
  monitored_agent_ids UUID[],
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, manager_id)
);

-- =====================================================
-- 11. WEBHOOKS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Webhook config
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  secret TEXT, -- for signature verification
  
  -- Events to trigger
  events TEXT[] NOT NULL DEFAULT '{}', -- analysis_complete, low_score, assignment, etc.
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Stats
  total_calls INT DEFAULT 0,
  successful_calls INT DEFAULT 0,
  last_triggered_at TIMESTAMPTZ,
  last_error TEXT,
  last_error_at TIMESTAMPTZ,
  
  -- Headers
  custom_headers JSONB DEFAULT '{}',
  
  -- Retry policy
  retry_count INT DEFAULT 3,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_webhooks_org ON webhooks(organization_id);
CREATE INDEX idx_webhooks_active ON webhooks(is_active) WHERE is_active = TRUE;

-- Webhook delivery log
CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
  
  -- Event details
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  
  -- Delivery status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed', 'retrying')),
  http_status INT,
  response_body TEXT,
  
  -- Timing
  attempt_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  delivered_at TIMESTAMPTZ
);

CREATE INDEX idx_webhook_deliveries_webhook ON webhook_deliveries(webhook_id);
CREATE INDEX idx_webhook_deliveries_status ON webhook_deliveries(status) WHERE status IN ('pending', 'retrying');

-- =====================================================
-- 12. ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on new tables
ALTER TABLE mfa_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE coaching_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE manager_alert_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_deliveries ENABLE ROW LEVEL SECURITY;

-- MFA Settings - users can only access their own
CREATE POLICY "Users can view own MFA settings"
  ON mfa_settings FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own MFA settings"
  ON mfa_settings FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own MFA settings"
  ON mfa_settings FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Login History - users can view their own, admins can view org
CREATE POLICY "Users can view own login history"
  ON login_history FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.user_id = auth.uid()
      AND om.organization_id = login_history.organization_id
      AND om.role IN ('owner', 'admin')
    )
  );

-- User Sessions - users can view/manage their own
CREATE POLICY "Users can view own sessions"
  ON user_sessions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can revoke own sessions"
  ON user_sessions FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Security Alerts - users can view their own
CREATE POLICY "Users can view own security alerts"
  ON security_alerts FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own security alerts"
  ON security_alerts FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Password Policies - org admins can manage
CREATE POLICY "Admins can view org password policy"
  ON password_policies FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.user_id = auth.uid()
      AND om.organization_id = password_policies.organization_id
      AND om.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Admins can manage org password policy"
  ON password_policies FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.user_id = auth.uid()
      AND om.organization_id = password_policies.organization_id
      AND om.role IN ('owner', 'admin')
    )
  );

-- Coaching Sessions - org members can view related sessions
CREATE POLICY "Members can view org coaching sessions"
  ON coaching_sessions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.user_id = auth.uid()
      AND om.organization_id = coaching_sessions.organization_id
    ) AND (
      coach_id = auth.uid() OR 
      agent_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM organization_members om
        WHERE om.user_id = auth.uid()
        AND om.organization_id = coaching_sessions.organization_id
        AND om.role IN ('owner', 'admin', 'manager')
      )
    )
  );

CREATE POLICY "Managers can create coaching sessions"
  ON coaching_sessions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.user_id = auth.uid()
      AND om.organization_id = coaching_sessions.organization_id
      AND om.role IN ('owner', 'admin', 'manager')
    )
  );

-- Manager Alert Configs - managers can manage their own
CREATE POLICY "Managers can manage own alert configs"
  ON manager_alert_configs FOR ALL
  TO authenticated
  USING (manager_id = auth.uid());

-- Webhooks - org admins can manage
CREATE POLICY "Admins can manage webhooks"
  ON webhooks FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.user_id = auth.uid()
      AND om.organization_id = webhooks.organization_id
      AND om.role IN ('owner', 'admin')
    )
  );

-- =====================================================
-- 13. HELPER FUNCTIONS
-- =====================================================

-- Check if user has permission
CREATE OR REPLACE FUNCTION check_permission(user_uuid UUID, permission_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
  has_perm BOOLEAN;
BEGIN
  -- Get user's role in their organization
  SELECT role INTO user_role
  FROM organization_members
  WHERE user_id = user_uuid
  LIMIT 1;
  
  IF user_role IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check if role has permission
  SELECT EXISTS (
    SELECT 1 
    FROM role_permissions rp
    JOIN permissions p ON rp.permission_id = p.id
    WHERE rp.role = user_role AND p.name = permission_name
  ) INTO has_perm;
  
  RETURN has_perm;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get user's direct reports
CREATE OR REPLACE FUNCTION get_direct_reports(manager_uuid UUID)
RETURNS TABLE (
  user_id UUID,
  full_name TEXT,
  email TEXT,
  role TEXT,
  department TEXT,
  title TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    om.user_id,
    p.full_name,
    p.email,
    om.role,
    om.department,
    om.title
  FROM organization_members om
  JOIN profiles p ON om.user_id = p.id
  WHERE om.reports_to = (
    SELECT id FROM organization_members WHERE user_id = manager_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Log login event
CREATE OR REPLACE FUNCTION log_login_event(
  p_user_id UUID,
  p_event_type TEXT,
  p_success BOOLEAN,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  v_org_id UUID;
  v_login_id UUID;
  v_risk_score INT := 0;
  v_risk_factors TEXT[] := '{}';
  v_is_suspicious BOOLEAN := FALSE;
BEGIN
  -- Get user's organization
  SELECT organization_id INTO v_org_id
  FROM organization_members
  WHERE user_id = p_user_id
  LIMIT 1;
  
  -- Calculate risk score
  -- Check for multiple failed logins
  IF p_event_type = 'failed_login' THEN
    SELECT COUNT(*) INTO v_risk_score
    FROM login_history
    WHERE user_id = p_user_id
    AND event_type = 'failed_login'
    AND created_at > NOW() - INTERVAL '1 hour';
    
    IF v_risk_score >= 5 THEN
      v_risk_factors := array_append(v_risk_factors, 'multiple_failures');
      v_is_suspicious := TRUE;
      v_risk_score := v_risk_score * 10;
    END IF;
  END IF;
  
  -- Check for new IP
  IF p_ip_address IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM login_history
      WHERE user_id = p_user_id
      AND ip_address = p_ip_address
      AND success = TRUE
    ) THEN
      v_risk_factors := array_append(v_risk_factors, 'new_ip');
      v_risk_score := v_risk_score + 20;
    END IF;
  END IF;
  
  -- Insert login record
  INSERT INTO login_history (
    user_id, organization_id, event_type, success,
    ip_address, user_agent, risk_score, risk_factors,
    is_suspicious, metadata
  ) VALUES (
    p_user_id, v_org_id, p_event_type, p_success,
    p_ip_address, p_user_agent, LEAST(v_risk_score, 100), v_risk_factors,
    v_is_suspicious, p_metadata
  ) RETURNING id INTO v_login_id;
  
  -- Create alert for suspicious activity
  IF v_is_suspicious AND p_success THEN
    INSERT INTO security_alerts (
      user_id, organization_id, alert_type, severity,
      title, description, login_history_id
    ) VALUES (
      p_user_id, v_org_id, 'suspicious_login', 'high',
      'Suspicious login detected',
      'Login from new location or after multiple failed attempts',
      v_login_id
    );
  END IF;
  
  RETURN v_login_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION check_permission TO authenticated;
GRANT EXECUTE ON FUNCTION get_direct_reports TO authenticated;
GRANT EXECUTE ON FUNCTION log_login_event TO authenticated;
