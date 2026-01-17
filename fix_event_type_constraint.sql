-- FIX THE 'FUN' EVENT TYPE ERROR
-- Run this script to allow 'Fun' events in the database.

-- 1. Drop the old strict rule
ALTER TABLE public.events DROP CONSTRAINT IF EXISTS "events_event_type_check";

-- 2. Add the new flexible rule that includes 'Fun'
ALTER TABLE public.events ADD CONSTRAINT "events_event_type_check" 
  CHECK (event_type IN ('Technical', 'Cultural', 'Academic', 'Sports', 'Other', 'Fun'));

-- 3. Verify it worked (Optional, just adds a comment)
COMMENT ON COLUMN public.events.event_type IS 'Allowed types: Technical, Cultural, Academic, Sports, Other, Fun';
