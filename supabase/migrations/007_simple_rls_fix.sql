-- Simple and direct RLS fix - Use a different approach
-- Instead of querying organization_members in policies, we'll use a simpler pattern

-- Drop all existing policies on organization_members
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'organization_members' AND schemaname = 'public') 
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON organization_members';
    END LOOP;
END $$;

-- Create a simple function that bypasses RLS completely
-- This function will be used by all policies
CREATE OR REPLACE FUNCTION check_org_membership(org_id UUID, check_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
    result BOOLEAN;
BEGIN
    -- Explicitly disable RLS for this query
    SET LOCAL row_security = off;
    
    SELECT EXISTS (
        SELECT 1 
        FROM organization_members 
        WHERE organization_id = org_id 
        AND user_id = check_user_id
    ) INTO result;
    
    RETURN result;
END;
$$;

-- Create function to check admin role
CREATE OR REPLACE FUNCTION check_org_admin(org_id UUID, check_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
    result BOOLEAN;
BEGIN
    SET LOCAL row_security = off;
    
    SELECT EXISTS (
        SELECT 1 
        FROM organization_members 
        WHERE organization_id = org_id 
        AND user_id = check_user_id
        AND role IN ('owner', 'admin')
    ) INTO result;
    
    RETURN result;
END;
$$;

-- Now create simple policies for organization_members
CREATE POLICY "users_own_membership"
    ON organization_members FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "owners_see_all_members"
    ON organization_members FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM organizations
            WHERE id = organization_members.organization_id
            AND owner_id = auth.uid()
        )
    );

CREATE POLICY "members_see_others"
    ON organization_members FOR SELECT
    USING (check_org_membership(organization_id, auth.uid()));

CREATE POLICY "owners_insert_members"
    ON organization_members FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM organizations
            WHERE id = organization_members.organization_id
            AND owner_id = auth.uid()
        )
    );

CREATE POLICY "admins_update_members"
    ON organization_members FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM organizations
            WHERE id = organization_members.organization_id
            AND owner_id = auth.uid()
        )
        OR check_org_admin(organization_id, auth.uid())
    );

CREATE POLICY "admins_delete_members"
    ON organization_members FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM organizations
            WHERE id = organization_members.organization_id
            AND owner_id = auth.uid()
        )
        OR check_org_admin(organization_id, auth.uid())
    );

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION check_org_membership(UUID, UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION check_org_admin(UUID, UUID) TO authenticated, anon;

-- Update organizations policy
DROP POLICY IF EXISTS "Users can view their organizations" ON organizations;
CREATE POLICY "users_view_orgs"
    ON organizations FOR SELECT
    USING (
        owner_id = auth.uid()
        OR check_org_membership(id, auth.uid())
    );

-- Update other policies to use the new function
DROP POLICY IF EXISTS "Members can view teams" ON teams;
CREATE POLICY "members_view_teams"
    ON teams FOR SELECT
    USING (check_org_membership(organization_id, auth.uid()));

DROP POLICY IF EXISTS "Members can view analyses" ON call_analyses;
CREATE POLICY "members_view_analyses"
    ON call_analyses FOR SELECT
    USING (check_org_membership(organization_id, auth.uid()));

DROP POLICY IF EXISTS "Members can create analyses" ON call_analyses;
CREATE POLICY "members_create_analyses"
    ON call_analyses FOR INSERT
    WITH CHECK (check_org_membership(organization_id, auth.uid()));

DROP POLICY IF EXISTS "Members can view usage logs" ON usage_logs;
CREATE POLICY "members_view_usage_logs"
    ON usage_logs FOR SELECT
    USING (check_org_membership(organization_id, auth.uid()));

DROP POLICY IF EXISTS "Users can view their organization's credit transactions" ON credits_transactions;
CREATE POLICY "users_view_credit_transactions"
    ON credits_transactions FOR SELECT
    USING (check_org_membership(organization_id, auth.uid()));

