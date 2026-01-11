-- =====================================================
-- Migration: Customer Memory System
-- Description: Adds customer profiles, relationship tracking,
--              and links customers to call analyses
-- =====================================================

-- 1. Create customer_profiles table
CREATE TABLE IF NOT EXISTS customer_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Basic Info
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    company VARCHAR(255),
    
    -- Identification
    external_id VARCHAR(100), -- Customer ID from external system
    
    -- Communication Preferences
    preferred_language VARCHAR(10) DEFAULT 'en',
    preferred_contact_method VARCHAR(20) DEFAULT 'phone', -- phone, email, sms
    timezone VARCHAR(50),
    
    -- Profile Insights (AI-derived)
    communication_style VARCHAR(20), -- detailed, brief, emotional, analytical
    decision_style VARCHAR(30), -- quick, deliberate, needs_reassurance, price_focused
    price_sensitivity VARCHAR(10) DEFAULT 'medium', -- low, medium, high
    
    -- Relationship Status
    status VARCHAR(20) DEFAULT 'active', -- active, inactive, churned, prospect
    lifecycle_stage VARCHAR(30) DEFAULT 'prospect', -- prospect, lead, customer, advocate, churned
    account_type VARCHAR(30), -- individual, business, enterprise
    
    -- Value Tracking
    total_calls INTEGER DEFAULT 0,
    avg_sentiment_score DECIMAL(5,2),
    avg_call_score DECIMAL(5,2),
    last_interaction_date TIMESTAMPTZ,
    first_interaction_date TIMESTAMPTZ,
    
    -- Notes and Tags
    notes TEXT,
    tags TEXT[],
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id),
    
    -- Unique constraint for external_id within org
    UNIQUE(organization_id, external_id),
    UNIQUE(organization_id, phone),
    UNIQUE(organization_id, email)
);

