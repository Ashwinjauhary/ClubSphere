-- Add roll_number to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS roll_number text;

-- Allow users to update their own roll number
CREATE POLICY "Users can update own roll number"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id);

-- Allow admins/deans to read roll numbers (already covered by public read policy usually, but ensuring)
-- (Assuming public profiles are readable)
