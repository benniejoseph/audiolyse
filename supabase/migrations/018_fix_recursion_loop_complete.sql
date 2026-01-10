-- Complete fix for infinite recursion between organizations and organization_members
-- Drops and recreates policies for BOTH tables to ensure the cycle is broken

-- 1. DROP ALL POLICIES on organizations
DROP POLICY IF EXISTS "Users can view their organizations" ON organizations;
DROP POLICY IF EXISTS "view_organizations" ON organizations;
DROP POLICY IF EXISTS "Users can create organizations" ON organizations;
DROP POLICY IF EXISTS "users_create_organizations" ON organizations;
DROP POLICY IF EXISTS "Owners can update organizations" ON organizations;
DROP POLICY IF EXISTS "owners_update_organizations" ON organizations;
DROP POLICY IF EXISTS "Owners can delete organizations" ON organizations;

-- 2. DROP ALL POLICIES on organization_members
DROP POLICY IF EXISTS "Members can view org members" ON organization_members;
DROP POLICY IF EXISTS "Admins can manage org members" ON organization_members;
DROP POLICY IF EXISTS "Users can view own membership" ON organization_members;
DROP POLICY IF EXISTS "view_own_membership" ON organization_members;
DROP POLICY IF EXISTS "Owners can view all members in their orgs" ON organization_members;
DROP POLICY IF EXISTS "Members can view other members in same org" ON organization_members;
DROP POLICY IF EXISTS "view_members_of_my_orgs" ON organization_members;
DROP POLICY IF EXISTS "Owners can insert members" ON organization_members;
DROP POLICY IF EXISTS "owners_insert_members" ON organization_members;
DROP POLICY IF EXISTS "Admins can update members" ON organization_members;
DROP POLICY IF EXISTS "admins_update_members" ON organization_members;
DROP POLICY IF EXISTS "Admins can delete members" ON organization_members;
DROP POLICY IF EXISTS "admins_delete_members" ON organization_members;
DROP POLICY IF EXISTS "Members can view organization members" ON organization_members;

-- 3. ENSURE HELPER FUNCTIONS ARE SECURITY DEFINER (Bypass RLS)
CREATE OR REPLACE FUNCTION is_org_member(org_id UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- SECURITY DEFINER ensures this runs without RLS constraints on organization_members
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

-- 4. RECREATE POLICIES FOR ORGANIZATIONS

-- SELECT: Owner OR Member (via SECURITY DEFINER function)
CREATE POLICY "view_organizations"
  ON organizations FOR SELECT
  USING (
    auth.uid() = owner_id
    OR
    is_org_member(id, auth.uid())
  );

-- INSERT: Authenticated users can create an org if they are the owner
CREATE POLICY "create_organizations"
  ON organizations FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- UPDATE: Only Owner
CREATE POLICY "update_organizations"
  ON organizations FOR UPDATE
  USING (auth.uid() = owner_id);

-- DELETE: Only Owner
CREATE POLICY "delete_organizations"
  ON organizations FOR DELETE
  USING (auth.uid() = owner_id);


-- 5. RECREATE POLICIES FOR ORGANIZATION_MEMBERS

-- SELECT: Users can see their own membership
CREATE POLICY "view_own_membership"
  ON organization_members FOR SELECT
  USING (user_id = auth.uid());

-- SELECT: Users can see members of organizations they belong to
-- uses is_org_member (SECURITY DEFINER) -> No recursion
CREATE POLICY "view_members_of_my_orgs"
  ON organization_members FOR SELECT
  USING (is_org_member(organization_id, auth.uid()));

-- INSERT: Owners (via organizations check) can insert
-- Accessing organizations table triggers organizations RLS.
-- organizations RLS uses is_org_member (SECURITY DEFINER) -> Breaks recursion.
CREATE POLICY "owners_insert_members"
  ON organization_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organizations
      WHERE id = organization_members.organization_id
      AND owner_id = auth.uid()
    )
  );

-- UPDATE: Owners OR Admins can update
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

-- DELETE: Owners OR Admins can delete
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
