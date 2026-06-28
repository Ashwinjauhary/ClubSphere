-- ==========================================
-- SAFE MIGRATION: Add super_admin role
-- ==========================================
-- This script safely adds the super_admin role to your existing database
-- WITHOUT deleting any data.

-- Step 1: Add super_admin to the app_role enum
-- Note: PostgreSQL doesn't allow modifying enums directly, so we need to:
-- 1. Create a new enum with the additional value
-- 2. Update the column to use the new enum
-- 3. Drop the old enum

-- Create new enum type with super_admin
DO $$ 
BEGIN
    -- Check if super_admin already exists in the enum
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'super_admin' 
        AND enumtypid = 'app_role'::regtype
    ) THEN
        -- Add super_admin to existing enum
        ALTER TYPE app_role ADD VALUE 'super_admin';
    END IF;
END $$;

-- Step 2: Add the is_super_admin helper function
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Update RLS policies to include super_admin access

-- PROFILES
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id OR public.is_super_admin());

DROP POLICY IF EXISTS "Super admins can delete profiles" ON public.profiles;
CREATE POLICY "Super admins can delete profiles"
  ON public.profiles FOR DELETE USING (public.is_super_admin());

-- CLUBS
DROP POLICY IF EXISTS "Deans can insert clubs" ON public.clubs;
DROP POLICY IF EXISTS "Deans and Super Admins can insert clubs" ON public.clubs;
CREATE POLICY "Deans and Super Admins can insert clubs"
  ON public.clubs FOR INSERT WITH CHECK (public.is_dean() OR public.is_super_admin());

DROP POLICY IF EXISTS "Admins can update their own club" ON public.clubs;
CREATE POLICY "Admins can update their own club"
  ON public.clubs FOR UPDATE USING (admin_id = auth.uid() OR public.is_dean() OR public.is_super_admin());

DROP POLICY IF EXISTS "Super admins can delete clubs" ON public.clubs;
CREATE POLICY "Super admins can delete clubs"
  ON public.clubs FOR DELETE USING (public.is_super_admin());

-- CLUB MEMBERS
DROP POLICY IF EXISTS "Users can join clubs" ON public.club_members;
CREATE POLICY "Users can join clubs"
  ON public.club_members FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_super_admin());

DROP POLICY IF EXISTS "Users can leave clubs" ON public.club_members;
CREATE POLICY "Users can leave clubs"
  ON public.club_members FOR DELETE USING (auth.uid() = user_id OR public.is_super_admin());

DROP POLICY IF EXISTS "Super admins can update memberships" ON public.club_members;
CREATE POLICY "Super admins can update memberships"
  ON public.club_members FOR UPDATE USING (public.is_super_admin());

-- CLUB APPLICATIONS
DROP POLICY IF EXISTS "Users can view their own applications" ON public.club_applications;
CREATE POLICY "Users can view their own applications"
  ON public.club_applications FOR SELECT USING (auth.uid() = user_id OR public.is_super_admin());

DROP POLICY IF EXISTS "Club Admins can view applications for their club" ON public.club_applications;
CREATE POLICY "Club Admins can view applications for their club"
  ON public.club_applications FOR SELECT USING (public.is_club_admin(club_id) OR public.is_super_admin());

DROP POLICY IF EXISTS "Users can create applications" ON public.club_applications;
CREATE POLICY "Users can create applications"
  ON public.club_applications FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_super_admin());

DROP POLICY IF EXISTS "Club Admins can update application status" ON public.club_applications;
CREATE POLICY "Club Admins can update application status"
  ON public.club_applications FOR UPDATE USING (public.is_club_admin(club_id) OR public.is_super_admin());

DROP POLICY IF EXISTS "Super admins can delete applications" ON public.club_applications;
CREATE POLICY "Super admins can delete applications"
  ON public.club_applications FOR DELETE USING (public.is_super_admin());

-- EVENTS
DROP POLICY IF EXISTS "Approved events are viewable by everyone" ON public.events;
CREATE POLICY "Approved events are viewable by everyone"
  ON public.events FOR SELECT USING (status = 'approved' OR status = 'completed' OR public.is_super_admin());

DROP POLICY IF EXISTS "Club Admins and Deans can view all events for their scope" ON public.events;
CREATE POLICY "Club Admins and Deans can view all events for their scope"
  ON public.events FOR SELECT USING (
    auth.uid() = created_by 
    OR public.is_club_admin(club_id) 
    OR public.is_dean()
    OR public.is_super_admin()
  );

DROP POLICY IF EXISTS "Club Admins can create events" ON public.events;
CREATE POLICY "Club Admins can create events"
  ON public.events FOR INSERT WITH CHECK (
    public.is_club_admin(club_id) OR public.is_dean() OR public.is_super_admin()
  );

DROP POLICY IF EXISTS "Club Admins can update their pending events" ON public.events;
CREATE POLICY "Club Admins can update their pending events"
  ON public.events FOR UPDATE USING (
    (public.is_club_admin(club_id) AND status = 'pending')
    OR public.is_dean()
    OR public.is_super_admin()
  );

DROP POLICY IF EXISTS "Super admins can delete events" ON public.events;
CREATE POLICY "Super admins can delete events"
  ON public.events FOR DELETE USING (public.is_super_admin());

-- REPORTS
DROP POLICY IF EXISTS "Deans and Club Admins can view reports" ON public.reports;
CREATE POLICY "Deans and Club Admins can view reports"
  ON public.reports FOR SELECT USING (
    public.is_dean() 
    OR public.is_super_admin()
    OR EXISTS (SELECT 1 FROM public.events WHERE events.id = reports.event_id AND public.is_club_admin(events.club_id))
  );

DROP POLICY IF EXISTS "Club Admins can create reports" ON public.reports;
CREATE POLICY "Club Admins can create reports"
  ON public.reports FOR INSERT WITH CHECK (
    public.is_super_admin()
    OR EXISTS (SELECT 1 FROM public.events WHERE events.id = reports.event_id AND public.is_club_admin(events.club_id))
  );

DROP POLICY IF EXISTS "Super admins can update reports" ON public.reports;
CREATE POLICY "Super admins can update reports"
  ON public.reports FOR UPDATE USING (public.is_super_admin());

DROP POLICY IF EXISTS "Super admins can delete reports" ON public.reports;
CREATE POLICY "Super admins can delete reports"
  ON public.reports FOR DELETE USING (public.is_super_admin());

-- NOTIFICATIONS
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT USING (auth.uid() = user_id OR public.is_super_admin());

DROP POLICY IF EXISTS "Super admins can update notifications" ON public.notifications;
CREATE POLICY "Super admins can update notifications"
  ON public.notifications FOR UPDATE USING (public.is_super_admin());

DROP POLICY IF EXISTS "Super admins can delete notifications" ON public.notifications;
CREATE POLICY "Super admins can delete notifications"
  ON public.notifications FOR DELETE USING (public.is_super_admin());

-- Verification: Check that super_admin was added
SELECT enumlabel FROM pg_enum WHERE enumtypid = 'app_role'::regtype ORDER BY enumsortorder;
