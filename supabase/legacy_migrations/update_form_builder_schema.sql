-- Add new columns to forms table
ALTER TABLE forms 
ADD COLUMN IF NOT EXISTS header_image_url TEXT,
ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'classic-blue',
ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{
  "limit_one_response_per_user": false,
  "response_limit": null,
  "accepting_responses": true,
  "thank_you_message": "Thank you for your submission!"
}'::jsonb;

-- Create storage bucket for form uploads if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('form-uploads', 'form-uploads', true)
ON CONFLICT (id) DO NOTHING;

-- Policy to allow public access to view form-uploads assets
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'form-uploads' );

-- Policy to allow authenticated users (like students filling forms) to upload files
DROP POLICY IF EXISTS "Authenticated Users Upload" ON storage.objects;
CREATE POLICY "Authenticated Users Upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'form-uploads' 
  AND auth.role() = 'authenticated'
);

-- Policy to allow users to update/delete their own uploads (optional, but good for cleanup)
DROP POLICY IF EXISTS "Users Manage Own Uploads" ON storage.objects;
CREATE POLICY "Users Manage Own Uploads"
ON storage.objects FOR ALL
USING (
  bucket_id = 'form-uploads' 
  AND auth.uid() = owner
);
