-- Create Posts table for the "Clubs Wall"
CREATE TYPE post_status AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE IF NOT EXISTS public.posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    club_id UUID REFERENCES public.clubs(id) ON DELETE CASCADE NOT NULL,
    author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL, -- Blog content
    image_url TEXT,
    status post_status DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- Post Policies
-- Everyone can view APPROVED posts
CREATE POLICY "Public can view approved posts" 
ON public.posts FOR SELECT 
USING (status = 'approved');

-- Club Admins can view ALL posts from THEIR club (pending/rejected/approved)
CREATE POLICY "Club Admins can view own club posts" 
ON public.posts FOR SELECT 
USING (
    public.is_club_admin(club_id) OR public.is_dean()
);

-- Club Admins can INSERT posts for THEIR club
CREATE POLICY "Club Admins can insert posts" 
ON public.posts FOR INSERT 
WITH CHECK (
    public.is_club_admin(club_id)
);

-- Dean can UPDATE status (Approve/Reject)
-- Club Admins can UPDATE content of their own PENDING posts (optional, keeping simple for now)
CREATE POLICY "Dean can update posts" 
ON public.posts FOR UPDATE 
USING (public.is_dean());


-- MOCK DATA: Past Event (Highlights)
DO $$
DECLARE
    v_club_id UUID;
    v_admin_id UUID;
BEGIN
    -- 1. Try to find a club that has an admin assigned
    SELECT id, admin_id INTO v_club_id, v_admin_id 
    FROM public.clubs 
    WHERE admin_id IS NOT NULL 
    LIMIT 1;

    -- 2. Fallback: If no club with admin, pick ANY club and ANY profile
    IF v_club_id IS NULL THEN
        SELECT id INTO v_club_id FROM public.clubs LIMIT 1;
    END IF;
    
    IF v_admin_id IS NULL THEN
        SELECT id INTO v_admin_id FROM public.profiles LIMIT 1;
    END IF;

    -- 3. If still missing data, exit gracefully
    IF v_club_id IS NULL OR v_admin_id IS NULL THEN
        RAISE NOTICE 'Skipping mock data seeding: Club or Profile not found.';
        RETURN;
    END IF;

    -- 4. Insert Past Event
    INSERT INTO public.events (
        club_id, 
        created_by, 
        title, 
        description, 
        start_time, 
        end_time, 
        location, 
        status, 
        poster_url, 
        budget
    ) VALUES (
        v_club_id,
        v_admin_id,
        'Legacy Code Workshop 2023',
        'A comprehensive workshop on handling legacy systems. This event was a massive success with over 200 participants.',
        NOW() - INTERVAL '1 year', -- Past date
        NOW() - INTERVAL '1 year' + INTERVAL '2 hours',
        'Old Auditorium',
        'completed',
        'https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=2070&auto=format&fit=crop', -- Coding image
        5000
    );

    -- 5. Insert Approved Post for Clubs Wall
    INSERT INTO public.posts (
        club_id,
        author_id,
        title,
        content,
        image_url,
        status
    ) VALUES (
        v_club_id,
        v_admin_id,
        'Welcome to the new ClubSphere Wall!',
        'We are excited to launch this new platform where clubs can share their stories, blogs, and updates with the entire campus community. Stay tuned for amazing content!',
        'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=2070&auto=format&fit=crop',
        'approved'
    );
    
    -- 6. Insert Pending Post for Testing Approval
    INSERT INTO public.posts (
        club_id,
        author_id,
        title,
        content,
        image_url,
        status
    ) VALUES (
        v_club_id,
        v_admin_id,
        'Upcoming Hackathon Teaser',
        'Get ready for the biggest hackathon of the semester. Details coming soon...',
        NULL,
        'pending'
    );

END $$;
