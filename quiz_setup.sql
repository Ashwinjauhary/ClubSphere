-- 1. Create table to track daily quizzes
CREATE TABLE IF NOT EXISTS public.daily_quizzes (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    date date NOT NULL UNIQUE, -- Ensures only one quiz per day
    topic text NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create table for quiz questions
CREATE TABLE IF NOT EXISTS public.quiz_questions (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    quiz_id uuid REFERENCES public.daily_quizzes(id) ON DELETE CASCADE NOT NULL,
    question text NOT NULL,
    options jsonb NOT NULL, -- Array of 4 strings
    correct_answer text NOT NULL, -- The correct option string
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create table for user attempts
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    quiz_id uuid REFERENCES public.daily_quizzes(id) ON DELETE CASCADE NOT NULL,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    score integer NOT NULL, -- e.g., 8/10
    xp_earned integer NOT NULL,
    completed_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(quiz_id, user_id) -- ENFORCE 1 ATTEMPT PER USER PER QUIZ
);

-- 4. Update profiles table for Gamification
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS xp integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS level integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS weekly_xp integer DEFAULT 0;

-- 5. Enable RLS
ALTER TABLE public.daily_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies

-- Daily Quizzes: Everyone can view, specific roles can edit (or just service role if automated)
CREATE POLICY "Everyone can view daily quizzes" ON public.daily_quizzes
    FOR SELECT USING (true);

-- Quiz Questions: Everyone can view
CREATE POLICY "Everyone can view quiz questions" ON public.quiz_questions
    FOR SELECT USING (true);

-- Quiz Attempts: Users can view their own, Insert their own
CREATE POLICY "Users can view own attempts" ON public.quiz_attempts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own attempts" ON public.quiz_attempts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Start fresh for profiles RLS to ensure Leaderboard access
CREATE POLICY "Everyone can view profiles for leaderboard" ON public.profiles
    FOR SELECT USING (true);
