-- Add missing RLS policies for notifications table
-- Users should be able to UPDATE (mark as read) and DELETE their own notifications

-- Policy for UPDATE (mark as read)
CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy for DELETE (remove notifications)
CREATE POLICY "Users can delete their own notifications"
  ON public.notifications FOR DELETE
  USING (auth.uid() = user_id);
