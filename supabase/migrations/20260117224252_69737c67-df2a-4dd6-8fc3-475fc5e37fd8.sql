-- Drop the function with cascade to remove trigger too
DROP FUNCTION IF EXISTS public.notify_admin_new_user() CASCADE;

-- Create the proper trigger using the existing notify_new_user_signup function
CREATE TRIGGER on_new_user_signup_notify
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_user_signup();