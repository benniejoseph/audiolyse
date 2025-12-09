-- Migration: Update free tier to 5 calls per day
-- Add daily reset tracking for free tier users

-- Add daily_reset_date column to organizations table
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS daily_reset_date DATE DEFAULT CURRENT_DATE;

-- Update existing free tier organizations to have daily reset date
UPDATE organizations 
SET daily_reset_date = CURRENT_DATE
WHERE subscription_tier = 'free' AND daily_reset_date IS NULL;

-- Update default calls_limit for free tier to 5
UPDATE organizations 
SET calls_limit = 5, calls_used = 0, daily_reset_date = CURRENT_DATE
WHERE subscription_tier = 'free' AND calls_limit = 3;

-- Function to reset daily usage for free tier users
CREATE OR REPLACE FUNCTION reset_daily_usage()
RETURNS VOID AS $$
BEGIN
  -- Reset calls_used for free tier users whose daily reset date has passed
  UPDATE organizations
  SET 
    calls_used = 0,
    daily_reset_date = CURRENT_DATE
  WHERE subscription_tier = 'free' 
    AND daily_reset_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- Function to check usage limit (updated to handle daily limits for free tier)
CREATE OR REPLACE FUNCTION check_usage_limit(org_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  org organizations%ROWTYPE;
BEGIN
  SELECT * INTO org FROM organizations WHERE id = org_id;
  
  -- For free tier, check if daily reset is needed
  IF org.subscription_tier = 'free' THEN
    -- Reset if daily reset date has passed
    IF org.daily_reset_date < CURRENT_DATE THEN
      UPDATE organizations
      SET calls_used = 0, daily_reset_date = CURRENT_DATE
      WHERE id = org_id;
      -- Refresh org data
      SELECT * INTO org FROM organizations WHERE id = org_id;
    END IF;
  END IF;
  
  IF org.calls_used >= org.calls_limit THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to increment usage (updated to handle daily reset for free tier)
CREATE OR REPLACE FUNCTION increment_usage(org_id UUID, file_size_mb DECIMAL)
RETURNS VOID AS $$
DECLARE
  org organizations%ROWTYPE;
BEGIN
  SELECT * INTO org FROM organizations WHERE id = org_id;
  
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

-- Update handle_new_user to set daily_reset_date for free tier
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_org_id UUID;
  user_name TEXT;
  org_slug TEXT;
BEGIN
  -- Extract name from metadata or email
  user_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1)
  );
  
  -- Create unique slug from email
  org_slug := lower(regexp_replace(split_part(NEW.email, '@', 1), '[^a-z0-9]', '-', 'g'));
  org_slug := org_slug || '-' || substr(gen_random_uuid()::text, 1, 8);
  
  -- Create profile
  INSERT INTO profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, user_name);
  
  -- Create default organization (personal workspace) with free tier daily limits
  INSERT INTO organizations (name, slug, owner_id, billing_email, calls_limit, daily_reset_date)
  VALUES (user_name || '''s Workspace', org_slug, NEW.id, NEW.email, 5, CURRENT_DATE)
  RETURNING id INTO new_org_id;
  
  -- Add user as owner of the organization
  INSERT INTO organization_members (organization_id, user_id, role)
  VALUES (new_org_id, NEW.id, 'owner');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

