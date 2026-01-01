-- Create storage bucket for cigar band reference images
INSERT INTO storage.buckets (id, name, public)
VALUES ('cigar-bands', 'cigar-bands', true);

-- Storage policies for cigar band images
CREATE POLICY "Cigar band images are publicly viewable"
ON storage.objects FOR SELECT
USING (bucket_id = 'cigar-bands');

CREATE POLICY "Admins can upload cigar band images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'cigar-bands' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update cigar band images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'cigar-bands' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete cigar band images"
ON storage.objects FOR DELETE
USING (bucket_id = 'cigar-bands' AND public.has_role(auth.uid(), 'admin'));

-- Create table to link reference images to cigars
CREATE TABLE public.cigar_band_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cigar_id UUID NOT NULL REFERENCES public.cigars(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  description TEXT,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.cigar_band_images ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Cigar band images are viewable by everyone"
ON public.cigar_band_images FOR SELECT
USING (true);

CREATE POLICY "Admins can manage cigar band images"
ON public.cigar_band_images FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Create index for faster lookups
CREATE INDEX idx_cigar_band_images_cigar_id ON public.cigar_band_images(cigar_id);

-- Ensure only one primary image per cigar
CREATE UNIQUE INDEX idx_cigar_band_images_primary 
ON public.cigar_band_images(cigar_id) 
WHERE is_primary = true;