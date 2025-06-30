-- Advanced fraud prevention and IP banning system
-- Run this in your Supabase SQL Editor

-- 1. IP Ban Management
CREATE TABLE public.banned_ips (
  id uuid default gen_random_uuid() primary key,
  ip_address inet not null unique,
  reason text not null,
  ban_type text not null default 'permanent', -- 'permanent', 'temporary', 'subnet'
  banned_by text, -- admin email or 'system'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  expires_at timestamp with time zone, -- null for permanent bans
  metadata jsonb -- store user agent, geo data, etc.
);

-- 2. Fraud Attempt Logging
CREATE TABLE public.fraud_attempts (
  id uuid default gen_random_uuid() primary key,
  ip_address inet not null,
  email text,
  name text,
  user_agent text,
  fraud_type text not null, -- 'name_fraud', 'email_fraud', 'domain_fraud', 'rate_limit'
  severity text not null default 'high', -- 'low', 'medium', 'high', 'critical'
  action_taken text not null, -- 'blocked', 'banned', 'flagged'
  metadata jsonb, -- geo data, fingerprint, etc.
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Domain Blacklist/Whitelist
CREATE TABLE public.domain_rules (
  id uuid default gen_random_uuid() primary key,
  domain text not null unique,
  rule_type text not null, -- 'whitelist', 'blacklist', 'suspicious'
  category text not null, -- 'disposable', 'business', 'personal', 'catch_all'
  auto_detected boolean default false,
  verified_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Enhanced signup tracking (upgrade existing table)
ALTER TABLE public.signup_attempts ADD COLUMN IF NOT EXISTS fraud_score integer DEFAULT 0;
ALTER TABLE public.signup_attempts ADD COLUMN IF NOT EXISTS device_fingerprint text;
ALTER TABLE public.signup_attempts ADD COLUMN IF NOT EXISTS normalized_email text;
ALTER TABLE public.signup_attempts ADD COLUMN IF NOT EXISTS is_banned boolean DEFAULT false;

-- 5. User risk scoring
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS risk_score integer DEFAULT 0;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS is_credit_eligible boolean DEFAULT false;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS fraud_flags text[];
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS manual_review boolean DEFAULT false;

-- Create indexes for performance
CREATE INDEX idx_banned_ips_address ON public.banned_ips(ip_address);
CREATE INDEX idx_fraud_attempts_ip_time ON public.fraud_attempts(ip_address, created_at);
CREATE INDEX idx_domain_rules_domain ON public.domain_rules(domain);
CREATE INDEX idx_signup_attempts_fingerprint ON public.signup_attempts(device_fingerprint) WHERE device_fingerprint IS NOT NULL;

-- RLS Policies
ALTER TABLE public.banned_ips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fraud_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.domain_rules ENABLE ROW LEVEL SECURITY;

-- Admin-only access
CREATE POLICY "Admins can manage banned IPs" ON public.banned_ips FOR ALL USING (is_admin());
CREATE POLICY "Admins can view fraud attempts" ON public.fraud_attempts FOR SELECT USING (is_admin());
CREATE POLICY "Admins can manage domain rules" ON public.domain_rules FOR ALL USING (is_admin());

-- Pre-populate known bad patterns
INSERT INTO public.domain_rules (domain, rule_type, category) VALUES
('10minutemail.com', 'blacklist', 'disposable'),
('mailinator.com', 'blacklist', 'disposable'),
('guerrillamail.com', 'blacklist', 'disposable'),
('tempmail.org', 'blacklist', 'disposable'),
('yopmail.com', 'blacklist', 'disposable'),
('gmail.com', 'whitelist', 'personal'),
('google.com', 'whitelist', 'business'),
('microsoft.com', 'whitelist', 'business'),
('apple.com', 'whitelist', 'business'),
('yahoo.com', 'blacklist', 'personal'),
('outlook.com', 'blacklist', 'personal'),
('hotmail.com', 'blacklist', 'personal'),
('aol.com', 'blacklist', 'personal');