-- 2. Create customer_interactions table to track relationship history
CREATE TABLE IF NOT EXISTS customer_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customer_profiles(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Interaction Details
    interaction_type VARCHAR(30) NOT NULL, -- call, email, meeting, support_ticket
    call_analysis_id UUID REFERENCES call_analyses(id) ON DELETE SET NULL,
    
    -- Outcome
    sentiment VARCHAR(20), -- positive, neutral, negative
    sentiment_score INTEGER,
    resolution_status VARCHAR(20), -- resolved, pending, escalated
    
    -- Summary
    summary TEXT,
    key_topics TEXT[],
    action_items TEXT[],
    
    -- Agent Info
    agent_id UUID REFERENCES profiles(id),
    
    -- Timestamps
    interaction_date TIMESTAMPTZ DEFAULT NOW(),
    duration_seconds INTEGER,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create customer_concerns table to track ongoing issues/preferences
CREATE TABLE IF NOT EXISTS customer_concerns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customer_profiles(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Concern Details
    concern_type VARCHAR(30) NOT NULL, -- complaint, question, preference, feedback
    description TEXT NOT NULL,
    
    -- Status
    status VARCHAR(20) DEFAULT 'open', -- open, addressed, resolved, recurring
    priority VARCHAR(10) DEFAULT 'medium', -- low, medium, high, urgent
    
    -- Resolution
    resolution TEXT,
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES profiles(id),
    
    -- Source
    source_interaction_id UUID REFERENCES customer_interactions(id),
    
    -- Metadata
    first_mentioned TIMESTAMPTZ DEFAULT NOW(),
    last_mentioned TIMESTAMPTZ DEFAULT NOW(),
    mention_count INTEGER DEFAULT 1,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Add customer_id to call_analyses table
ALTER TABLE call_analyses 
ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customer_profiles(id) ON DELETE SET NULL;

-- 5. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_customer_profiles_org ON customer_profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_customer_profiles_phone ON customer_profiles(phone);
CREATE INDEX IF NOT EXISTS idx_customer_profiles_email ON customer_profiles(email);
CREATE INDEX IF NOT EXISTS idx_customer_profiles_external_id ON customer_profiles(external_id);
CREATE INDEX IF NOT EXISTS idx_customer_profiles_status ON customer_profiles(status);
CREATE INDEX IF NOT EXISTS idx_customer_interactions_customer ON customer_interactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_interactions_call ON customer_interactions(call_analysis_id);
CREATE INDEX IF NOT EXISTS idx_customer_concerns_customer ON customer_concerns(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_concerns_status ON customer_concerns(status);
CREATE INDEX IF NOT EXISTS idx_call_analyses_customer ON call_analyses(customer_id);

-- 6. Enable RLS on all new tables
ALTER TABLE customer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_concerns ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies for customer_profiles
CREATE POLICY "Users can view customers in their org" ON customer_profiles
    FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM organization_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert customers in their org" ON customer_profiles
    FOR INSERT
    WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM organization_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update customers in their org" ON customer_profiles
    FOR UPDATE
    USING (
        organization_id IN (
            SELECT organization_id FROM organization_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can delete customers in their org" ON customer_profiles
    FOR DELETE
    USING (
        organization_id IN (
            SELECT organization_id FROM organization_members 
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

-- 8. RLS Policies for customer_interactions
CREATE POLICY "Users can view interactions in their org" ON customer_interactions
    FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM organization_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert interactions in their org" ON customer_interactions
    FOR INSERT
    WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM organization_members 
            WHERE user_id = auth.uid()
        )
    );

-- 9. RLS Policies for customer_concerns
CREATE POLICY "Users can view concerns in their org" ON customer_concerns
    FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM organization_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage concerns in their org" ON customer_concerns
    FOR ALL
    USING (
        organization_id IN (
            SELECT organization_id FROM organization_members 
            WHERE user_id = auth.uid()
        )
    );

-- 10. Function to update customer stats on new interaction
CREATE OR REPLACE FUNCTION update_customer_stats()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE customer_profiles SET
        total_calls = (
            SELECT COUNT(*) FROM customer_interactions 
            WHERE customer_id = NEW.customer_id AND interaction_type = 'call'
        ),
        avg_sentiment_score = (
            SELECT AVG(sentiment_score) FROM customer_interactions 
            WHERE customer_id = NEW.customer_id AND sentiment_score IS NOT NULL
        ),
        last_interaction_date = NEW.interaction_date,
        first_interaction_date = COALESCE(
            (SELECT MIN(interaction_date) FROM customer_interactions WHERE customer_id = NEW.customer_id),
            NEW.interaction_date
        ),
        updated_at = NOW()
    WHERE id = NEW.customer_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Trigger to auto-update customer stats
DROP TRIGGER IF EXISTS trigger_update_customer_stats ON customer_interactions;
CREATE TRIGGER trigger_update_customer_stats
    AFTER INSERT ON customer_interactions
    FOR EACH ROW
    EXECUTE FUNCTION update_customer_stats();

-- 12. Function to find or create customer by phone/email
CREATE OR REPLACE FUNCTION find_or_create_customer(
    p_organization_id UUID,
    p_name VARCHAR(255),
    p_phone VARCHAR(50) DEFAULT NULL,
    p_email VARCHAR(255) DEFAULT NULL,
    p_created_by UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_customer_id UUID;
BEGIN
    -- Try to find existing customer by phone
    IF p_phone IS NOT NULL THEN
        SELECT id INTO v_customer_id 
        FROM customer_profiles 
        WHERE organization_id = p_organization_id AND phone = p_phone
        LIMIT 1;
        
        IF v_customer_id IS NOT NULL THEN
            RETURN v_customer_id;
        END IF;
    END IF;
    
    -- Try to find by email
    IF p_email IS NOT NULL THEN
        SELECT id INTO v_customer_id 
        FROM customer_profiles 
        WHERE organization_id = p_organization_id AND email = p_email
        LIMIT 1;
        
        IF v_customer_id IS NOT NULL THEN
            RETURN v_customer_id;
        END IF;
    END IF;
    
    -- Try to find by name (less reliable)
    SELECT id INTO v_customer_id 
    FROM customer_profiles 
    WHERE organization_id = p_organization_id AND LOWER(name) = LOWER(p_name)
    LIMIT 1;
    
    IF v_customer_id IS NOT NULL THEN
        RETURN v_customer_id;
    END IF;
    
    -- Create new customer
    INSERT INTO customer_profiles (organization_id, name, phone, email, created_by)
    VALUES (p_organization_id, p_name, p_phone, p_email, p_created_by)
    RETURNING id INTO v_customer_id;
    
    RETURN v_customer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 13. Function to get customer sentiment trend
CREATE OR REPLACE FUNCTION get_customer_sentiment_trend(
    p_customer_id UUID,
    p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
    interaction_date DATE,
    avg_sentiment DECIMAL(5,2),
    call_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        DATE(ci.interaction_date) as interaction_date,
        AVG(ci.sentiment_score)::DECIMAL(5,2) as avg_sentiment,
        COUNT(*) as call_count
    FROM customer_interactions ci
    WHERE ci.customer_id = p_customer_id
      AND ci.interaction_date >= NOW() - (p_days || ' days')::INTERVAL
    GROUP BY DATE(ci.interaction_date)
    ORDER BY DATE(ci.interaction_date);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 14. Grant execute permissions
GRANT EXECUTE ON FUNCTION find_or_create_customer TO authenticated;
GRANT EXECUTE ON FUNCTION get_customer_sentiment_trend TO authenticated;
