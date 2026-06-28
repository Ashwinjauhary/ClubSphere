-- Create Chat Channels Table
CREATE TABLE IF NOT EXISTS public.chat_channels (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    club_id UUID REFERENCES public.clubs(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL, -- e.g., 'general', 'announcements'
    type TEXT DEFAULT 'public' CHECK (type IN ('public', 'private', 'announcement')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_by UUID REFERENCES public.profiles(id)
);

-- Create Chat Messages Table
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    channel_id UUID REFERENCES public.chat_channels(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.chat_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Policies for Chat Channels
-- 1. Everyone can view public channels of clubs
CREATE POLICY "Public channels are viewable by everyone" 
ON public.chat_channels FOR SELECT 
USING (true);

-- 2. Only Club Admins can create channels
CREATE POLICY "Club Admins can create channels" 
ON public.chat_channels FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.clubs 
        WHERE id = club_id AND admin_id = auth.uid()
    ) OR 
    is_super_admin()
);

-- Policies for Chat Messages
-- 1. Everyone can view messages in public channels
CREATE POLICY "Messages in public channels are viewable by everyone" 
ON public.chat_messages FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.chat_channels 
        WHERE id = channel_id
    )
);

-- 2. Authenticated users can insert messages (Simple version: refined later for club membership)
CREATE POLICY "Authenticated users can send messages" 
ON public.chat_messages FOR INSERT 
WITH CHECK (
    auth.uid() = user_id
);

-- Enable Realtime for these tables
BEGIN;
  -- Remove if already exists to avoid error
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime FOR TABLE public.chat_messages, public.notifications;
COMMIT;
