-- Drop the old static feedback table if it exists
DROP TABLE IF EXISTS event_feedback;

-- Create feedback_forms table
-- questions JSONB structure:
-- [
--   {
--     "id": "uuid",
--     "type": "text" | "rating" | "single_choice" | "multiple_choice",
--     "label": "Question Text",
--     "required": boolean,
--     "options": ["Option 1", "Option 2"] // Optional, for choice types
--   }
-- ]
CREATE TABLE feedback_forms (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    is_published BOOLEAN DEFAULT false,
    questions JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create feedback_responses table
-- answers JSONB structure:
-- {
--   "question_id_1": "answer value",
--   "question_id_2": 5
-- }
CREATE TABLE feedback_responses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    form_id UUID REFERENCES feedback_forms(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Nullable for anonymous feedback if we want
    answers JSONB DEFAULT '{}'::jsonb,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE feedback_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_responses ENABLE ROW LEVEL SECURITY;

-- Policies for feedback_forms

-- 1. Admins can view all forms
CREATE POLICY "Admins can view all forms" ON feedback_forms
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND (profiles.role IN ('admin', 'super_admin', 'dean'))
        )
    );

-- 2. Everyone (Authenticated) can view PUBLISHED forms (to answer them)
CREATE POLICY "Public can view published forms" ON feedback_forms
    FOR SELECT
    USING (is_published = true);

-- 3. Admins can insert/update/delete forms
CREATE POLICY "Admins can manage forms" ON feedback_forms
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND (profiles.role IN ('admin', 'super_admin', 'dean'))
        )
    );

-- Policies for feedback_responses

-- 1. Admins can view all responses (to analyze)
CREATE POLICY "Admins can view all responses" ON feedback_responses
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND (profiles.role IN ('admin', 'super_admin', 'dean'))
        )
    );

-- 2. Authenticated users can INSERT responses
CREATE POLICY "Users can submit responses" ON feedback_responses
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- 3. Users can view their OWN responses (optional, strictly speaking not needed for anonymous style but good for history)
CREATE POLICY "Users can view own responses" ON feedback_responses
    FOR SELECT
    USING (auth.uid() = user_id);

-- Add to Realtime (Optional, for live charts)
alter publication supabase_realtime add table feedback_forms;
alter publication supabase_realtime add table feedback_responses;
