-- Fix likes table - require authentication instead of public access
DROP POLICY IF EXISTS "Likes are viewable by everyone" ON public.likes;
CREATE POLICY "Authenticated users can view likes"
ON public.likes
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Add text length constraints for security
ALTER TABLE smoke_logs 
  ADD CONSTRAINT notes_length_check CHECK (length(notes) <= 2000);

ALTER TABLE comments 
  ADD CONSTRAINT comment_length_check CHECK (length(comment) <= 1000);

ALTER TABLE cigar_requests 
  ADD CONSTRAINT requested_name_length_check CHECK (length(requested_name) <= 200),
  ADD CONSTRAINT details_length_check CHECK (details IS NULL OR length(details) <= 1000);

ALTER TABLE reports 
  ADD CONSTRAINT reason_length_check CHECK (length(reason) <= 1000);

ALTER TABLE cigar_band_images
  ADD CONSTRAINT description_length_check CHECK (description IS NULL OR length(description) <= 500);