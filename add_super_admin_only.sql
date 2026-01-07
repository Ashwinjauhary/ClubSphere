-- ==========================================
-- ADD SUPER ADMIN - NO DROPS, ONLY ADDITIONS
-- ==========================================
-- This ONLY adds super_admin role and permissions
-- Does NOT drop or modify any existing policies

-- Step 1: Add super_admin to app_role enum (if not already exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'super_admin' 
        AND enumtypid = 'app_role'::regtype
    ) THEN
        ALTER TYPE app_role ADD VALUE 'super_admin';
    END IF;
END $$;

-- Step 2: Create is_super_admin helper function
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Add super admin policies (only new policies, no drops)

-- PROFILES - Add super admin delete capability
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' 
        AND policyname = 'Super admins can delete profiles'
    ) THEN
        CREATE POLICY "Super admins can delete profiles"
          ON public.profiles FOR DELETE USING (public.is_super_admin());
    END IF;
END $$;

-- CLUBS - Add super admin delete capability
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'clubs' 
        AND policyname = 'Super admins can delete clubs'
    ) THEN
        CREATE POLICY "Super admins can delete clubs"
          ON public.clubs FOR DELETE USING (public.is_super_admin());
    END IF;
END $$;

-- CLUB MEMBERS - Add super admin update capability
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'club_members' 
        AND policyname = 'Super admins can update memberships'
    ) THEN
        CREATE POLICY "Super admins can update memberships"
          ON public.club_members FOR UPDATE USING (public.is_super_admin());
    END IF;
END $$;

-- CLUB APPLICATIONS - Add super admin delete capability
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'club_applications' 
        AND policyname = 'Super admins can delete applications'
    ) THEN
        CREATE POLICY "Super admins can delete applications"
          ON public.club_applications FOR DELETE USING (public.is_super_admin());
    END IF;
END $$;

-- EVENTS - Add super admin delete capability
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'events' 
        AND policyname = 'Super admins can delete events'
    ) THEN
        CREATE POLICY "Super admins can delete events"
          ON public.events FOR DELETE USING (public.is_super_admin());
    END IF;
END $$;

-- REPORTS - Add super admin update capability
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'reports' 
        AND policyname = 'Super admins can update reports'
    ) THEN
        CREATE POLICY "Super admins can update reports"
          ON public.reports FOR UPDATE USING (public.is_super_admin());
    END IF;
END $$;

-- REPORTS - Add super admin delete capability
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'reports' 
        AND policyname = 'Super admins can delete reports'
    ) THEN
        CREATE POLICY "Super admins can delete reports"
          ON public.reports FOR DELETE USING (public.is_super_admin());
    END IF;
END $$;

-- NOTIFICATIONS - Add super admin update capability
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'notifications' 
        AND policyname = 'Super admins can update notifications'
    ) THEN
        CREATE POLICY "Super admins can update notifications"
          ON public.notifications FOR UPDATE USING (public.is_super_admin());
    END IF;
END $$;

-- NOTIFICATIONS - Add super admin delete capability
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'notifications' 
        AND policyname = 'Super admins can delete notifications'
    ) THEN
        CREATE POLICY "Super admins can delete notifications"
          ON public.notifications FOR DELETE USING (public.is_super_admin());
    END IF;
END $$;

-- Verification
SELECT 'Super admin role added successfully! All existing policies preserved.' as status;
SELECT enumlabel as available_roles FROM pg_enum WHERE enumtypid = 'app_role'::regtype ORDER BY enumsortorder;
