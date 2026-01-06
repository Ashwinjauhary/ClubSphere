-- Create Post Likes table
CREATE TABLE IF NOT EXISTS public.post_likes (
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (user_id, post_id)
);

-- Enable RLS for Likes
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;

-- Like Policies
CREATE POLICY "Public can view likes" 
ON public.post_likes FOR SELECT 
USING (true);

CREATE POLICY "Users can like/unlike posts" 
ON public.post_likes FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);


-- Create Post Comments table
CREATE TABLE IF NOT EXISTS public.post_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for Comments
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

-- Comment Policies
CREATE POLICY "Public can view comments" 
ON public.post_comments FOR SELECT 
USING (true);

CREATE POLICY "Users can create comments" 
ON public.post_comments FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments" 
ON public.post_comments FOR DELETE 
USING (auth.uid() = user_id);

-- Optional: Create a view or function to get like counts efficiently, 
-- but for now we can just select count(*).
