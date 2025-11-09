-- scripts/project_images.sql
-- Policies to allow authenticated users to upload to the 'project-images' bucket
-- and to allow object owners to update/delete their own objects.
-- Run these statements in Supabase SQL editor (make sure you have admin privileges).

-- NOTE: Replace 'project-images' below if your actual bucket id differs.

-- Allow authenticated users to INSERT objects into the project-images bucket
-- NOTE: The INSERT/UPDATE/DELETE policies below restrict write access to admin users only.
-- The previous version used `FOR UPDATE, DELETE` which is invalid SQL (CREATE POLICY accepts a single
-- command token). We create separate policies for each action and restrict them to users whose
-- role in the `public.users` table is 'admin'. Adjust the role check if you use a different column/value.

CREATE POLICY "allow_admin_inserts_project_images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'project-images' AND
  EXISTS (
    SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'
  )
);

-- Allow the object owner to UPDATE or DELETE their own objects in the bucket
-- Allow admin users to UPDATE objects in the bucket
CREATE POLICY "allow_admin_update_project_images"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'project-images' AND
  EXISTS (
    SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'
  )
)
WITH CHECK (
  bucket_id = 'project-images' AND
  EXISTS (
    SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'
  )
);

-- Allow admin users to DELETE objects in the bucket
CREATE POLICY "allow_admin_delete_project_images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'project-images' AND
  EXISTS (
    SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'
  )
);

-- Allow authenticated users to SELECT metadata for objects in the bucket
CREATE POLICY "allow_select_project_images_for_authenticated"
ON storage.objects
FOR SELECT
USING (
  auth.role() = 'authenticated' AND bucket_id = 'project-images'
);

-- OPTIONAL: If you want public (anon) uploads (NOT RECOMMENDED), uncomment below
-- CREATE POLICY "allow_public_uploads_to_project_images"
-- ON storage.objects
-- FOR INSERT
-- USING (bucket_id = 'project-images')
-- WITH CHECK (bucket_id = 'project-images');

-- Helpful query: list policies on storage.objects
-- SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';

-- End of project_images.sql
