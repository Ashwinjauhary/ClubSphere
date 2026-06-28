-- Drop existing restricted update policy
DROP POLICY IF EXISTS "Club Admins can update their pending events" ON public.events;

-- Create new policy allowing updates to draft, pending, and approved events
CREATE POLICY "Club Admins can update their events"
ON public.events
FOR UPDATE
USING (
    public.is_dean() OR 
    (public.is_club_admin(club_id) AND status IN ('draft', 'pending', 'approved', 'rejected'))
);

-- Note: 'completed' events might be locked, but user said 'update later', so maybe all? 
-- Let's stick to draft/pending/approved/rejected. 'completed' is usually historical.
