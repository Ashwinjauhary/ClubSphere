-- ==========================================
-- FIX: Allow Super Admin to Update Any User Role
-- ==========================================
-- This fixes the issue where super admin can't change other users' roles

-- Drop and recreate the profile update policy with super admin access
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can update their own profile"
  ON public.profiles 
  FOR UPDATE 
  USING (auth.uid() = id OR public.is_super_admin());

-- Verify the policy was created
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'profiles' AND policyname = 'Users can update their own profile';
