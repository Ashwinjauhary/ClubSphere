-- 1. Create 'avatars' bucket (Public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Create 'events' bucket (Public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('events', 'events', true)
ON CONFLICT (id) DO NOTHING;


-- 3. Set up RLS Policies for 'avatars'

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Uploads" ON storage.objects;
DROP POLICY IF EXISTS "User Update Own" ON storage.objects;

-- Allow Public Read Access
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'avatars' );

-- Allow Authenticated Uploads
CREATE POLICY "Authenticated Uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'avatars' );

-- Allow Users to Update their own files
CREATE POLICY "User Update Own"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'avatars' AND auth.uid() = owner );


-- 4. Set up RLS Policies for 'events'

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Public Event Image Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Event Image Uploads" ON storage.objects;

-- Allow Public Read Access
CREATE POLICY "Public Event Image Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'events' );

-- Allow Authenticated Uploads
CREATE POLICY "Authenticated Event Image Uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'events' );
