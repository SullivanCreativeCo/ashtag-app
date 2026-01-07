-- Remove overly permissive policy that allows unauthenticated access
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Require authentication to view profiles (prevents anonymous scraping while maintaining app functionality)
CREATE POLICY "Authenticated users can view profiles" 
  ON public.profiles FOR SELECT 
  USING (auth.uid() IS NOT NULL);