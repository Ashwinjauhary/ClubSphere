-- Add designation column to club_members
ALTER TABLE public.club_members 
ADD COLUMN IF NOT EXISTS designation text DEFAULT 'Member';

-- Allow admins to update memberships
CREATE POLICY "Club Admins can update members of their club"
ON public.club_members
FOR UPDATE
USING (public.is_club_admin(club_id));

-- Allow admins to delete members (kick)
CREATE POLICY "Club Admins can remove members"
ON public.club_members
FOR DELETE
USING (public.is_club_admin(club_id));
