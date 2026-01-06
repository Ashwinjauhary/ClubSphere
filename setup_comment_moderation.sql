-- Policy for Admins and Deans to delete ANY comment
CREATE POLICY "Admins and Deans can delete any comment" 
ON public.post_comments FOR DELETE 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'dean')
    )
);
