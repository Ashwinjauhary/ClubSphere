-- Add proposal_data column to events table to store structured objectives, rounds, and rules
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS proposal_data jsonb DEFAULT '{}'::jsonb;

-- Ensure 'draft' status exists in the enum
ALTER TYPE public.event_status ADD VALUE IF NOT EXISTS 'draft';

-- Fix event_type constraint to allow 'Fun' (which AI is now generating)
ALTER TABLE public.events DROP CONSTRAINT IF EXISTS events_event_type_check;
ALTER TABLE public.events ADD CONSTRAINT events_event_type_check 
  CHECK (event_type IN ('Technical', 'Cultural', 'Academic', 'Sports', 'Other', 'Fun'));
