-- ============================================================
-- ClubSphere P0 Database Fixes
-- Run this script against Supabase SQL Editor
-- ============================================================

-- =====================
-- 1. FIX STORAGE BUCKETS
-- =====================

-- Create club-media bucket (for profile pics, event posters, gallery)
INSERT INTO storage.buckets (id, name, public)
VALUES ('club-media', 'club-media', true)
ON CONFLICT (id) DO NOTHING;

-- Create form-uploads bucket (for form file uploads and headers)
INSERT INTO storage.buckets (id, name, public)
VALUES ('form-uploads', 'form-uploads', true)
ON CONFLICT (id) DO NOTHING;

-- =====================
-- 2. STORAGE RLS POLICIES
-- =====================

-- club-media: Public read
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access"
  ON storage.objects FOR SELECT
  USING (bucket_id IN ('club-media', 'form-uploads'));

-- club-media: Authenticated upload
DROP POLICY IF EXISTS "Auth Upload" ON storage.objects;
CREATE POLICY "Auth Upload"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id IN ('club-media', 'form-uploads') AND auth.role() = 'authenticated');

-- club-media: Authenticated update (replace images)
DROP POLICY IF EXISTS "Auth Update" ON storage.objects;
CREATE POLICY "Auth Update"
  ON storage.objects FOR UPDATE
  USING (bucket_id IN ('club-media', 'form-uploads') AND auth.role() = 'authenticated');

-- club-media: Authenticated delete (remove own uploads)
DROP POLICY IF EXISTS "Auth Delete" ON storage.objects;
CREATE POLICY "Auth Delete"
  ON storage.objects FOR DELETE
  USING (bucket_id IN ('club-media', 'form-uploads') AND auth.role() = 'authenticated');

-- =====================
-- 3. FIX NOTIFICATIONS INSERT POLICY (CRITICAL)
-- =====================
-- Old policy: with check (true) — anyone can insert notifications for any user
DROP POLICY IF EXISTS "System/admins can create notifications" ON public.notifications;
CREATE POLICY "System/admins can create notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    OR public.is_super_admin()
    OR public.is_dean()
    OR EXISTS (
      SELECT 1 FROM public.clubs WHERE admin_id = auth.uid()
    )
  );

-- =====================
-- 4. FIX FEEDBACK RESPONSES INSERT POLICY (CRITICAL)
-- =====================
-- Old policy: with check (true) — anyone (even unauthenticated) can insert
DROP POLICY IF EXISTS "Anyone can submit response" ON public.feedback_responses;
CREATE POLICY "Authenticated users can submit response"
  ON public.feedback_responses FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');
