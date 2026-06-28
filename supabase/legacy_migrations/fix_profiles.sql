-- FIX MISSING PROFILES
-- This script backfills public.profiles for any user in auth.users who is missing a profile.
-- Run this if your sidebars/profiles are empty after a database reset.

insert into public.profiles (id, email, full_name, role)
select 
    id, 
    email, 
    coalesce(raw_user_meta_data->>'full_name', 'Unknown User'), 
    'student' -- Default role
from auth.users
where id not in (select id from public.profiles);

-- Confirm the fix
select count(*) as profiles_created from public.profiles;
