-- Enable the pg_net extension for HTTP requests from triggers
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Create function to notify admin on new cigar request
CREATE OR REPLACE FUNCTION public.notify_new_cigar_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_email TEXT;
BEGIN
  -- Get the user's email from auth.users
  SELECT email INTO user_email FROM auth.users WHERE id = NEW.user_id;
  
  -- Send notification via edge function
  PERFORM net.http_post(
    url := 'https://jxulfosxcpjtqsoerdgg.supabase.co/functions/v1/send-admin-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4dWxmb3N4Y3BqdHFzb2VyZGdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcyODMxNzQsImV4cCI6MjA4Mjg1OTE3NH0.b-I_dh8E1y3D1Utc28uBpsVR-gfm82yjiGG5akVf7WQ'
    ),
    body := jsonb_build_object(
      'type', 'new_cigar_request',
      'data', jsonb_build_object(
        'requested_name', NEW.requested_name,
        'user_email', user_email,
        'details', NEW.details,
        'vitola', NEW.vitola,
        'wrapper', NEW.wrapper,
        'origin', NEW.origin
      )
    )
  );
  
  RETURN NEW;
END;
$$;

-- Create function to notify admin on new user signup
CREATE OR REPLACE FUNCTION public.notify_new_user_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_email TEXT;
BEGIN
  -- Get the user's email from auth.users
  SELECT email INTO user_email FROM auth.users WHERE id = NEW.id;
  
  -- Send notification via edge function
  PERFORM net.http_post(
    url := 'https://jxulfosxcpjtqsoerdgg.supabase.co/functions/v1/send-admin-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4dWxmb3N4Y3BqdHFzb2VyZGdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcyODMxNzQsImV4cCI6MjA4Mjg1OTE3NH0.b-I_dh8E1y3D1Utc28uBpsVR-gfm82yjiGG5akVf7WQ'
    ),
    body := jsonb_build_object(
      'type', 'new_user_signup',
      'data', jsonb_build_object(
        'email', user_email,
        'display_name', NEW.display_name,
        'created_at', NEW.created_at
      )
    )
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger for new cigar requests
DROP TRIGGER IF EXISTS on_cigar_request_created ON public.cigar_requests;
CREATE TRIGGER on_cigar_request_created
  AFTER INSERT ON public.cigar_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_cigar_request();

-- Create trigger for new user signups (fires when profile is created)
DROP TRIGGER IF EXISTS on_profile_created ON public.profiles;
CREATE TRIGGER on_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_user_signup();