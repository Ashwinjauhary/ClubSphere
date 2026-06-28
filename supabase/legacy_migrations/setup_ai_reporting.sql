-- ==========================================
-- AI Event Report System - Schema Upgrade
-- ==========================================

-- 1. Modify EVENTS table
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS event_type text CHECK (event_type IN ('Technical', 'Cultural', 'Academic', 'Sports', 'Other')),
ADD COLUMN IF NOT EXISTS target_audience text,
ADD COLUMN IF NOT EXISTS po_mapping jsonb DEFAULT '{}'::jsonb; -- Stores { "PO1": true, "PO2": false ... }

-- 2. New PARTICIPANTS table
CREATE TABLE IF NOT EXISTS public.participants (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_id uuid REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL, -- specific user if registered
  full_name text NOT NULL,
  roll_number text,
  department text,
  section text,
  team_code text, -- Auto-generated for team events
  role text DEFAULT 'Participant' CHECK (role IN ('Participant', 'Volunteer', 'Coordinator', 'Winner')),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. New MEDIA_ASSETS table (Geotagged)
CREATE TABLE IF NOT EXISTS public.media_assets (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_id uuid REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  uploaded_by uuid REFERENCES public.profiles(id),
  url text NOT NULL,
  caption text,
  latitude numeric,
  longitude numeric,
  captured_at timestamp with time zone,
  is_geotagged boolean GENERATED ALWAYS AS (latitude IS NOT NULL AND longitude IS NOT NULL) STORED,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. New FEEDBACK_FORMS table
CREATE TABLE IF NOT EXISTS public.feedback_forms (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_id uuid REFERENCES public.events(id) ON DELETE CASCADE NOT NULL UNIQUE,
  title text,
  description text,
  questions jsonb NOT NULL, -- Array of question objects
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure columns exist if table already existed
ALTER TABLE public.feedback_forms ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
ALTER TABLE public.feedback_forms ADD COLUMN IF NOT EXISTS questions jsonb; -- In case it existed without questions (unlikely but safe)

-- 5. New FEEDBACK_RESPONSES table
CREATE TABLE IF NOT EXISTS public.feedback_responses (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  form_id uuid REFERENCES public.feedback_forms(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(id), -- Optional for anonymous
  responses jsonb NOT NULL, -- Key-value pairs of QuestionID: Answer
  sentiment_score numeric, -- AI Calculated
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure columns exist
ALTER TABLE public.feedback_responses ADD COLUMN IF NOT EXISTS sentiment_score numeric;

-- 6. Modify REPORTS table for Workflow
ALTER TABLE public.reports 
ADD COLUMN IF NOT EXISTS approval_status text DEFAULT 'draft' CHECK (approval_status IN ('draft', 'pending_approval', 'approved', 'rejected')),
ADD COLUMN IF NOT EXISTS rejection_comments text,
ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS approved_at timestamp with time zone;

-- 7. RLS Policies

-- Participants
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public view participants" ON public.participants FOR SELECT USING (true);
CREATE POLICY "Admins manage participants" ON public.participants FOR ALL USING (
  public.is_club_admin((SELECT club_id FROM public.events WHERE id = event_id)) OR public.is_super_admin()
);

-- Media Assets
ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public view media" ON public.media_assets FOR SELECT USING (true);
CREATE POLICY "Authenticated upload media" ON public.media_assets FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Admins manage media" ON public.media_assets FOR ALL USING (
  public.is_club_admin((SELECT club_id FROM public.events WHERE id = event_id)) OR public.is_super_admin()
);

-- Feedback
ALTER TABLE public.feedback_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active forms" ON public.feedback_forms FOR SELECT USING (is_active = true);
CREATE POLICY "Admins manage forms" ON public.feedback_forms FOR ALL USING (public.is_super_admin() OR public.is_dean() OR EXISTS (SELECT 1 FROM public.events WHERE id = event_id AND public.is_club_admin(club_id)));

CREATE POLICY "Anyone can submit response" ON public.feedback_responses FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins view responses" ON public.feedback_responses FOR SELECT USING (public.is_super_admin() OR public.is_dean() OR EXISTS (SELECT 1 FROM public.feedback_forms f JOIN public.events e ON f.event_id = e.id WHERE f.id = form_id AND public.is_club_admin(e.club_id)));
