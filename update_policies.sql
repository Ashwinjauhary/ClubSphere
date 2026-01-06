-- Drop policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Club Admins can update student profiles" ON public.profiles;
DROP POLICY IF EXISTS "Club Admins can add members" ON public.club_members;
DROP POLICY IF EXISTS "Club Admins can remove members" ON public.club_members;

-- 1. Allow Club Admins and Deans to update student profiles (for roll numbers/names)
CREATE POLICY "Club Admins can update student profiles"
ON public.profiles
FOR UPDATE
USING (
    public.is_dean() OR 
    exists (select 1 from public.clubs where admin_id = auth.uid()) 
);

-- 2. Allow Club Admins and Deans to add members (insert into club_members)
CREATE POLICY "Club Admins can add members"
ON public.club_members
FOR INSERT
WITH CHECK (
    public.is_club_admin(club_id) OR public.is_dean()
);

-- 3. Allow Club Admins and Deans to remove members
CREATE POLICY "Club Admins can remove members"
ON public.club_members
FOR DELETE
USING (
    public.is_club_admin(club_id) OR public.is_dean()
);
