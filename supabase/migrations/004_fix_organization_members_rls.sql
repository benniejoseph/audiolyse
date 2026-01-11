-- Fix infinite recursion in organization_members RLS policies
-- The issue: Policies query organization_members to check membership, which triggers the same policy again

-- Drop the problematic policies
DROP POLICY IF EXISTS "Members can view org members" ON organization_members;
DROP POLICY IF EXISTS "Admins can manage org members" ON organization_members;

-- Helper function to check if user is member of an org (with SECURITY DEFINER to bypass RLS)
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

-- Policy 1: Users can always see their own membership (no recursion)
CREATE POLICY "Users can view own membership"
  ON organization_members FOR SELECT
  USING (user_id = auth.uid());

-- Policy 2: Owners can see all members in their organizations (via organizations table, no recursion)
CREATE POLICY "Owners can view all members in their orgs"
  ON organization_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organizations
      WHERE id = organization_members.organization_id
      AND owner_id = auth.uid()
    )
  );

-- Policy 3: Members can see other members using the helper function (avoids recursion)
CREATE POLICY "Members can view other members in same org"
  ON organization_members FOR SELECT
  USING (
    is_org_member(organization_id, auth.uid())
  );

-- Policy for INSERT: Only owners can add members (via organizations table, no recursion)
CREATE POLICY "Owners can insert members"
  ON organization_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organizations
      WHERE id = organization_members.organization_id
      AND owner_id = auth.uid()
    )
  );

-- Helper function to check if user is admin/owner (with SECURITY DEFINER to bypass RLS)
CREATE OR REPLACE FUNCTION is_org_admin(org_id UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- SECURITY DEFINER with SET search_path to ensure RLS bypass
  SET LOCAL search_path = public;
  RETURN EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = org_id
    AND user_id = user_uuid
    AND role IN ('owner', 'admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Policy for UPDATE: Only owners/admins can update (using helper functions to avoid recursion)
CREATE POLICY "Admins can update members"
  ON organization_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM organizations
      WHERE id = organization_members.organization_id
      AND owner_id = auth.uid()
    )
    OR
    is_org_admin(organization_id, auth.uid())
  );

-- Policy for DELETE: Only owners/admins can delete (using helper functions to avoid recursion)
CREATE POLICY "Admins can delete members"
  ON organization_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM organizations
      WHERE id = organization_members.organization_id
      AND owner_id = auth.uid()
    )
    OR
    is_org_admin(organization_id, auth.uid())
  );

-- Note: SECURITY DEFINER functions bypass RLS, so handle_new_user trigger will work
-- without needing additional policies

