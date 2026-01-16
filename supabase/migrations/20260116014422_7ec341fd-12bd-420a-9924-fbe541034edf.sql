-- Remove public access policy for comments
DROP POLICY IF EXISTS "Comments are viewable by everyone" ON public.comments;

-- Require authentication to view comments (consistent with smoke_logs and profiles)
CREATE POLICY "Authenticated users can view comments"
  ON public.comments FOR SELECT
  USING (auth.uid() IS NOT NULL);