-- Ensure daily_reset_date column exists (in case migration 002 wasn't run)
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS daily_reset_date DATE;

-- Set default for existing rows
UPDATE organizations 
SET daily_reset_date = CURRENT_DATE
WHERE subscription_tier = 'free' AND daily_reset_date IS NULL;

-- Update existing free tier organizations to have 10 calls limit (was 3 or 5)
UPDATE organizations
SET calls_limit = 10
WHERE subscription_tier = 'free' AND calls_limit < 10;

-- Also update storage limit to 100MB for free tier
UPDATE organizations
SET storage_limit_mb = 100
WHERE subscription_tier = 'free' AND storage_limit_mb < 100;

-- Reset calls_used if they've exceeded old limit but within new limit
-- This gives users a fresh start with new limits
UPDATE organizations
SET calls_used = 0,
    daily_reset_date = CURRENT_DATE
WHERE subscription_tier = 'free'
AND (daily_reset_date IS NULL OR daily_reset_date < CURRENT_DATE);

