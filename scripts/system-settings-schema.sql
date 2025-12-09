-- System Settings Schema for Supabase
-- This table stores all platform configuration settings
-- Run this SQL in your Supabase SQL Editor

-- Drop existing table if you want to recreate it
-- DROP TABLE IF EXISTS public.system_settings CASCADE;

-- Create system_settings table
CREATE TABLE IF NOT EXISTS public.system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- General Settings
  site_title TEXT DEFAULT 'Nephra',
  site_description TEXT DEFAULT 'Project Management Platform',
  site_url TEXT,
  admin_email TEXT,
  contact_email TEXT,
  support_email TEXT,
  
  -- Registration & Access
  registration_open BOOLEAN DEFAULT true,
  require_email_verification BOOLEAN DEFAULT true,
  allow_social_login BOOLEAN DEFAULT false,
  auto_approve_users BOOLEAN DEFAULT false,
  
  -- Projects
  require_project_approval BOOLEAN DEFAULT true,
  max_projects_per_user INTEGER DEFAULT 10,
  allow_project_comments BOOLEAN DEFAULT true,
  allow_project_ratings BOOLEAN DEFAULT false,
  project_auto_publish BOOLEAN DEFAULT false,
  
  -- Applications
  max_applications_per_user INTEGER DEFAULT 5,
  application_review_period_days INTEGER DEFAULT 30,
  auto_reject_incomplete BOOLEAN DEFAULT false,
  require_application_documents BOOLEAN DEFAULT true,
  
  -- Email Notifications
  email_notifications_enabled BOOLEAN DEFAULT true,
  notify_new_user BOOLEAN DEFAULT true,
  notify_new_project BOOLEAN DEFAULT true,
  notify_new_application BOOLEAN DEFAULT true,
  notify_status_change BOOLEAN DEFAULT true,
  email_digest_frequency TEXT DEFAULT 'daily' CHECK (email_digest_frequency IN ('realtime', 'hourly', 'daily', 'weekly', 'never')),
  
  -- Security
  session_timeout_minutes INTEGER DEFAULT 480,
  max_login_attempts INTEGER DEFAULT 5,
  password_min_length INTEGER DEFAULT 8,
  require_strong_password BOOLEAN DEFAULT true,
  enable_2fa BOOLEAN DEFAULT false,
  ip_whitelist_enabled BOOLEAN DEFAULT false,
  
  -- Appearance
  theme_mode TEXT DEFAULT 'system' CHECK (theme_mode IN ('light', 'dark', 'system')),
  primary_color TEXT DEFAULT '#3B82F6',
  enable_dark_mode BOOLEAN DEFAULT true,
  custom_logo_url TEXT,
  custom_favicon_url TEXT,
  
  -- Maintenance
  maintenance_mode BOOLEAN DEFAULT false,
  maintenance_message TEXT DEFAULT 'We are currently performing maintenance. Please check back soon.',
  debug BOOLEAN DEFAULT false,
  error_reporting BOOLEAN DEFAULT true,
  
  -- Analytics
  analytics_enabled BOOLEAN DEFAULT true,
  track_page_views BOOLEAN DEFAULT true,
  track_user_events BOOLEAN DEFAULT true,
  data_retention_days INTEGER DEFAULT 90,
  
  -- Storage
  max_file_size_mb INTEGER DEFAULT 10,
  allowed_file_types TEXT DEFAULT 'pdf,doc,docx,jpg,png,jpeg',
  storage_limit_gb INTEGER DEFAULT 100,
  
  -- API & Integrations
  api_rate_limit INTEGER DEFAULT 100,
  webhook_url TEXT,
  enable_webhooks BOOLEAN DEFAULT false,
  
  -- Content Moderation
  enable_profanity_filter BOOLEAN DEFAULT true,
  auto_moderate_content BOOLEAN DEFAULT false,
  require_admin_review BOOLEAN DEFAULT true,
  
  -- Performance
  cache_enabled BOOLEAN DEFAULT true,
  cache_duration_minutes INTEGER DEFAULT 60,
  lazy_load_images BOOLEAN DEFAULT true,
  compress_responses BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create unique constraint to ensure only one settings row exists
-- This makes the table a singleton (only one row allowed)
CREATE UNIQUE INDEX IF NOT EXISTS system_settings_singleton_idx ON public.system_settings ((1));

-- Insert default settings row if not exists
INSERT INTO public.system_settings (id)
VALUES (gen_random_uuid())
ON CONFLICT DO NOTHING;

-- Enable Row Level Security
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Create policies

-- Policy: Allow all authenticated users to read settings
CREATE POLICY "Allow authenticated users to read settings"
  ON public.system_settings
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Only admins can update settings
-- Note: You'll need to check user role from the users table
CREATE POLICY "Allow admins to update settings"
  ON public.system_settings
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Policy: Only admins can insert settings
CREATE POLICY "Allow admins to insert settings"
  ON public.system_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Policy: Prevent deletion of settings
-- Settings should never be deleted, only updated
CREATE POLICY "Prevent settings deletion"
  ON public.system_settings
  FOR DELETE
  TO authenticated
  USING (false);

-- Create function to update the updated_at timestamp automatically
CREATE OR REPLACE FUNCTION public.update_system_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
DROP TRIGGER IF EXISTS system_settings_updated_at_trigger ON public.system_settings;
CREATE TRIGGER system_settings_updated_at_trigger
  BEFORE UPDATE ON public.system_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_system_settings_updated_at();

-- Grant permissions
GRANT SELECT ON public.system_settings TO authenticated;
GRANT UPDATE ON public.system_settings TO authenticated;
GRANT INSERT ON public.system_settings TO authenticated;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS system_settings_updated_at_idx ON public.system_settings(updated_at);

-- Add helpful comments
COMMENT ON TABLE public.system_settings IS 'Singleton table storing all platform configuration settings';
COMMENT ON COLUMN public.system_settings.id IS 'Unique identifier for the settings row';
COMMENT ON COLUMN public.system_settings.maintenance_mode IS 'When true, platform shows maintenance page to non-admin users';
COMMENT ON COLUMN public.system_settings.debug IS 'Enable verbose logging and debug information';
COMMENT ON COLUMN public.system_settings.email_digest_frequency IS 'How often to send email digests: realtime, hourly, daily, weekly, never';
COMMENT ON COLUMN public.system_settings.theme_mode IS 'Default theme: light, dark, or system';
COMMENT ON COLUMN public.system_settings.api_rate_limit IS 'Maximum API requests per minute per user';

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'System settings table created successfully!';
  RAISE NOTICE 'Default settings row has been inserted.';
  RAISE NOTICE 'RLS policies have been applied - only admins can modify settings.';
END $$;
