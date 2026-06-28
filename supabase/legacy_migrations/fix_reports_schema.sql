-- Fix Reports Schema and Foreign Keys
-- This script first ensures all necessary columns exist, then fixes the foreign key names.

-- 1. Ensure columns exist (Schema Upgrade for Workflow)
ALTER TABLE public.reports 
ADD COLUMN IF NOT EXISTS approval_status text DEFAULT 'draft' CHECK (approval_status IN ('draft', 'pending_approval', 'approved', 'rejected')),
ADD COLUMN IF NOT EXISTS rejection_comments text,
ADD COLUMN IF NOT EXISTS approved_by uuid,
ADD COLUMN IF NOT EXISTS approved_at timestamp with time zone;

-- 2. Fix 'submitted_by' FK
ALTER TABLE public.reports 
DROP CONSTRAINT IF EXISTS reports_submitted_by_fkey;

ALTER TABLE public.reports 
ADD CONSTRAINT reports_submitted_by_fkey 
FOREIGN KEY (submitted_by) 
REFERENCES public.profiles(id);

-- 3. Fix 'approved_by' FK
ALTER TABLE public.reports 
DROP CONSTRAINT IF EXISTS reports_approved_by_fkey;

ALTER TABLE public.reports 
ADD CONSTRAINT reports_approved_by_fkey 
FOREIGN KEY (approved_by) 
REFERENCES public.profiles(id);

-- 4. Fix 'event_id' FK (Ensure cascade delete)
ALTER TABLE public.reports 
DROP CONSTRAINT IF EXISTS reports_event_id_fkey;

ALTER TABLE public.reports 
ADD CONSTRAINT reports_event_id_fkey 
FOREIGN KEY (event_id) 
REFERENCES public.events(id)
ON DELETE CASCADE;
