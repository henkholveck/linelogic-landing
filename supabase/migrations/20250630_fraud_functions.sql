-- Advanced fraud detection functions
-- Run this after the schema migration

-- 1. Check if IP is banned
CREATE OR REPLACE FUNCTION public.is_ip_banned(check_ip inet)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.banned_ips 
    WHERE ip_address = check_ip 
    AND (expires_at IS NULL OR expires_at > now())
  );
$$;

-- 2. Normalize email for duplicate detection
CREATE OR REPLACE FUNCTION public.normalize_email(email_input text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  local_part text;
  domain_part text;
  normalized text;
BEGIN
  -- Split email into local and domain parts
  local_part := split_part(email_input, '@', 1);
  domain_part := split_part(email_input, '@', 2);
  
  -- For Gmail, remove dots and plus-addressing
  IF lower(domain_part) = 'gmail.com' THEN
    local_part := replace(split_part(local_part, '+', 1), '.', '');
  END IF;
  
  -- Return normalized email
  normalized := lower(local_part) || '@' || lower(domain_part);
  RETURN normalized;
END;
$$;

-- 3. Fraud name detection
CREATE OR REPLACE FUNCTION public.is_fraud_name(name_input text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  clean_name text;
BEGIN
  -- Clean and normalize the name
  clean_name := lower(trim(name_input));
  
  -- Check for empty or whitespace-only names
  IF clean_name = '' OR clean_name IS NULL THEN
    RETURN true;
  END IF;
  
  -- Check for obvious fraud patterns
  IF clean_name IN (
    'aaa', 'abc', 'test', 'asdf', 'qwerty', 'admin', 'user', 'name',
    'first', 'last', 'firstname', 'lastname', 'dummy', 'fake', 'spam',
    'bot', 'account', 'profile', 'zzzz', 'xxxx', 'aaaa', 'bbbb',
    '123', '1234', '12345', '123456', 'abcd', 'abcde', 'abcdef',
    'temp', 'temporary', 'delete', 'null', 'undefined', 'none'
  ) THEN
    RETURN true;
  END IF;
  
  -- Check for repeated characters (3+ in a row)
  IF clean_name ~ '(.)\1{2,}' THEN
    RETURN true;
  END IF;
  
  -- Check for mostly numbers
  IF clean_name ~ '^[a-z]*[0-9]{4,}[a-z]*$' THEN
    RETURN true;
  END IF;
  
  -- Check for single character repeated
  IF length(clean_name) >= 3 AND clean_name ~ '^(.)\1+$' THEN
    RETURN true;
  END IF;
  
  -- Check for common test patterns
  IF clean_name ~ '^(user|test|account)[0-9]+$' THEN
    RETURN true;
  END IF;
  
  -- Check for keyboard patterns
  IF clean_name IN ('qwertyuiop', 'asdfghjkl', 'zxcvbnm', '1234567890') THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;

-- 4. Domain validation
CREATE OR REPLACE FUNCTION public.is_domain_allowed(email_input text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  domain_part text;
  rule_record RECORD;
BEGIN
  domain_part := lower(split_part(email_input, '@', 2));
  
  -- Check domain rules table
  SELECT * INTO rule_record 
  FROM public.domain_rules 
  WHERE domain = domain_part;
  
  -- If domain is explicitly blacklisted
  IF rule_record.rule_type = 'blacklist' THEN
    RETURN false;
  END IF;
  
  -- If domain is whitelisted
  IF rule_record.rule_type = 'whitelist' THEN
    RETURN true;
  END IF;
  
  -- If domain is suspicious, require manual review
  IF rule_record.rule_type = 'suspicious' THEN
    RETURN false;
  END IF;
  
  -- For unknown domains, only allow if it's Gmail
  IF domain_part = 'gmail.com' THEN
    RETURN true;
  END IF;
  
  -- Block everything else by default
  RETURN false;
END;
$$;

-- 5. Comprehensive fraud scoring
CREATE OR REPLACE FUNCTION public.calculate_fraud_score(
  email_input text,
  name_input text,
  ip_input inet,
  user_agent_input text DEFAULT NULL
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  score integer := 0;
  normalized_email text;
  existing_attempts integer;
BEGIN
  normalized_email := normalize_email(email_input);
  
  -- Fraud name check (instant ban)
  IF is_fraud_name(name_input) THEN
    score := score + 1000; -- Instant ban threshold
  END IF;
  
  -- Domain check
  IF NOT is_domain_allowed(email_input) THEN
    score := score + 500;
  END IF;
  
  -- Check for email aliases/plus addressing
  IF email_input ~ '\+' THEN
    score := score + 300;
  END IF;
  
  -- Check for existing attempts from this IP in last 24 hours
  SELECT COUNT(*) INTO existing_attempts
  FROM public.signup_attempts
  WHERE ip_address = ip_input
    AND created_at > (now() - interval '24 hours');
    
  IF existing_attempts >= 3 THEN
    score := score + 400;
  ELSIF existing_attempts >= 1 THEN
    score := score + 100;
  END IF;
  
  -- Check for existing normalized email
  IF EXISTS (
    SELECT 1 FROM public.signup_attempts 
    WHERE normalized_email = normalize_email(email_input)
  ) THEN
    score := score + 600;
  END IF;
  
  -- Suspicious user agent patterns
  IF user_agent_input IS NULL OR user_agent_input = '' THEN
    score := score + 200;
  ELSIF user_agent_input ~ '(bot|crawler|spider|scraper)' THEN
    score := score + 800;
  END IF;
  
  RETURN score;
END;
$$;

-- 6. Log fraud attempt
CREATE OR REPLACE FUNCTION public.log_fraud_attempt(
  ip_input inet,
  email_input text,
  name_input text,
  user_agent_input text,
  fraud_type_input text,
  severity_input text,
  action_input text,
  metadata_input jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.fraud_attempts (
    ip_address, email, name, user_agent, fraud_type, 
    severity, action_taken, metadata
  ) VALUES (
    ip_input, email_input, name_input, user_agent_input,
    fraud_type_input, severity_input, action_input, metadata_input
  );
END;
$$;

-- 7. Ban IP address
CREATE OR REPLACE FUNCTION public.ban_ip_address(
  ip_input inet,
  reason_input text,
  banned_by_input text DEFAULT 'system'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.banned_ips (ip_address, reason, banned_by)
  VALUES (ip_input, reason_input, banned_by_input)
  ON CONFLICT (ip_address) DO UPDATE SET
    reason = reason_input,
    banned_by = banned_by_input,
    created_at = now();
END;
$$;
