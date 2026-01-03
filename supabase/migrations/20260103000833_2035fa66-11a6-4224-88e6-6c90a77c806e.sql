-- Create new bucket for user smoke log photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('smoke-log-photos', 'smoke-log-photos', true);

-- Allow users to upload their own smoke log photos (folder must match user id)
CREATE POLICY "Users can upload their own smoke log photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'smoke-log-photos' 
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can only delete their own photos
CREATE POLICY "Users can delete their own smoke log photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'smoke-log-photos'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Anyone can view smoke log photos (they're part of public feed)
CREATE POLICY "Smoke log photos are publicly viewable"
ON storage.objects FOR SELECT
USING (bucket_id = 'smoke-log-photos');