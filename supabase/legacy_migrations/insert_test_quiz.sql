-- Helper script to insert a test quiz for TODAY
-- Run this if you want to test the Daily Quiz UI immediately without waiting for the Edge Function.

DO $$
DECLARE
  v_quiz_id uuid;
  v_today date := CURRENT_DATE;
BEGIN
  -- 1. Create Quiz for Today (if not exists)
  INSERT INTO public.daily_quizzes (date, topic)
  VALUES (v_today, 'React & TypeScript (Test Quiz)')
  ON CONFLICT (date) DO UPDATE SET topic = EXCLUDED.topic
  RETURNING id INTO v_quiz_id;

  -- 2. Clear existing questions for this quiz (to avoid duplicates if run multiple times)
  DELETE FROM public.quiz_questions WHERE quiz_id = v_quiz_id;

  -- 3. Insert 5 Test Questions
  INSERT INTO public.quiz_questions (quiz_id, question, options, correct_answer)
  VALUES 
  (v_quiz_id, 'What is the primary building block of a React application?', '["Component", "Module", "Package", "Element"]'::jsonb, 'Component'),
  (v_quiz_id, 'Which hook is used for side effects in React?', '["useState", "useEffect", "useContext", "useReducer"]'::jsonb, 'useEffect'),
  (v_quiz_id, 'What does TypeScript add to JavaScript?', '["Static Typing", "Runtime Speed", "New HTML Tags", "Better CSS"]'::jsonb, 'Static Typing'),
  (v_quiz_id, 'Which command creates a new Vite project?', '["npm create vite@latest", "npm init react-app", "npx create-react-app", "npm new vite"]'::jsonb, 'npm create vite@latest'),
  (v_quiz_id, 'What is the file extension for TypeScript React components?', '["*.js", "*.ts", "*.jsx", "*.tsx"]'::jsonb, '*.tsx');

  RAISE NOTICE 'Test Quiz Created for ID: %', v_quiz_id;
END $$;
