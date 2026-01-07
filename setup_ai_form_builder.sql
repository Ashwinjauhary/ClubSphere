-- Drop previous feedback specific tables if they exist (optional, or we can migrate data)
-- DROP TABLE IF EXISTS feedback_responses;
-- DROP TABLE IF EXISTS feedback_forms;

-- Create generic 'forms' table
-- questions JSONB structure remains flexible:
-- [
--   {
--     "id": "uuid",
--     "type": "text" | "rating" | "single_choice" | "multiple_choice" | "date" | "email",
--     "label": "Question Text",
--     "required": boolean,
--     "options": ["Option 1"] 
--   }
-- ]
CREATE TABLE forms (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL, -- Admin who created it
    event_id UUID REFERENCES events(id) ON DELETE SET NULL, -- Optional link to an event
    title TEXT NOT NULL,
    description TEXT,
    type TEXT DEFAULT 'general', -- 'feedback', 'registration', 'survey', 'poll'
    is_published BOOLEAN DEFAULT false,
    questions JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create generic 'form_responses' table
CREATE TABLE form_responses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    form_id UUID REFERENCES forms(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Nullable for anonymous
    answers JSONB DEFAULT '{}'::jsonb,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_responses ENABLE ROW LEVEL SECURITY;

-- Policies for forms

-- 1. Admins/Dean can manage ALL forms
CREATE POLICY "Admins can manage all forms" ON forms
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND (profiles.role IN ('admin', 'super_admin', 'dean'))
        )
    );

-- 2. Everyone (Public/Auth) can view PUBLISHED forms
CREATE POLICY "Public can view published forms" ON forms
    FOR SELECT
    USING (is_published = true);

-- Policies for form_responses

-- 1. Admins can view ALL responses
CREATE POLICY "Admins can view all responses" ON form_responses
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND (profiles.role IN ('admin', 'super_admin', 'dean'))
        )
    );

-- 2. Anyone can submit a response (if public form)
CREATE POLICY "Public can submit responses" ON form_responses
    FOR INSERT
    WITH CHECK (true);

-- 3. Users can view their OWN responses
CREATE POLICY "Users can view own responses" ON form_responses
    FOR SELECT
    USING (auth.uid() = user_id);

-- Add to Realtime
alter publication supabase_realtime add table forms;
alter publication supabase_realtime add table form_responses;
