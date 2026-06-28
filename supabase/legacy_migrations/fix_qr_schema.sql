-- Fix for missing qr_code_hash column
-- Run this script in Supabase SQL Editor

-- 1. Ensure the table exists
CREATE TABLE IF NOT EXISTS public.event_registrations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    registration_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    status TEXT DEFAULT 'registered' CHECK (status IN ('registered', 'attended', 'cancelled')),
    UNIQUE(event_id, user_id)
);

-- 2. Force add/ensure columns exist (Idempotent)
DO $$
BEGIN
    -- Add ticket_code if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'event_registrations' AND column_name = 'ticket_code') THEN
        ALTER TABLE public.event_registrations ADD COLUMN ticket_code TEXT DEFAULT upper(substring(md5(random()::text), 1, 8)) UNIQUE;
    END IF;

    -- Add qr_code_hash if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'event_registrations' AND column_name = 'qr_code_hash') THEN
        ALTER TABLE public.event_registrations ADD COLUMN qr_code_hash TEXT UNIQUE;
    END IF;
END $$;

-- 3. Reload schema cache (optional, effectively done by altering)
NOTIFY pgrst, 'reload schema';
