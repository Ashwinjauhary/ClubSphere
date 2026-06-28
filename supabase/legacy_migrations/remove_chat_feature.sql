-- Remove Chat Tables script

-- 1. Remove tables from realtime publication if they exist
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename IN ('chat_messages')
    ) THEN
        ALTER PUBLICATION supabase_realtime DROP TABLE public.chat_messages;
    END IF;
END $$;

-- 2. Drop the tables (Policies will be dropped automatically with CASCADE)
DROP TABLE IF EXISTS public.chat_messages CASCADE;
DROP TABLE IF EXISTS public.chat_channels CASCADE;

-- 3. Confirmation of cleanup
DO $$
BEGIN
    RAISE NOTICE 'Chat tables and related objects have been successfully removed.';
END $$;
