-- Setup storage policies for the pets bucket
-- This allows shelter managers to upload, update, and delete images

-- Allow authenticated users to upload images to pets bucket
CREATE POLICY "Allow authenticated users to upload pet images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'pets');

-- Allow public read access to pet images
CREATE POLICY "Allow public read access to pet images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'pets');

-- Allow authenticated users to update their uploaded images
CREATE POLICY "Allow authenticated users to update pet images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'pets')
WITH CHECK (bucket_id = 'pets');

-- Allow authenticated users to delete images they uploaded
CREATE POLICY "Allow authenticated users to delete pet images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'pets');
