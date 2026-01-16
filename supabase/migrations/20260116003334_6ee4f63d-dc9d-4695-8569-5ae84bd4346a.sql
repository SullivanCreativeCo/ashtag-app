-- Remove the overly permissive public access policy
DROP POLICY IF EXISTS "Smoke logs are viewable by everyone" ON public.smoke_logs;

-- Require authentication to view smoke logs (maintains social feed functionality)
CREATE POLICY "Authenticated users can view smoke logs"
  ON public.smoke_logs FOR SELECT
  USING (auth.uid() IS NOT NULL);