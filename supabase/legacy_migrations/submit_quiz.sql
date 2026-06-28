-- Secure RPC function to submit quiz answers and calculate score server-side
-- UPDATED: Prevents Admin/Dean/SuperAdmin from submitting efforts.

CREATE OR REPLACE FUNCTION submit_quiz(
  p_quiz_id uuid,
  p_answers jsonb
) returns jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_score integer := 0;
  v_total integer := 0;
  v_xp_reward integer := 0;
  v_question record;
  v_user_answer text;
  v_user_id uuid := auth.uid();
  v_existing_attempt uuid;
  v_role text;
BEGIN
  -- 1. Check if user is logged in
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Not authenticated');
  END IF;

  -- 2. Check User Role
  SELECT role INTO v_role FROM public.profiles WHERE id = v_user_id;
  
  -- Allow only 'student' role (or NULL which defaults to student logic usually, but let's be strict or lenient)
  -- Or explicitly BLOCK admin types.
  IF v_role IN ('admin', 'dean', 'super_admin') THEN
     RETURN jsonb_build_object('success', false, 'message', 'Admins and Deans are strictly observers. No XP for you! 🚫');
  END IF;

  -- 3. Check if already attempted
  SELECT id INTO v_existing_attempt FROM public.quiz_attempts 
  WHERE quiz_id = p_quiz_id AND user_id = v_user_id;
  
  IF v_existing_attempt IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'You have already attempted this quiz!');
  END IF;

  -- 4. Calculate Score
  FOR v_question IN SELECT id, correct_answer FROM public.quiz_questions WHERE quiz_id = p_quiz_id LOOP
    v_total := v_total + 1;
    v_user_answer := p_answers->>v_question.id::text;
    IF v_user_answer = v_question.correct_answer THEN
      v_score := v_score + 1;
    END IF;
  END LOOP;

  IF v_total = 0 THEN
    RETURN jsonb_build_object('success', false, 'message', 'Quiz has no questions?');
  END IF;

  -- 5. Calculate Rewards
  v_xp_reward := v_score * 10;
  IF v_score = v_total THEN
    v_xp_reward := v_xp_reward + 50;
  END IF;

  -- 6. Insert Attempt
  INSERT INTO public.quiz_attempts (quiz_id, user_id, score, xp_earned)
  VALUES (p_quiz_id, v_user_id, v_score, v_xp_reward);

  -- 7. Update Profile
  UPDATE public.profiles
  SET 
    xp = COALESCE(xp, 0) + v_xp_reward,
    weekly_xp = COALESCE(weekly_xp, 0) + v_xp_reward,
    level = FLOOR((COALESCE(xp, 0) + v_xp_reward) / 500) + 1
  WHERE id = v_user_id;

  RETURN jsonb_build_object(
    'success', true, 
    'score', v_score, 
    'total', v_total, 
    'xp_earned', v_xp_reward,
    'perfect_bonus', (v_score = v_total)
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$;
