-- Add sitemap_url column to scrape_sources
ALTER TABLE public.scrape_sources ADD COLUMN IF NOT EXISTS sitemap_url TEXT;
ALTER TABLE public.scrape_sources ADD COLUMN IF NOT EXISTS url_pattern TEXT;

-- Update sources with known sitemaps
UPDATE public.scrape_sources SET 
  sitemap_url = 'https://www.cigarsinternational.com/sitemap.xml',
  url_pattern = '/p/',
  is_active = true
WHERE name = 'cigars_international';

UPDATE public.scrape_sources SET 
  sitemap_url = 'https://www.famous-smoke.com/sitemap.xml',
  url_pattern = '/cigars/',
  is_active = true
WHERE name = 'famous_smoke';

UPDATE public.scrape_sources SET 
  sitemap_url = 'https://www.thompsoncigar.com/sitemap.xml',
  url_pattern = '/product/',
  is_active = true
WHERE name = 'thompson_cigar';

UPDATE public.scrape_sources SET 
  sitemap_url = 'https://www.neptunecigar.com/sitemap.xml',
  url_pattern = '/cigars/',
  is_active = true
WHERE name = 'famous_smoke';

-- Add Neptune Cigar as a new source (reliable sitemap)
INSERT INTO public.scrape_sources (name, base_url, sitemap_url, url_pattern, is_active) VALUES
  ('neptune_cigar', 'https://www.neptunecigar.com', 'https://www.neptunecigar.com/sitemap.xml', '/cigars/', true),
  ('jrcigars', 'https://www.jrcigars.com', 'https://www.jrcigars.com/sitemap.xml', '/item/', true)
ON CONFLICT (name) DO UPDATE SET 
  sitemap_url = EXCLUDED.sitemap_url,
  url_pattern = EXCLUDED.url_pattern,
  is_active = true;

-- Disable sources without good sitemaps for now
UPDATE public.scrape_sources SET is_active = false 
WHERE name IN ('wikipedia_brands', 'cigar_geeks', 'elite_cigar_library', 'cigar_aficionado', 'halfwheel');