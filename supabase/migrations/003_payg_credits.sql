-- Migration: Add Pay-as-You-Go tier and Credit System
-- Run this in Supabase SQL Editor

-- Add 'payg' to subscription_tier enum
ALTER TYPE subscription_tier ADD VALUE IF NOT EXISTS 'payg';

-- Add credits column to organizations table
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS credits_balance INTEGER DEFAULT 0;

-- Create credits_transactions table for tracking credit purchases and usage
CREATE TABLE IF NOT EXISTS credits_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('purchase', 'usage', 'refund', 'expiry')),
  credits_amount INTEGER NOT NULL, -- Positive for purchase/refund, negative for usage/expiry
  amount_paid DECIMAL(10,2), -- Amount paid in currency (for purchases)
  currency currency_type DEFAULT 'INR',
  description TEXT,
  metadata JSONB, -- Additional transaction details
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_credits_transactions_org ON credits_transactions(organization_id);
CREATE INDEX IF NOT EXISTS idx_credits_transactions_user ON credits_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credits_transactions_created ON credits_transactions(created_at DESC);

-- Function to add credits (for purchases)
CREATE OR REPLACE FUNCTION add_credits(
  org_id UUID,
  user_id UUID,
  credits INTEGER,
  amount_paid DECIMAL,
  currency_type TEXT,
  description TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  transaction_id UUID;
BEGIN
  -- Insert transaction record
  INSERT INTO credits_transactions (
    organization_id,
    user_id,
    transaction_type,
    credits_amount,
    amount_paid,
    currency,
    description
  )
  VALUES (
    org_id,
    user_id,
    'purchase',
    credits,
    amount_paid,
    currency_type::currency_type,
    description
  )
  RETURNING id INTO transaction_id;
  
  -- Update organization credits balance
  UPDATE organizations
  SET credits_balance = credits_balance + credits
  WHERE id = org_id;
  
  RETURN transaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to use credits (for call analysis)
CREATE OR REPLACE FUNCTION use_credits(
  org_id UUID,
  user_id UUID,
  credits INTEGER,
  description TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  current_balance INTEGER;
BEGIN
  -- Get current balance
  SELECT credits_balance INTO current_balance
  FROM organizations
  WHERE id = org_id;
  
  -- Check if sufficient credits
  IF current_balance < credits THEN
    RETURN FALSE;
  END IF;
  
  -- Insert usage transaction
  INSERT INTO credits_transactions (
    organization_id,
    user_id,
    transaction_type,
    credits_amount,
    description
  )
  VALUES (
    org_id,
    user_id,
    'usage',
    -credits, -- Negative for usage
    description
  );
  
  -- Update balance
  UPDATE organizations
  SET credits_balance = credits_balance - credits
  WHERE id = org_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update check_usage_limit to handle payg tier
CREATE OR REPLACE FUNCTION check_usage_limit(org_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  org organizations%ROWTYPE;
BEGIN
  SELECT * INTO org FROM organizations WHERE id = org_id;
  
  -- For payg tier, check credits instead of calls_limit
  IF org.subscription_tier = 'payg' THEN
    -- Each call costs 1 credit
    IF org.credits_balance < 1 THEN
      RETURN FALSE;
    END IF;
    RETURN TRUE;
  END IF;
  
  -- For free tier, check if daily reset is needed
  IF org.subscription_tier = 'free' THEN
    IF org.daily_reset_date < CURRENT_DATE THEN
      UPDATE organizations
      SET calls_used = 0, daily_reset_date = CURRENT_DATE
      WHERE id = org_id;
      SELECT * INTO org FROM organizations WHERE id = org_id;
    END IF;
  END IF;
  
  IF org.calls_used >= org.calls_limit THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Update increment_usage to handle payg tier
CREATE OR REPLACE FUNCTION increment_usage(org_id UUID, file_size_mb DECIMAL, user_id UUID DEFAULT NULL)
RETURNS VOID AS $$
DECLARE
  org organizations%ROWTYPE;
BEGIN
  SELECT * INTO org FROM organizations WHERE id = org_id;
  
  -- For payg tier, use credits instead
  IF org.subscription_tier = 'payg' THEN
    -- Use 1 credit per call
    PERFORM use_credits(org_id, COALESCE(user_id, org.owner_id), 1, 'Call analysis');
    -- Update storage
    UPDATE organizations
    SET storage_used_mb = storage_used_mb + file_size_mb
    WHERE id = org_id;
    RETURN;
  END IF;
  
  -- For free tier, reset if daily reset date has passed
  IF org.subscription_tier = 'free' AND org.daily_reset_date < CURRENT_DATE THEN
    UPDATE organizations
    SET 
      calls_used = 1,
      storage_used_mb = storage_used_mb + file_size_mb,
      daily_reset_date = CURRENT_DATE
    WHERE id = org_id;
  ELSE
    UPDATE organizations
    SET 
      calls_used = calls_used + 1,
      storage_used_mb = storage_used_mb + file_size_mb
    WHERE id = org_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies for credits_transactions
ALTER TABLE credits_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their organization's credit transactions"
  ON credits_transactions FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert credit transactions"
  ON credits_transactions FOR INSERT
  WITH CHECK (true);

-- Update default calls_limit for free tier to 10 (doubled)
UPDATE organizations 
SET calls_limit = 10 
WHERE subscription_tier = 'free' AND calls_limit = 5;

-- Update default storage_limit_mb for free tier to 100 (doubled)
UPDATE organizations 
SET storage_limit_mb = 100 
WHERE subscription_tier = 'free' AND storage_limit_mb = 50;

