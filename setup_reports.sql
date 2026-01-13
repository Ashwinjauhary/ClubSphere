-- Reset tables to ensure schema updates
DROP TABLE IF EXISTS public.report_images;
DROP TABLE IF EXISTS public.reports;

-- Create reports table
CREATE TABLE public.reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    club_id UUID REFERENCES public.clubs(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    generated_content JSONB NOT NULL, -- Stores the AI output structure
    attendee_count INTEGER,
    highlights TEXT,
    challenges TEXT,
    content TEXT NOT NULL,
    status TEXT CHECK (status IN ('draft', 'final')) DEFAULT 'draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    submitted_by UUID,
    CONSTRAINT fk_reports_submitted_by FOREIGN KEY (submitted_by) REFERENCES public.profiles(id)
);

-- Create report_images table
CREATE TABLE IF NOT EXISTS public.report_images (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    report_id UUID REFERENCES public.reports(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    caption TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS Persistence
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_images ENABLE ROW LEVEL SECURITY;

-- Policies for Reports
CREATE POLICY "Club admins can insert reports for their club" ON public.reports
    FOR INSERT WITH CHECK (
        public.is_club_admin(club_id)
    );

CREATE POLICY "Club admins can view their own club reports" ON public.reports
    FOR SELECT USING (
        public.is_club_admin(club_id)
    );

CREATE POLICY "Club admins can update their own club reports" ON public.reports
    FOR UPDATE USING (
        public.is_club_admin(club_id)
    );

-- Policies for Report Images
CREATE POLICY "Club admins can manage report images" ON public.report_images
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.reports 
            WHERE reports.id = report_images.report_id 
            AND public.is_club_admin(reports.club_id)
        )
    );
