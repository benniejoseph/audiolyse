-- COMPLETE FIX: All cross-table checks must use SECURITY DEFINER functions
-- This eliminates ALL possible recursion paths

-- 1. DROP ALL POLICIES on both tables
DROP POLICY IF EXISTS "view_organizations" ON organizations;
DROP POLICY IF EXISTS "create_organizations" ON organizations;
DROP POLICY IF EXISTS "update_organizations" ON organizations;
DROP POLICY IF EXISTS "delete_organizations" ON organizations;
DROP POLICY IF EXISTS "Users can view their organizations" ON organizations;
DROP POLICY IF EXISTS "Users can create organizations" ON organizations;
DROP POLICY IF EXISTS "Owners can update organizations" ON organizations;
DROP POLICY IF EXISTS "Owners can delete organizations" ON organizations;

DROP POLICY IF EXISTS "view_own_membership" ON organization_members;
DROP POLICY IF EXISTS "view_members_of_my_orgs" ON organization_members;
DROP POLICY IF EXISTS "owners_insert_members" ON organization_members;
DROP POLICY IF EXISTS "admins_update_members" ON organization_members;
DROP POLICY IF EXISTS "admins_delete_members" ON organization_members;
DROP POLICY IF EXISTS "Members can view org members" ON organization_members;
DROP POLICY IF EXISTS "Admins can manage org members" ON organization_members;
DROP POLICY IF EXISTS "Users can view own membership" ON organization_members;
DROP POLICY IF EXISTS "Owners can view all members in their orgs" ON organization_members;
DROP POLICY IF EXISTS "Members can view other members in same org" ON organization_members;
DROP POLICY IF EXISTS "Owners can insert members" ON organization_members;
DROP POLICY IF EXISTS "Admins can update members" ON organization_members;
DROP POLICY IF EXISTS "Admins can delete members" ON organization_members;

-- 2. CREATE ALL HELPER FUNCTIONS WITH SECURITY DEFINER
-- These bypass RLS entirely, breaking all recursion

CREATE OR REPLACE FUNCTION is_org_member(org_id UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = org_id AND user_id = user_uuid
  );
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION is_org_admin(org_id UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = org_id AND user_id = user_uuid AND role IN ('owner', 'admin')
  );
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION is_org_owner(org_id UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM organizations
    WHERE id = org_id AND owner_id = user_uuid
  );
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

-- 3. ORGANIZATIONS POLICIES (using ONLY SECURITY DEFINER functions or direct owner check)

CREATE POLICY "org_select"
  ON organizations FOR SELECT
  USING (owner_id = auth.uid() OR is_org_member(id, auth.uid()));

CREATE POLICY "org_insert"
  ON organizations FOR INSERT
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "org_update"
  ON organizations FOR UPDATE
  USING (owner_id = auth.uid());

CREATE POLICY "org_delete"
  ON organizations FOR DELETE
  USING (owner_id = auth.uid());

-- 4. ORGANIZATION_MEMBERS POLICIES (using ONLY SECURITY DEFINER functions)

CREATE POLICY "members_select_own"
  ON organization_members FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "members_select_org"
  ON organization_members FOR SELECT
  USING (is_org_member(organization_id, auth.uid()));

CREATE POLICY "members_insert"
  ON organization_members FOR INSERT
  WITH CHECK (is_org_owner(organization_id, auth.uid()));

CREATE POLICY "members_update"
  ON organization_members FOR UPDATE
  USING (is_org_owner(organization_id, auth.uid()) OR is_org_admin(organization_id, auth.uid()));

CREATE POLICY "members_delete"
  ON organization_members FOR DELETE
  USING (is_org_owner(organization_id, auth.uid()) OR is_org_admin(organization_id, auth.uid()));
