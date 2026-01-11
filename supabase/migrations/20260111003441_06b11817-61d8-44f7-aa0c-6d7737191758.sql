-- Create table to store weekly cigar picks
CREATE TABLE public.weekly_picks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cigar_id uuid NOT NULL REFERENCES public.cigars(id) ON DELETE CASCADE,
  week_start date NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.weekly_picks ENABLE ROW LEVEL SECURITY;

-- Everyone can view the weekly pick
CREATE POLICY "Weekly picks are viewable by everyone"
  ON public.weekly_picks FOR SELECT
  USING (true);

-- Only admins can manage weekly picks (the edge function uses service role)
CREATE POLICY "Admins can manage weekly picks"
  ON public.weekly_picks FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create index for quick lookup by week
CREATE INDEX idx_weekly_picks_week_start ON public.weekly_picks(week_start DESC);