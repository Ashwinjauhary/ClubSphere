-- Create Event Feedback Table
CREATE TABLE IF NOT EXISTS public.event_feedback (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- Optional linking to user profile
    
    -- Personal Details (Captured explicitly for all users)
    full_name TEXT NOT NULL,
    roll_no TEXT,
    section TEXT,
    email TEXT,
    contact_number TEXT,
    
    -- Ratings (1-5 Scale)
    clarity_rating INTEGER CHECK (clarity_rating BETWEEN 1 AND 5),
    difficulty_rating INTEGER CHECK (difficulty_rating BETWEEN 1 AND 5),
    interaction_rating INTEGER CHECK (interaction_rating BETWEEN 1 AND 5),
    knowledge_rating INTEGER CHECK (knowledge_rating BETWEEN 1 AND 5),
    
    -- Qualitative Feedback
    suggestions TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.event_feedback ENABLE ROW LEVEL SECURITY;

-- Policies

-- 1. INSERT: Anyone (public for ease of feedback) or Authenticated users
-- We want anyone with the link to be able to submit feedback
CREATE POLICY "Anyone can submit feedback" 
ON public.event_feedback FOR INSERT 
WITH CHECK (true);

-- 2. SELECT: Only Club Admins of the respective club (and Super Admins) can view feedback
-- Using a join to check if the auth user is the admin of the club that owns the event
CREATE POLICY "Club Admins can view feedback for their events" 
ON public.event_feedback FOR SELECT 
USING (
    EXISTS (
        SELECT 1 
        FROM public.events e
        JOIN public.clubs c ON e.club_id = c.id
        WHERE e.id = event_feedback.event_id 
        AND (c.admin_id = auth.uid() OR is_super_admin())
    )
);

-- Note: No UPDATE/DELETE policies for now to preserve feedback integrity.
