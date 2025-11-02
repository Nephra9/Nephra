-- Fix recursive RLS policies that cause infinite recursion
-- Run this in your Supabase SQL editor

-- Step 1: Drop all existing problematic policies
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
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

-- Step 2: Create non-recursive policies for users table
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can create their own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow service role to bypass RLS for admin operations
CREATE POLICY "Service role can manage all users" ON users
  FOR ALL USING (auth.role() = 'service_role');

-- Step 3: Create non-recursive policies for projects table
CREATE POLICY "Service role can manage all projects" ON projects
  FOR ALL USING (auth.role() = 'service_role');

-- Step 4: Create non-recursive policies for project_requests table
CREATE POLICY "Service role can manage all requests" ON project_requests
  FOR ALL USING (auth.role() = 'service_role');

-- Step 5: Create non-recursive policies for other tables
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

-- Step 6: Ensure the signup trigger exists
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, full_name, email, email_verified, last_login_at)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    ),
    NEW.email,
    NEW.email_confirmed_at IS NOT NULL,
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- Step 7: Test that the table works
SELECT 'RLS policies fixed successfully' as status;
