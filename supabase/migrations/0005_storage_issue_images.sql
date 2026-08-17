-- 0005_storage_issue_images.sql
-- Ensure storage bucket and RLS policies for image uploads work via /api/upload

BEGIN;

-- Create the bucket if it doesn't exist yet
INSERT INTO storage.buckets (id, name, public)
VALUES ('issue-images', 'issue-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read for this bucket (since bucket is public, reads are allowed)
-- Optional: If you want private bucket instead, set public=false above and change SELECT policy to 'anon/authenticated' explicitly.

-- Clean existing policies for this bucket to avoid duplicates
DROP POLICY IF EXISTS issue_images_select_public ON storage.objects;
DROP POLICY IF EXISTS issue_images_insert_own_folder ON storage.objects;
DROP POLICY IF EXISTS issue_images_update_own_folder ON storage.objects;
DROP POLICY IF EXISTS issue_images_delete_own_folder ON storage.objects;

-- Allow anyone to read objects from the public bucket 'issue-images'
CREATE POLICY issue_images_select_public
ON storage.objects
FOR SELECT
USING (bucket_id = 'issue-images');

-- Allow authenticated users to upload only into a folder named after their user id (e.g., <uid>/filename)
CREATE POLICY issue_images_insert_own_folder
ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'issue-images'
  AND name LIKE (auth.uid()::text || '/%')
);

-- Allow authenticated users to update objects only in their own folder
CREATE POLICY issue_images_update_own_folder
ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'issue-images'
  AND name LIKE (auth.uid()::text || '/%')
)
WITH CHECK (
  bucket_id = 'issue-images'
  AND name LIKE (auth.uid()::text || '/%')
);

-- Allow authenticated users to delete objects only in their own folder
CREATE POLICY issue_images_delete_own_folder
ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'issue-images'
  AND name LIKE (auth.uid()::text || '/%')
);

-- Reload PostgREST/Storage schema
NOTIFY pgrst, 'reload schema';

COMMIT;
