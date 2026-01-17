-- Create scrape queue table for tracking URLs to process
CREATE TABLE public.scrape_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source_url TEXT NOT NULL,
  source_name TEXT NOT NULL DEFAULT 'elite_cigar_library',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'duplicate')),
  error_message TEXT,
  cigar_id UUID REFERENCES public.cigars(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE,
  retry_count INTEGER NOT NULL DEFAULT 0,
  UNIQUE(source_url)
);

-- Create scrape_sources table to track data sources
CREATE TABLE public.scrape_sources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  base_url TEXT NOT NULL,
  last_mapped_at TIMESTAMP WITH TIME ZONE,
  total_urls_found INTEGER DEFAULT 0,
  total_processed INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert known sources
INSERT INTO public.scrape_sources (name, base_url) VALUES
  ('elite_cigar_library', 'https://elitecigarlibrary.com'),
  ('famous_smoke', 'https://www.famous-smoke.com'),
  ('cigar_aficionado', 'https://www.cigaraficionado.com'),
  ('halfwheel', 'https://halfwheel.com');

-- Enable RLS
ALTER TABLE public.scrape_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scrape_sources ENABLE ROW LEVEL SECURITY;

-- Admin-only policies
CREATE POLICY "Admins can manage scrape queue" ON public.scrape_queue
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage scrape sources" ON public.scrape_sources
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Create indexes for efficient querying
CREATE INDEX idx_scrape_queue_status ON public.scrape_queue(status);
CREATE INDEX idx_scrape_queue_source ON public.scrape_queue(source_name);
CREATE INDEX idx_scrape_queue_created ON public.scrape_queue(created_at);