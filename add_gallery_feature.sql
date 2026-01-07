-- Create storage bucket for gallery if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('club-gallery', 'club-gallery', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for club-gallery bucket
-- Public access to view images
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'club-gallery' );

-- Club admins/super admins can upload
CREATE POLICY "Club Admin Upload"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'club-gallery' 
    AND (auth.role() = 'authenticated')
);

-- Club admins/super admins can delete
CREATE POLICY "Club Admin Delete"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'club-gallery'
    AND (auth.role() = 'authenticated')
);

-- Gallery Feature - Add club_gallery table

-- Create club_gallery table
CREATE TABLE IF NOT EXISTS public.club_gallery (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    caption TEXT,
    uploaded_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.club_gallery ENABLE ROW LEVEL SECURITY;

-- RLS Policies for club_gallery
-- Everyone can view gallery images
CREATE POLICY "Gallery images are viewable by everyone"
    ON public.club_gallery FOR SELECT
    USING (true);

-- Club admins and super admins can insert gallery images
CREATE POLICY "Club admins can upload gallery images"
    ON public.club_gallery FOR INSERT
    WITH CHECK (
        public.is_club_admin(club_id) 
        OR public.is_dean() 
        OR public.is_super_admin()
    );

-- Club admins and super admins can delete gallery images
CREATE POLICY "Club admins can delete gallery images"
    ON public.club_gallery FOR DELETE
    USING (
        public.is_club_admin(club_id) 
        OR public.is_dean() 
        OR public.is_super_admin()
    );

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_club_gallery_club_id ON public.club_gallery(club_id);
CREATE INDEX IF NOT EXISTS idx_club_gallery_created_at ON public.club_gallery(created_at DESC);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.club_gallery;
