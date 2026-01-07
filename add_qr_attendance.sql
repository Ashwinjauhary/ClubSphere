-- QR Code Attendance System

-- 1. Event Registrations Table
CREATE TABLE IF NOT EXISTS public.event_registrations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    registration_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    status TEXT DEFAULT 'registered' CHECK (status IN ('registered', 'attended', 'cancelled')),
    ticket_code TEXT DEFAULT upper(substring(md5(random()::text), 1, 8)) UNIQUE NOT NULL, -- Short unique code for display
    qr_code_hash TEXT UNIQUE NOT NULL, -- Full hash for QR code
    UNIQUE(event_id, user_id)
);

-- 2. Event Attendance Log (Audit Trail)
CREATE TABLE IF NOT EXISTS public.event_attendance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    registration_id UUID REFERENCES public.event_registrations(id) ON DELETE CASCADE NOT NULL,
    scanned_by UUID REFERENCES public.profiles(id),
    scanned_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Enable RLS
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_attendance ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies

-- REGISTRATIONS

-- Users can view their own registrations
CREATE POLICY "Users can view own registrations"
    ON public.event_registrations FOR SELECT
    USING (auth.uid() = user_id);

-- Admins/Deans can view registrations for their events
CREATE POLICY "Admins view registrations"
    ON public.event_registrations FOR SELECT
    USING (
        public.is_super_admin() 
        OR public.is_dean() 
        OR EXISTS (
            SELECT 1 FROM public.events 
            WHERE events.id = event_registrations.event_id 
            AND public.is_club_admin(events.club_id)
        )
    );

-- Users can register themselves
CREATE POLICY "Users can can register"
    ON public.event_registrations FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Admins can update status (mark attended)
CREATE POLICY "Admins update registration status"
    ON public.event_registrations FOR UPDATE
    USING (
        public.is_super_admin() 
        OR public.is_dean() 
        OR EXISTS (
            SELECT 1 FROM public.events 
            WHERE events.id = event_registrations.event_id 
            AND public.is_club_admin(events.club_id)
        )
    );

-- ATTENDANCE LOGS

-- Registrations Viewable by admins
CREATE POLICY "Admins view attendance logs"
    ON public.event_attendance FOR SELECT
    USING (
        public.is_super_admin() 
        OR public.is_dean() 
        OR EXISTS (
            SELECT 1 FROM public.event_registrations er
            JOIN public.events e ON er.event_id = e.id
            WHERE er.id = event_attendance.registration_id
            AND public.is_club_admin(e.club_id)
        )
    );

-- Admins can insert logs (scan)
CREATE POLICY "Admins insert attendance logs"
    ON public.event_attendance FOR INSERT
    WITH CHECK (
        public.is_super_admin() 
        OR public.is_dean() 
        OR EXISTS (
            SELECT 1 FROM public.event_registrations er
            JOIN public.events e ON er.event_id = e.id
            WHERE er.id = event_attendance.registration_id
            AND public.is_club_admin(e.club_id)
        )
    );

-- 5. Realtime
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'event_registrations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.event_registrations;
  END IF;
END $$;
