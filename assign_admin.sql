-- ASSIGN CLUB ADMIN SCRIPT
-- Run this script in the Supabase SQL Editor to assign a user as a Club Admin.

-- 1. Replace these variables with the actual values:
--    'student@college.edu' -> The email of the user you want to promote
--    'codester-coding'     -> The slug of the club they will manage

DO $$
DECLARE
    target_email text := 'student@college.edu';  -- CHANGE THIS
    target_club_slug text := 'codester-coding';   -- CHANGE THIS
    target_user_id uuid;
BEGIN
    -- 1. Find the User ID from profiles (or auth.users)
    SELECT id INTO target_user_id FROM auth.users WHERE email = target_email;

    IF target_user_id IS NULL THEN
        RAISE NOTICE 'User not found with email: %', target_email;
        RETURN;
    END IF;

    -- 2. Promote User to 'admin' in profiles
    UPDATE public.profiles
    SET role = 'admin'
    WHERE id = target_user_id;

    -- 3. Assign User as Admin of the Club
    UPDATE public.clubs
    SET admin_id = target_user_id
    WHERE slug = target_club_slug;

    RAISE NOTICE 'Success! User % is now Admin of club %', target_email, target_club_slug;
END $$;
