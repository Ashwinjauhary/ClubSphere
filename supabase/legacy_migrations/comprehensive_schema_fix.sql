-- ================================================================
-- COMPREHENSIVE SCHEMA FIX
-- Run this script to fix ALL '400 Bad Request' errors.
-- It is safe to run multiple times (idempotent).
-- ================================================================

-- 1. Ensure 'proposal_data' column exists (for AI Proposals)
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS proposal_data jsonb DEFAULT '{}'::jsonb;

-- 2. Ensure 'event_status' enum has 'draft'
DO $$
BEGIN
    ALTER TYPE public.event_status ADD VALUE 'draft';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Fix 'event_type' constraint to allow 'Fun'
ALTER TABLE public.events DROP CONSTRAINT IF EXISTS events_event_type_check;
ALTER TABLE public.events ADD CONSTRAINT events_event_type_check 
  CHECK (event_type IN ('Technical', 'Cultural', 'Academic', 'Sports', 'Other', 'Fun'));

-- 4. Ensure other potentially missing columns from recent updates exist
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS target_audience text;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS expected_attendees integer;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS budget numeric DEFAULT 0;

-- 5. Fix RLS for Events (Ensure Club Admins can insert)
DROP POLICY IF EXISTS "Club Admins can create events" ON public.events;
CREATE POLICY "Club Admins can create events"
  ON public.events FOR INSERT WITH CHECK (
    public.is_club_admin(club_id) OR public.is_dean() OR public.is_super_admin()
  );

DROP POLICY IF EXISTS "Admins can update their own events" ON public.events;
CREATE POLICY "Admins can update their own events"
  ON public.events FOR UPDATE USING (
    (public.is_club_admin(club_id))
    OR public.is_dean()
    OR public.is_super_admin()
  );

-- 6. Ensure 'forms' unified table exists (from previous fix)
CREATE TABLE IF NOT EXISTS public.forms (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  club_id uuid REFERENCES public.clubs(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  type text NOT NULL CHECK (type IN ('feedback', 'registration', 'poll')),
  questions jsonb NOT NULL,
  is_published boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on forms if not already
ALTER TABLE public.forms ENABLE ROW LEVEL SECURITY;

-- 7. Grant permissions (just in case)
GRANT ALL ON TABLE public.events TO postgres;
GRANT ALL ON TABLE public.events TO authenticated;
GRANT ALL ON TABLE public.events TO service_role;
