-- Fix infinite recursion in organization_members by dropping ALL policies and rebuilding cleanly
-- This ensures no "ghost" policies remain that cause recursion

-- 1. Drop all existing policies on organization_members to start fresh
DROP POLICY IF EXISTS "Members can view org members" ON organization_members;
DROP POLICY IF EXISTS "Admins can manage org members" ON organization_members;
DROP POLICY IF EXISTS "Users can view own membership" ON organization_members;
DROP POLICY IF EXISTS "Owners can view all members in their orgs" ON organization_members;
DROP POLICY IF EXISTS "Members can view other members in same org" ON organization_members;
DROP POLICY IF EXISTS "Owners can insert members" ON organization_members;
DROP POLICY IF EXISTS "Admins can update members" ON organization_members;
DROP POLICY IF EXISTS "Admins can delete members" ON organization_members;
DROP POLICY IF EXISTS "Members can view organization members" ON organization_members; -- Potential duplicate name

-- 2. Create/Replace Helper Functions with SECURITY DEFINER
-- IMPORTANT: These functions MUST be SECURITY DEFINER to bypass RLS and avoid recursion
CREATE OR REPLACE FUNCTION is_org_member(org_id UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- SECURITY DEFINER with SET search_path to ensure RLS bypass
  -- This runs as the table owner (postgres), which bypasses RLS
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
  RETURN EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = org_id
    AND user_id = user_uuid
    AND role IN ('owner', 'admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Recreate Policies using the Helper Functions (or direct checks where safe)

-- SELECT: Users can see their own rows (Safe, no recursion)
CREATE POLICY "view_own_membership"
  ON organization_members FOR SELECT
  USING (user_id = auth.uid());

-- SELECT: Users can see members of organizations they belong to
-- Uses is_org_member() which is SECURITY DEFINER -> No Recursion
CREATE POLICY "view_members_of_my_orgs"
  ON organization_members FOR SELECT
  USING (is_org_member(organization_id, auth.uid()));

-- INSERT: Only Owners (via organizations table) can insert members
-- Checks organizations table, not organization_members -> No Recursion
CREATE POLICY "owners_insert_members"
  ON organization_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organizations
      WHERE id = organization_members.organization_id
      AND owner_id = auth.uid()
    )
  );

-- UPDATE: Owners (via organizations) OR Admins (via helper) can update
CREATE POLICY "admins_update_members"
  ON organization_members FOR UPDATE
  USING (
    (EXISTS (
      SELECT 1 FROM organizations
      WHERE id = organization_members.organization_id
      AND owner_id = auth.uid()
    ))
    OR
    is_org_admin(organization_id, auth.uid())
  );

-- DELETE: Owners (via organizations) OR Admins (via helper) can delete
CREATE POLICY "admins_delete_members"
  ON organization_members FOR DELETE
  USING (
    (EXISTS (
      SELECT 1 FROM organizations
      WHERE id = organization_members.organization_id
      AND owner_id = auth.uid()
    ))
    OR
    is_org_admin(organization_id, auth.uid())
  );
