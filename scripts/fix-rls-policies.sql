-- Fix RLS policies to prevent infinite recursion
-- Run this in your Supabase SQL editor

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can update all users" ON users;
DROP POLICY IF EXISTS "Admins can manage all projects" ON projects;
DROP POLICY IF EXISTS "Admins and reviewers can view all requests" ON project_requests;
DROP POLICY IF EXISTS "Admins and reviewers can update all requests" ON project_requests;
DROP POLICY IF EXISTS "Admins can view all audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Admins can view all uploads" ON file_uploads;
DROP POLICY IF EXISTS "Admins can manage all content" ON site_content;
DROP POLICY IF EXISTS "Admins can manage all events" ON events;
DROP POLICY IF EXISTS "Admins can manage project images" ON storage.objects;

-- Create new simplified policies
CREATE POLICY "Service role can manage all users" ON users
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage all projects" ON projects
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage all requests" ON project_requests
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can view all audit logs" ON audit_logs
  FOR SELECT USING (auth.role() = 'service_role');

CREATE POLICY "Service role can view all uploads" ON file_uploads
  FOR SELECT USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage all content" ON site_content
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage all events" ON events
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage project images" ON storage.objects
  FOR ALL USING (
    bucket_id = 'project-images' 
    AND auth.role() = 'service_role'
  );
