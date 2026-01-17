-- =============================================
-- Fix: Allow Students to Register for Events
-- =============================================
-- The previous schema update for 'participants' table missed the INSERT policy for students.
-- This caused the 403 Forbidden error when trying to register.

-- 1. Allow authenticated users to register themselves
CREATE POLICY "Users can register themselves"
ON public.participants
FOR INSERT
WITH CHECK (
    auth.role() = 'authenticated' AND
    auth.uid() = user_id
);

-- 2. Allow users to cancel (delete) their own registration
CREATE POLICY "Users can cancel their own registration"
ON public.participants
FOR DELETE
USING (
    auth.uid() = user_id
);

-- 3. Allow users to update their own registration (e.g. changing team details)
CREATE POLICY "Users can update their own registration"
ON public.participants
FOR UPDATE
USING (
    auth.uid() = user_id
);

-- Note: SELECT policy "Public view participants" was already present in schema.
