-- Add columns to cigar_requests to store full cigar details for approval
ALTER TABLE public.cigar_requests 
ADD COLUMN IF NOT EXISTS vitola text,
ADD COLUMN IF NOT EXISTS wrapper text,
ADD COLUMN IF NOT EXISTS origin text,
ADD COLUMN IF NOT EXISTS strength_profile text,
ADD COLUMN IF NOT EXISTS size text,
ADD COLUMN IF NOT EXISTS image_url text;

-- Add comment for clarity
COMMENT ON TABLE public.cigar_requests IS 'User-submitted cigars pending admin approval';