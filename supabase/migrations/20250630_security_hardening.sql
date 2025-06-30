-- Security hardening to prevent credit abuse
-- Track signup attempts by IP and implement rate limiting

-- Create signup attempts tracking table
CREATE TABLE public.signup_attempts (
  id uuid default gen_random_uuid() primary key,
  ip_address inet not null,
  email text not null,
  success boolean not null default false,
  user_agent text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create index for IP lookups
CREATE INDEX idx_signup_attempts_ip_created ON public.signup_attempts(ip_address, created_at);
CREATE INDEX idx_signup_attempts_email ON public.signup_attempts(email);

-- Add email_verified column to user_profiles if not exists
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS email_verified boolean DEFAULT false;

-- Update the user profile creation trigger to NOT grant credits immediately
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger as $$
BEGIN
  INSERT INTO public.user_profiles (id, email, name, credits, email_verified)
  VALUES (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    0, -- Start with 0 credits until email verified
    CASE WHEN new.email_confirmed_at IS NOT NULL THEN true ELSE false END
  );
  RETURN new;
END;
$$ language plpgsql security definer;

-- Function to grant welcome credits after email verification
CREATE OR REPLACE FUNCTION public.grant_welcome_credits()
RETURNS trigger as $$
BEGIN
  -- Only grant credits if email was just verified and user has 0 credits
  IF OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL THEN
    UPDATE public.user_profiles 
    SET credits = 10, email_verified = true, updated_at = timezone('utc'::text, now())
    WHERE id = NEW.id AND credits = 0;
    
    -- Log the credit grant
    INSERT INTO public.credit_transactions (user_id, amount, type, reason)
    VALUES (NEW.id, 10, 'credit', 'Welcome bonus - email verified');
  END IF;
  
  RETURN NEW;
END;
$$ language plpgsql security definer;

-- Trigger to grant credits when email is verified
CREATE TRIGGER on_email_verified
  AFTER UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.grant_welcome_credits();

-- Function to check signup rate limits
CREATE OR REPLACE FUNCTION public.check_signup_rate_limit(user_ip inet, user_email text)
RETURNS boolean as $$
DECLARE
  ip_count integer;
  email_count integer;
BEGIN
  -- Check IP-based rate limiting (max 3 signups per IP per 24 hours)
  SELECT COUNT(*) INTO ip_count
  FROM public.signup_attempts
  WHERE ip_address = user_ip
    AND created_at > (now() - interval '24 hours');
    
  -- Check email-based rate limiting (max 1 signup per email per 7 days)
  SELECT COUNT(*) INTO email_count
  FROM public.signup_attempts
  WHERE email = user_email
    AND created_at > (now() - interval '7 days');
    
  -- Return false if limits exceeded
  IF ip_count >= 3 OR email_count >= 1 THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$ language plpgsql security definer;

-- Function to log signup attempts
CREATE OR REPLACE FUNCTION public.log_signup_attempt(
  user_ip inet,
  user_email text,
  is_success boolean,
  user_agent_string text DEFAULT NULL
)
RETURNS void as $$
BEGIN
  INSERT INTO public.signup_attempts (ip_address, email, success, user_agent)
  VALUES (user_ip, user_email, is_success, user_agent_string);
END;
$$ language plpgsql security definer;

-- RLS for signup_attempts (admin only)
ALTER TABLE public.signup_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all signup attempts" ON public.signup_attempts
  FOR SELECT USING (is_admin());

-- Update existing users who might have been created without email verification
UPDATE public.user_profiles 
SET email_verified = true 
WHERE id IN (
  SELECT u.id 
  FROM auth.users u 
  WHERE u.email_confirmed_at IS NOT NULL
);
