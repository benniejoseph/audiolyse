-- Security hardening and Audit Logging

-- 1. Create Audit Logs table for tracking data access (HIPAA requirement)
CREATE TABLE IF NOT EXISTS data_access_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  resource_type TEXT NOT NULL, -- 'call_analysis', 'audio_file', 'transcript'
  resource_id UUID, -- Can be null if generic access
  action TEXT NOT NULL, -- 'viewed', 'played', 'downloaded'
  metadata JSONB, -- For storing IP, User Agent, etc.
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on audit logs
ALTER TABLE data_access_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Members can view logs of their own organization (Audit Trail)
-- or maybe restrict to Admins only? For now, admins only seems safer for "audit" data.
CREATE POLICY "Admins can view audit logs"
  ON data_access_logs FOR SELECT
  USING (
    check_org_admin(organization_id, auth.uid())
  );

-- Policy: System/Users can insert logs (for tracking their own actions)
CREATE POLICY "Users can insert audit logs"
  ON data_access_logs FOR INSERT
  WITH CHECK (
    check_org_membership(organization_id, auth.uid())
  );

-- 2. Secure Storage Buckets (Audio Files)
-- We'll try to insert the bucket if it doesn't exist, and set strict policies.
-- Note: This requires the 'storage' schema extension which is standard in Supabase.

INSERT INTO storage.buckets (id, name, public)
VALUES ('audio-files', 'audio-files', false)
ON CONFLICT (id) DO NOTHING;

-- Policy: Give authenticated users access to read files in their org folder
-- Folder structure expected: {org_id}/{call_id}.mp3
DROP POLICY IF EXISTS "Members can read audio files" ON storage.objects;
CREATE POLICY "Members can read audio files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'audio-files'
    AND auth.role() = 'authenticated'
    AND (
      -- Check if the path starts with an org_id they belong to
      check_org_membership((storage.foldername(name))[1]::uuid, auth.uid())
    )
  );

-- Policy: Users can upload files to their org folder
DROP POLICY IF EXISTS "Members can upload audio files" ON storage.objects;
CREATE POLICY "Members can upload audio files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'audio-files'
    AND auth.role() = 'authenticated'
    AND (
      check_org_membership((storage.foldername(name))[1]::uuid, auth.uid())
    )
  );

-- Policy: Users can delete files (Admins only? Or uploader?)
DROP POLICY IF EXISTS "Admins can delete audio files" ON storage.objects;
CREATE POLICY "Admins can delete audio files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'audio-files'
    AND auth.role() = 'authenticated'
    AND (
      check_org_admin((storage.foldername(name))[1]::uuid, auth.uid())
    )
  );

-- 3. Index for performance
CREATE INDEX IF NOT EXISTS idx_data_access_logs_org ON data_access_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_data_access_logs_created ON data_access_logs(created_at DESC);
