-- Migration 020: Final fix for RLS recursion on organizations and organization_members
-- This migration completely rebuilds RLS policies to prevent infinite recursion

-- =============================================================================
-- STEP 1: DROP ALL EXISTING POLICIES ON BOTH TABLES
-- =============================================================================

-- Drop ALL policies on organizations
DROP POLICY IF EXISTS "Owners can update their organizations" ON organizations;
DROP POLICY IF EXISTS "Postgres can manage organizations" ON organizations;
DROP POLICY IF EXISTS "Service role can insert organizations" ON organizations;
DROP POLICY IF EXISTS "Users can view own organizations" ON organizations;
DROP POLICY IF EXISTS "org_delete" ON organizations;
DROP POLICY IF EXISTS "org_insert" ON organizations;
DROP POLICY IF EXISTS "org_select" ON organizations;
DROP POLICY IF EXISTS "org_update" ON organizations;
DROP POLICY IF EXISTS "users_view_orgs" ON organizations;
DROP POLICY IF EXISTS "org_owner_select" ON organizations;
DROP POLICY IF EXISTS "org_member_select" ON organizations;
DROP POLICY IF EXISTS "org_owner_insert" ON organizations;
DROP POLICY IF EXISTS "org_owner_update" ON organizations;
DROP POLICY IF EXISTS "org_owner_delete" ON organizations;

-- Drop ALL policies on organization_members
DROP POLICY IF EXISTS "members_delete" ON organization_members;
DROP POLICY IF EXISTS "members_insert" ON organization_members;
DROP POLICY IF EXISTS "members_see_others" ON organization_members;
DROP POLICY IF EXISTS "members_select_org" ON organization_members;
DROP POLICY IF EXISTS "members_select_own" ON organization_members;
DROP POLICY IF EXISTS "members_update" ON organization_members;
DROP POLICY IF EXISTS "owners_see_all_members" ON organization_members;
DROP POLICY IF EXISTS "users_own_membership" ON organization_members;
DROP POLICY IF EXISTS "members_own_select" ON organization_members;
DROP POLICY IF EXISTS "members_coworker_select" ON organization_members;
DROP POLICY IF EXISTS "members_admin_insert" ON organization_members;
DROP POLICY IF EXISTS "members_admin_update" ON organization_members;
DROP POLICY IF EXISTS "members_admin_delete" ON organization_members;

-- =============================================================================
-- STEP 2: CREATE/REPLACE HELPER FUNCTIONS WITH COMPLETE RLS BYPASS
-- =============================================================================

-- is_org_member: Checks if a user is a member of an organization
-- Uses plpgsql with SET LOCAL row_security = off to completely bypass RLS
CREATE OR REPLACE FUNCTION is_org_member(org_id uuid, user_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
    result boolean;
BEGIN
    SET LOCAL row_security = off;
    SELECT EXISTS (
        SELECT 1 FROM organization_members
        WHERE organization_id = org_id AND user_id = user_uuid
    ) INTO result;
    RETURN result;
END;
$$;

-- is_org_admin: Checks if a user is an admin or owner of an organization
CREATE OR REPLACE FUNCTION is_org_admin(org_id uuid, user_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
    result boolean;
BEGIN
    SET LOCAL row_security = off;
    SELECT EXISTS (
        SELECT 1 FROM organization_members
        WHERE organization_id = org_id AND user_id = user_uuid AND role IN ('owner', 'admin')
    ) INTO result;
    RETURN result;
END;
$$;

-- check_org_membership: Alternative membership check function (for backward compatibility)
CREATE OR REPLACE FUNCTION check_org_membership(org_id uuid, check_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
    result boolean;
BEGIN
    SET LOCAL row_security = off;
    SELECT EXISTS (
        SELECT 1 FROM organization_members
        WHERE organization_id = org_id AND user_id = check_user_id
    ) INTO result;
    RETURN result;
END;
$$;

-- =============================================================================
-- STEP 3: CREATE CLEAN POLICIES FOR ORGANIZATIONS TABLE
-- =============================================================================

-- Organizations: SELECT - owners can always see their own org (direct check)
CREATE POLICY "org_owner_select" ON organizations
FOR SELECT USING (owner_id = auth.uid());

-- Organizations: SELECT - members can see their org via RLS-bypassing function
CREATE POLICY "org_member_select" ON organizations  
FOR SELECT USING (is_org_member(id, auth.uid()));

-- Organizations: INSERT - users can create orgs they own
CREATE POLICY "org_owner_insert" ON organizations
FOR INSERT WITH CHECK (owner_id = auth.uid());

-- Organizations: UPDATE - only owners can update (direct check)
CREATE POLICY "org_owner_update" ON organizations
FOR UPDATE USING (owner_id = auth.uid());

-- Organizations: DELETE - only owners can delete (direct check)
CREATE POLICY "org_owner_delete" ON organizations
FOR DELETE USING (owner_id = auth.uid());

-- =============================================================================
-- STEP 4: CREATE CLEAN POLICIES FOR ORGANIZATION_MEMBERS TABLE
-- =============================================================================

-- Members: SELECT own membership (direct check - no cross-table query)
CREATE POLICY "members_own_select" ON organization_members
FOR SELECT USING (user_id = auth.uid());

-- Members: SELECT - org members can see other members via RLS-bypassing function
CREATE POLICY "members_coworker_select" ON organization_members
FOR SELECT USING (is_org_member(organization_id, auth.uid()));

-- Members: INSERT - only org admins can add members
CREATE POLICY "members_admin_insert" ON organization_members
FOR INSERT WITH CHECK (is_org_admin(organization_id, auth.uid()));

-- Members: UPDATE - only org admins can update
CREATE POLICY "members_admin_update" ON organization_members
FOR UPDATE USING (is_org_admin(organization_id, auth.uid()));

-- Members: DELETE - only org admins can remove
CREATE POLICY "members_admin_delete" ON organization_members
FOR DELETE USING (is_org_admin(organization_id, auth.uid()));
