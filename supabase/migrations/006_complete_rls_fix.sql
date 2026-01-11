-- Complete RLS fix - Drop all problematic policies and recreate them properly
-- This migration ensures no recursion by using SECURITY DEFINER functions that truly bypass RLS

-- Step 1: Drop ALL existing policies that might cause recursion
DROP POLICY IF EXISTS "Members can view org members" ON organization_members;
DROP POLICY IF EXISTS "Admins can manage org members" ON organization_members;
DROP POLICY IF EXISTS "Users can view own membership" ON organization_members;
DROP POLICY IF EXISTS "Owners can view all members in their orgs" ON organization_members;
DROP POLICY IF EXISTS "Members can view other members in same org" ON organization_members;
DROP POLICY IF EXISTS "Owners can insert members" ON organization_members;
DROP POLICY IF EXISTS "Admins can update members" ON organization_members;
DROP POLICY IF EXISTS "Admins can delete members" ON organization_members;

DROP POLICY IF EXISTS "Users can view their organizations" ON organizations;
DROP POLICY IF EXISTS "Members can view teams" ON teams;
DROP POLICY IF EXISTS "Admins can manage teams" ON teams;
DROP POLICY IF EXISTS "Members can view team members" ON team_members;
DROP POLICY IF EXISTS "Members can view analyses" ON call_analyses;
DROP POLICY IF EXISTS "Members can create analyses" ON call_analyses;
DROP POLICY IF EXISTS "Members can view usage logs" ON usage_logs;
DROP POLICY IF EXISTS "Admins can manage invitations" ON invitations;
DROP POLICY IF EXISTS "Users can view their organization's credit transactions" ON credits_transactions;

-- Step 2: Create helper functions with proper SECURITY DEFINER and RLS bypass
-- These functions will be owned by postgres (superuser) to truly bypass RLS
CREATE OR REPLACE FUNCTION is_org_member(org_id UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- This function runs with the privileges of the function owner (postgres)
  -- which bypasses RLS completely
  RETURN EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = org_id
    AND user_id = user_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
STABLE;

CREATE OR REPLACE FUNCTION is_org_admin(org_id UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = org_id
    AND user_id = user_uuid
    AND role IN ('owner', 'admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
STABLE;

-- Step 3: Recreate organization_members policies (no recursion)
CREATE POLICY "Users can view own membership"
  ON organization_members FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Owners can view all members"
  ON organization_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.organizations
      WHERE id = organization_members.organization_id
      AND owner_id = auth.uid()
    )
  );

CREATE POLICY "Members can view other members"
  ON organization_members FOR SELECT
  USING (is_org_member(organization_id, auth.uid()));

CREATE POLICY "Owners can insert members"
  ON organization_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organizations
      WHERE id = organization_members.organization_id
      AND owner_id = auth.uid()
    )
  );

CREATE POLICY "Admins can update members"
  ON organization_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.organizations
      WHERE id = organization_members.organization_id
      AND owner_id = auth.uid()
    )
    OR is_org_admin(organization_id, auth.uid())
  );

CREATE POLICY "Admins can delete members"
  ON organization_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.organizations
      WHERE id = organization_members.organization_id
      AND owner_id = auth.uid()
    )
    OR is_org_admin(organization_id, auth.uid())
  );

-- Step 4: Recreate organizations policies
CREATE POLICY "Users can view their organizations"
  ON organizations FOR SELECT
  USING (
    owner_id = auth.uid()
    OR is_org_member(id, auth.uid())
  );

-- Step 5: Recreate teams policies
CREATE POLICY "Members can view teams"
  ON teams FOR SELECT
  USING (is_org_member(organization_id, auth.uid()));

CREATE POLICY "Admins can manage teams"
  ON teams FOR ALL
  USING (
    is_org_admin(organization_id, auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.organizations
      WHERE id = teams.organization_id
      AND owner_id = auth.uid()
    )
  );

-- Step 6: Recreate team_members policies
CREATE POLICY "Members can view team members"
  ON team_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.teams
      WHERE id = team_members.team_id
      AND is_org_member(organization_id, auth.uid())
    )
  );

-- Step 7: Recreate call_analyses policies
CREATE POLICY "Members can view analyses"
  ON call_analyses FOR SELECT
  USING (is_org_member(organization_id, auth.uid()));

CREATE POLICY "Members can create analyses"
  ON call_analyses FOR INSERT
  WITH CHECK (is_org_member(organization_id, auth.uid()));

-- Step 8: Recreate usage_logs policies
CREATE POLICY "Members can view usage logs"
  ON usage_logs FOR SELECT
  USING (is_org_member(organization_id, auth.uid()));

-- Step 9: Recreate invitations policies
CREATE POLICY "Admins can manage invitations"
  ON invitations FOR ALL
  USING (
    is_org_admin(organization_id, auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.organizations
      WHERE id = invitations.organization_id
      AND owner_id = auth.uid()
    )
  );

-- Step 10: Recreate credits_transactions policies
CREATE POLICY "Users can view their organization's credit transactions"
  ON credits_transactions FOR SELECT
  USING (is_org_member(organization_id, auth.uid()));

-- Grant execute permissions on helper functions to authenticated users
GRANT EXECUTE ON FUNCTION is_org_member(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_org_admin(UUID, UUID) TO authenticated;

