-- Updated function with explicit role and better error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  current_role TEXT;
BEGIN
  -- Get current role for debugging
  SELECT current_user INTO current_role;
  
  -- Log the attempt
  RAISE LOG 'handle_new_user called: user_id=%, email=%, role=%', NEW.id, NEW.email, current_role;
  
  -- Perform the insert without RLS by setting local role
  PERFORM set_config('role', 'postgres', true);
  
  INSERT INTO public.user_profiles (id, email, name, credits, email_verified)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    10, -- New user bonus credits
    NEW.email_confirmed_at IS NOT NULL
  );
  
  RAISE LOG 'handle_new_user success: profile created for %', NEW.email;
  
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    RAISE LOG 'handle_new_user ERROR: % - %', SQLSTATE, SQLERRM;
    RAISE;
END;
$function$;
