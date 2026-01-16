
-- Create trigger function to auto-add approved cigars
CREATE OR REPLACE FUNCTION public.handle_approved_cigar_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only run when status changes to 'approved'
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    INSERT INTO public.cigars (brand, line, vitola, origin, wrapper, strength_profile, size)
    VALUES (
      split_part(NEW.requested_name, ' ', 1), -- Extract brand (first word)
      NEW.requested_name, -- Full name as line
      COALESCE(NEW.vitola, 'Unknown'),
      NEW.origin,
      NEW.wrapper,
      NEW.strength_profile,
      NEW.size
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger on cigar_requests
DROP TRIGGER IF EXISTS on_cigar_request_approved ON public.cigar_requests;
CREATE TRIGGER on_cigar_request_approved
  AFTER UPDATE ON public.cigar_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_approved_cigar_request();

-- Add the two already-approved cigars to the database
INSERT INTO public.cigars (brand, line, vitola, origin, wrapper, strength_profile)
VALUES 
  ('Plasencia', 'Plasencia Reserva Original', 'Petit Corona', 'Nicaragua', 'Natural', 'Mild-Medium'),
  ('My Father', 'My Father Blau MRXXV', 'Toro', NULL, 'Maduro', NULL);
