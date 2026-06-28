-- Add poster_url to events table
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS poster_url text;
