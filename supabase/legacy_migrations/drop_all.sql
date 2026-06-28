-- ==========================================
-- COMPLETE DROP - ALL TABLES INCLUDING EXTRAS
-- ==========================================
-- This drops EVERYTHING including the extra tables shown in your database

-- Drop triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop functions
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.is_dean() CASCADE;
DROP FUNCTION IF EXISTS public.is_club_admin(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.is_super_admin() CASCADE;

-- Drop all tables (including extras)
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.club_applications CASCADE;
DROP TABLE IF EXISTS public.reports CASCADE;
DROP TABLE IF EXISTS public.events CASCADE;
DROP TABLE IF EXISTS public.club_members CASCADE;
DROP TABLE IF EXISTS public.clubs CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Drop extra tables found in your database
DROP TABLE IF EXISTS public.posts CASCADE;
DROP TABLE IF EXISTS public.post_likes CASCADE;
DROP TABLE IF EXISTS public.post_comments CASCADE;
DROP TABLE IF EXISTS public.event_registrations CASCADE;
DROP TABLE IF EXISTS public.report_images CASCADE;

-- Drop all enum types
DROP TYPE IF EXISTS public.notification_type;
DROP TYPE IF EXISTS public.application_status;
DROP TYPE IF EXISTS public.member_role;
DROP TYPE IF EXISTS public.event_status;
DROP TYPE IF EXISTS public.app_role;
DROP TYPE IF EXISTS public.post_status;

-- Drop storage policies
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Auth Upload" ON storage.objects;

-- Final verification
SELECT 'Tables remaining:' as check_type, tablename FROM pg_tables WHERE schemaname = 'public'
UNION ALL
SELECT 'Types remaining:', typname FROM pg_type WHERE typnamespace = 'public'::regnamespace AND typtype = 'e';
