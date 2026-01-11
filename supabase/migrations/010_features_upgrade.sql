-- Feature Upgrade: Onboarding, Hierarchy, AI Context, Call Assignment

-- 1. Organization Updates
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS industry TEXT,
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS ai_settings JSONB DEFAULT '{}'::jsonb;
-- ai_settings structure: { "context": "...", "products": [...], "competitors": [...], "guidelines": "..." }

-- 2. Profile/Member Updates for Hierarchy
ALTER TABLE organization_members
ADD COLUMN IF NOT EXISTS reports_to UUID REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS department TEXT;

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS job_title TEXT;

-- 3. Call Assignment
ALTER TABLE call_analyses
ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES profiles(id);

-- Create index for assigned_to
CREATE INDEX IF NOT EXISTS idx_call_analyses_assigned ON call_analyses(assigned_to);

-- 4. RLS Updates for Call Assignment & Hierarchy

-- Function to check if a user manages another user (recursive or direct)
-- For simplicity and performance in RLS, we'll implement:
-- 1. Owners/Admins see all.
-- 2. Team Leads see data of members in their team.
-- 3. Direct managers (via reports_to) see data of their reports.

-- Update call_analyses policies

-- Drop existing "Members can view analyses" policy to replace it with a more comprehensive one
DROP POLICY IF EXISTS "members_view_analyses" ON call_analyses;

CREATE POLICY "members_view_analyses_enhanced"
  ON call_analyses FOR SELECT
  USING (
    -- 1. User is the uploader
    uploaded_by = auth.uid()
    -- 2. User is the assignee
    OR assigned_to = auth.uid()
    -- 3. User is an Org Admin/Owner (Standard check)
    OR check_org_admin(organization_id, auth.uid())
    -- 4. User is a Team Lead of the uploader or assignee
    OR EXISTS (
      SELECT 1 FROM team_members tm_lead
      JOIN team_members tm_member ON tm_lead.team_id = tm_member.team_id
      WHERE tm_lead.user_id = auth.uid() 
      AND tm_lead.role = 'lead'
      AND (tm_member.user_id = call_analyses.uploaded_by OR tm_member.user_id = call_analyses.assigned_to)
    )
    -- 5. User is the direct manager (reports_to) of uploader or assignee
    OR EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = call_analyses.organization_id
      AND om.reports_to = auth.uid()
      AND (om.user_id = call_analyses.uploaded_by OR om.user_id = call_analyses.assigned_to)
    )
  );

-- Update "Members can update own analyses" to allow assignees to update (e.g. status, notes)
DROP POLICY IF EXISTS "Members can update own analyses" ON call_analyses;
CREATE POLICY "members_update_analyses_enhanced"
  ON call_analyses FOR UPDATE
  USING (
    uploaded_by = auth.uid() 
    OR assigned_to = auth.uid()
    OR check_org_admin(organization_id, auth.uid())
  );

-- Allow assigning calls (update policy) - implicitly covered above if they can view/update
-- But we need to ensure they can SET the assigned_to field.
-- RLS checks row existence, not specific column changes usually, so the above UPDATE policy covers it.

-- 5. Helper function to get organization AI settings
CREATE OR REPLACE FUNCTION get_org_ai_settings(org_id UUID)
RETURNS JSONB
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT ai_settings FROM organizations WHERE id = org_id;
$$;
