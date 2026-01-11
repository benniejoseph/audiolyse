-- Migration: Add Payment Idempotency and Security Features
-- Prevents double-charging and adds audit trail for payments

-- Create payment_idempotency table to track processed payments
CREATE TABLE IF NOT EXISTS payment_idempotency (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  idempotency_key VARCHAR(255) UNIQUE NOT NULL,
  razorpay_order_id VARCHAR(255),
  razorpay_payment_id VARCHAR(255),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  credits INTEGER,
  amount DECIMAL(10,2),
  currency VARCHAR(3),
  status VARCHAR(50) DEFAULT 'pending', -- pending, completed, failed
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB
);

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_payment_idempotency_key ON payment_idempotency(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_payment_idempotency_order ON payment_idempotency(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_payment_idempotency_payment ON payment_idempotency(razorpay_payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_idempotency_org ON payment_idempotency(organization_id);

-- RLS Policies
ALTER TABLE payment_idempotency ENABLE ROW LEVEL SECURITY;

-- Users can view their own payment records
CREATE POLICY "Users can view own payment idempotency records"
  ON payment_idempotency FOR SELECT
  USING (user_id = auth.uid());

-- Only service role can insert (server-side only)
CREATE POLICY "Service role can insert payment records"
  ON payment_idempotency FOR INSERT
  WITH CHECK (true);

-- Only service role can update (server-side only)
CREATE POLICY "Service role can update payment records"
  ON payment_idempotency FOR UPDATE
  USING (true);

-- Function to check if payment was already processed
CREATE OR REPLACE FUNCTION check_payment_idempotency(
  p_idempotency_key VARCHAR,
  p_razorpay_order_id VARCHAR DEFAULT NULL,
  p_razorpay_payment_id VARCHAR DEFAULT NULL
)
RETURNS TABLE (
  already_processed BOOLEAN,
  existing_status VARCHAR,
  transaction_id UUID
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    CASE WHEN pi.status = 'completed' THEN true ELSE false END as already_processed,
    pi.status as existing_status,
    pi.id as transaction_id
  FROM payment_idempotency pi
  WHERE pi.idempotency_key = p_idempotency_key
     OR (p_razorpay_order_id IS NOT NULL AND pi.razorpay_order_id = p_razorpay_order_id)
     OR (p_razorpay_payment_id IS NOT NULL AND pi.razorpay_payment_id = p_razorpay_payment_id)
  ORDER BY pi.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record payment attempt
CREATE OR REPLACE FUNCTION record_payment_attempt(
  p_idempotency_key VARCHAR,
  p_razorpay_order_id VARCHAR,
  p_org_id UUID,
  p_user_id UUID,
  p_credits INTEGER,
  p_amount DECIMAL,
  p_currency VARCHAR
)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO payment_idempotency (
    idempotency_key,
    razorpay_order_id,
    organization_id,
    user_id,
    credits,
    amount,
    currency,
    status
  )
  VALUES (
    p_idempotency_key,
    p_razorpay_order_id,
    p_org_id,
    p_user_id,
    p_credits,
    p_amount,
    p_currency,
    'pending'
  )
  RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to complete payment (atomic operation)
CREATE OR REPLACE FUNCTION complete_payment(
  p_idempotency_key VARCHAR,
  p_razorpay_payment_id VARCHAR
)
RETURNS BOOLEAN AS $$
DECLARE
  v_record payment_idempotency%ROWTYPE;
BEGIN
  -- Get and lock the record
  SELECT * INTO v_record
  FROM payment_idempotency
  WHERE idempotency_key = p_idempotency_key
  FOR UPDATE;
  
  -- Check if already completed
  IF v_record.status = 'completed' THEN
    RETURN false; -- Already processed
  END IF;
  
  -- Mark as completed
  UPDATE payment_idempotency
  SET 
    status = 'completed',
    razorpay_payment_id = p_razorpay_payment_id,
    processed_at = NOW()
  WHERE idempotency_key = p_idempotency_key;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add rate limiting tracking table
CREATE TABLE IF NOT EXISTS rate_limit_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  identifier VARCHAR(255) NOT NULL,
  endpoint VARCHAR(100) NOT NULL,
  request_count INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(identifier, endpoint, window_start)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_rate_limit_identifier ON rate_limit_tracking(identifier, endpoint);
CREATE INDEX IF NOT EXISTS idx_rate_limit_window ON rate_limit_tracking(window_start);

-- Cleanup old rate limit records (run periodically)
CREATE OR REPLACE FUNCTION cleanup_old_rate_limits()
RETURNS void AS $$
BEGIN
  DELETE FROM rate_limit_tracking
  WHERE window_start < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql;
