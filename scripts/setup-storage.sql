-- Setup Supabase Storage for Images
-- Run this in your Supabase SQL Editor

-- Create the uploads bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('uploads', 'uploads', true)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for the uploads bucket
-- Allow public read access
CREATE POLICY "Public Access" ON storage.objects
  FOR SELECT USING (bucket_id = 'uploads');

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'uploads' 
    AND auth.role() = 'authenticated'
  );

-- Allow users to delete their own uploads (via admin)
CREATE POLICY "Admin can manage uploads" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'uploads' 
    AND auth.uid() IN (
      SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'
    )
  );
