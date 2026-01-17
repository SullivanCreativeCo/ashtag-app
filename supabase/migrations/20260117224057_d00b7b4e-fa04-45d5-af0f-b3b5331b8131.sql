-- Enable pg_net extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Create a function to notify admin on new user signup
CREATE OR REPLACE FUNCTION public.notify_admin_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  supabase_url TEXT;
  service_role_key TEXT;
BEGIN
  -- Get the Supabase URL and service role key from vault or environment
  supabase_url := current_setting('app.settings.supabase_url', true);
  service_role_key := current_setting('app.settings.service_role_key', true);
  
  -- If settings aren't available, use the project URL directly
  IF supabase_url IS NULL THEN
    supabase_url := 'https://jxulfosxcpjtqsoerdgg.supabase.co';
  END IF;

  -- Call the edge function using pg_net
  PERFORM extensions.http_post(
    url := supabase_url || '/functions/v1/send-admin-notification',
    body := jsonb_build_object(
      'type', 'new_user_signup',
      'data', jsonb_build_object(
        'display_name', NEW.display_name,
        'created_at', NEW.created_at
      )
    ),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_role_key
    )
  );

  RETURN NEW;
END;
$$;

-- Create trigger on profiles table for new user signups
DROP TRIGGER IF EXISTS on_profile_created_notify_admin ON public.profiles;
CREATE TRIGGER on_profile_created_notify_admin
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admin_new_user();