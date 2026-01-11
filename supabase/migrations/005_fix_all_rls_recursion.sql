-- Fix ALL RLS policies that query organization_members to prevent infinite recursion
-- This migration fixes policies on organizations, teams, call_analyses, usage_logs, etc.

-- First, ensure our helper functions exist and are correct
CREATE OR REPLACE FUNCTION is_org_member(org_id UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- SECURITY DEFINER with SET search_path to ensure RLS bypass
  SET LOCAL search_path = public;
  RETURN EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = org_id
    AND user_id = user_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION is_org_admin(org_id UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  SET LOCAL search_path = public;
  RETURN EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = org_id
    AND user_id = user_uuid
    AND role IN ('owner', 'admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix organizations table policy
DROP POLICY IF EXISTS "Users can view their organizations" ON organizations;
CREATE POLICY "Users can view their organizations"
  ON organizations FOR SELECT
  USING (
    owner_id = auth.uid()
    OR
    is_org_member(id, auth.uid())
  );

-- Fix teams table policies
DROP POLICY IF EXISTS "Members can view teams" ON teams;
CREATE POLICY "Members can view teams"
  ON teams FOR SELECT
  USING (
    is_org_member(organization_id, auth.uid())
  );

DROP POLICY IF EXISTS "Admins can manage teams" ON teams;
CREATE POLICY "Admins can manage teams"
  ON teams FOR ALL
  USING (
    is_org_admin(organization_id, auth.uid())
    OR
    EXISTS (
      SELECT 1 FROM organizations
      WHERE id = teams.organization_id
      AND owner_id = auth.uid()
    )
  );

-- Fix team_members table policy
DROP POLICY IF EXISTS "Members can view team members" ON team_members;
CREATE POLICY "Members can view team members"
  ON team_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM teams
      WHERE id = team_members.team_id
      AND is_org_member(organization_id, auth.uid())
    )
  );

-- Fix call_analyses table policies
DROP POLICY IF EXISTS "Members can view analyses" ON call_analyses;
CREATE POLICY "Members can view analyses"
  ON call_analyses FOR SELECT
  USING (
    is_org_member(organization_id, auth.uid())
  );

DROP POLICY IF EXISTS "Members can create analyses" ON call_analyses;
CREATE POLICY "Members can create analyses"
  ON call_analyses FOR INSERT
  WITH CHECK (
    is_org_member(organization_id, auth.uid())
  );

-- Fix usage_logs table policy
DROP POLICY IF EXISTS "Members can view usage logs" ON usage_logs;
CREATE POLICY "Members can view usage logs"
  ON usage_logs FOR SELECT
  USING (
    is_org_member(organization_id, auth.uid())
  );

-- Fix invitations table policy
DROP POLICY IF EXISTS "Admins can manage invitations" ON invitations;
CREATE POLICY "Admins can manage invitations"
  ON invitations FOR ALL
  USING (
    is_org_admin(organization_id, auth.uid())
    OR
    EXISTS (
      SELECT 1 FROM organizations
      WHERE id = invitations.organization_id
      AND owner_id = auth.uid()
    )
  );

-- Fix credits_transactions policy (from migration 003)
DROP POLICY IF EXISTS "Users can view their organization's credit transactions" ON credits_transactions;
CREATE POLICY "Users can view their organization's credit transactions"
  ON credits_transactions FOR SELECT
  USING (
    is_org_member(organization_id, auth.uid())
  );

