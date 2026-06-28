-- Unified Schema Fix
-- 1. Create Unified 'forms' table
CREATE TABLE IF NOT EXISTS public.forms (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT DEFAULT 'general', -- 'feedback', 'registration', 'survey'
    is_published BOOLEAN DEFAULT false,
    questions JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Unified 'form_responses' table
CREATE TABLE IF NOT EXISTS public.form_responses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    form_id UUID REFERENCES public.forms(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- Nullable for anonymous
    respondent_email TEXT, -- Capture email if anonymous but provided
    answers JSONB DEFAULT '{}'::jsonb,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. QR Code Attendance System (Fixing 400 Errors)
CREATE TABLE IF NOT EXISTS public.event_registrations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    registration_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    status TEXT DEFAULT 'registered' CHECK (status IN ('registered', 'attended', 'cancelled')),
    ticket_code TEXT DEFAULT upper(substring(md5(random()::text), 1, 8)),
    qr_code_hash TEXT,
    UNIQUE(event_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.event_attendance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    registration_id UUID REFERENCES public.event_registrations(id) ON DELETE CASCADE NOT NULL,
    scanned_by UUID REFERENCES public.profiles(id),
    scanned_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Enable RLS
ALTER TABLE public.forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_attendance ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies (Simplified for Stability)

-- Forms
DROP POLICY IF EXISTS "Public view published forms" ON public.forms;
CREATE POLICY "Public view published forms" ON public.forms FOR SELECT USING (is_published = true OR auth.uid() = created_by OR public.is_super_admin());

DROP POLICY IF EXISTS "Admins manage forms" ON public.forms;
CREATE POLICY "Admins manage forms" ON public.forms FOR ALL USING (public.is_dean() OR public.is_super_admin() OR auth.uid() = created_by);

-- Form Responses
DROP POLICY IF EXISTS "Anyone can submit responses" ON public.form_responses;
CREATE POLICY "Anyone can submit responses" ON public.form_responses FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins view responses" ON public.form_responses;
CREATE POLICY "Admins view responses" ON public.form_responses FOR SELECT USING (
    public.is_super_admin() OR 
    EXISTS (SELECT 1 FROM public.forms WHERE forms.id = form_responses.form_id AND (forms.created_by = auth.uid() OR public.is_dean()))
);

-- Event Registrations
DROP POLICY IF EXISTS "View own registrations" ON public.event_registrations;
CREATE POLICY "View own registrations" ON public.event_registrations FOR SELECT USING (auth.uid() = user_id OR public.is_super_admin());

DROP POLICY IF EXISTS "Register self" ON public.event_registrations;
CREATE POLICY "Register self" ON public.event_registrations FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Attendance (Admins only)
DROP POLICY IF EXISTS "Admins manage attendance" ON public.event_attendance;
CREATE POLICY "Admins manage attendance" ON public.event_attendance FOR ALL USING (public.is_dean() OR public.is_super_admin() OR EXISTS (SELECT 1 FROM public.events e JOIN public.event_registrations er ON e.id = er.event_id WHERE er.id = event_attendance.registration_id AND e.created_by = auth.uid()));

-- 6. Realtime
begin;
  drop publication if exists supabase_realtime;
  create publication supabase_realtime;
commit;
alter publication supabase_realtime add table public.forms;
alter publication supabase_realtime add table public.form_responses;
alter publication supabase_realtime add table public.event_registrations;
alter publication supabase_realtime add table public.event_attendance;
