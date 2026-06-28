-- ==========================================
-- ASSIGN SUPER ADMIN ROLE
-- ==========================================
-- This script grants super admin privileges to a specific user.
-- Super admins have unrestricted access to all data and operations.

-- INSTRUCTIONS:
-- 1. Replace 'your-email@example.com' with your actual email address
-- 2. Run this script in the Supabase SQL Editor
-- 3. Verify the change by checking your profile in the profiles table

-- Update the role for your user
UPDATE public.profiles
SET role = 'super_admin'
WHERE email = 'your-email@example.com';

-- Verify the change
SELECT id, email, full_name, role, created_at
FROM public.profiles
WHERE email = 'your-email@example.com';

-- ALTERNATIVE: If you know your user ID
-- UPDATE public.profiles
-- SET role = 'super_admin'
-- WHERE id = 'your-user-id-here';
