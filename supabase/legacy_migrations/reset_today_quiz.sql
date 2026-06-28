-- 🗑️ RESET TODAY'S QUIZ (For Testing Purposes)
-- Run this to delete the quiz for the current date.
-- This allows you to visit the page again and watch the "Lazy Generation" happen.

DO $$
DECLARE
    v_today DATE := CURRENT_DATE;
    v_quiz_id UUID;
BEGIN
    -- 1. Find today's quiz
    SELECT id INTO v_quiz_id FROM public.daily_quizzes WHERE date = v_today;

    IF v_quiz_id IS NOT NULL THEN
        -- 2. Delete attempts (if any)
        DELETE FROM public.quiz_attempts WHERE quiz_id = v_quiz_id;
        
        -- 3. Delete questions
        DELETE FROM public.quiz_questions WHERE quiz_id = v_quiz_id;
        
        -- 4. Delete the quiz itself
        DELETE FROM public.daily_quizzes WHERE id = v_quiz_id;
        
        RAISE NOTICE '✅ Deleted quiz for %', v_today;
    ELSE
        RAISE NOTICE 'ℹ️ No quiz found for %', v_today;
    END IF;
END $$;
