-- Enhanced database schema for injection and testing features
-- Run this in your Supabase SQL Editor

-- 1. Injection Records Table (enhanced)
DROP TABLE IF EXISTS public.injection_records;
CREATE TABLE public.injection_records (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  email text not null,
  original_position integer not null,
  new_position integer not null,
  injection_cost integer not null,
  performance_gain decimal(5,2) not null,
  status text not null default 'pending', -- 'pending', 'processing', 'completed', 'failed'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  completed_at timestamp with time zone,
  metadata jsonb default '{}'::jsonb
);

-- 2. Test Results Table
CREATE TABLE public.test_results (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  email text not null,
  test_type text not null, -- 'basic', 'advanced', 'premium'
  queue_position integer not null,
  latency integer not null,
  success boolean not null default true,
  test_cost integer not null,
  injection_applied boolean default false,
  injection_id uuid references public.injection_records(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  metadata jsonb default '{}'::jsonb
);

-- 3. Historical Test Views (for 1 credit viewing)
CREATE TABLE public.test_history_views (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  test_id uuid references public.test_results(id) not null,
  viewed_at timestamp with time zone default timezone('utc'::text, now()) not null,
  credit_cost integer default 1
);

-- 4. User Dashboard Stats (materialized view for performance)
CREATE TABLE public.user_stats (
  user_id uuid references auth.users on delete cascade primary key,
  total_tests integer default 0,
  total_injections integer default 0,
  credits_spent integer default 0,
  avg_queue_position decimal(10,2),
  avg_improvement decimal(5,2),
  last_test_at timestamp with time zone,
  last_injection_at timestamp with time zone,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Indexes for performance
CREATE INDEX idx_injection_records_user_date ON public.injection_records(user_id, created_at);
CREATE INDEX idx_test_results_user_date ON public.test_results(user_id, created_at);
CREATE INDEX idx_test_history_views_user ON public.test_history_views(user_id);
CREATE INDEX idx_injection_records_status ON public.injection_records(status);

-- RLS Policies
ALTER TABLE public.injection_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_history_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;

-- User can view their own data
CREATE POLICY "Users can view own injection records" ON public.injection_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view own test results" ON public.test_results FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view own history views" ON public.test_history_views FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own stats" ON public.user_stats FOR SELECT USING (auth.uid() = user_id);

-- Admin policies
CREATE POLICY "Admins can view all injection records" ON public.injection_records FOR ALL USING (is_admin());
CREATE POLICY "Admins can view all test results" ON public.test_results FOR ALL USING (is_admin());
CREATE POLICY "Admins can view all history views" ON public.test_history_views FOR ALL USING (is_admin());
CREATE POLICY "Admins can view all user stats" ON public.user_stats FOR ALL USING (is_admin());

-- Function to update user stats
CREATE OR REPLACE FUNCTION public.update_user_stats(user_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.user_stats (
    user_id,
    total_tests,
    total_injections,
    credits_spent,
    avg_queue_position,
    avg_improvement,
    last_test_at,
    last_injection_at,
    updated_at
  )
  SELECT 
    user_uuid,
    COALESCE(test_stats.total_tests, 0),
    COALESCE(injection_stats.total_injections, 0),
    COALESCE(credit_stats.total_spent, 0),
    COALESCE(test_stats.avg_position, 0),
    COALESCE(injection_stats.avg_improvement, 0),
    test_stats.last_test,
    injection_stats.last_injection,
    now()
  FROM (
    SELECT 
      COUNT(*) as total_tests,
      AVG(queue_position) as avg_position,
      MAX(created_at) as last_test
    FROM public.test_results 
    WHERE user_id = user_uuid
  ) test_stats
  FULL OUTER JOIN (
    SELECT 
      COUNT(*) as total_injections,
      AVG(performance_gain) as avg_improvement,
      MAX(created_at) as last_injection
    FROM public.injection_records 
    WHERE user_id = user_uuid AND status = 'completed'
  ) injection_stats ON true
  FULL OUTER JOIN (
    SELECT 
      COALESCE(SUM(test_cost), 0) + COALESCE(SUM(injection_cost), 0) as total_spent
    FROM (
      SELECT test_cost FROM public.test_results WHERE user_id = user_uuid
      UNION ALL
      SELECT injection_cost FROM public.injection_records WHERE user_id = user_uuid
    ) combined
  ) credit_stats ON true
  ON CONFLICT (user_id) 
  DO UPDATE SET
    total_tests = EXCLUDED.total_tests,
    total_injections = EXCLUDED.total_injections,
    credits_spent = EXCLUDED.credits_spent,
    avg_queue_position = EXCLUDED.avg_queue_position,
    avg_improvement = EXCLUDED.avg_improvement,
    last_test_at = EXCLUDED.last_test_at,
    last_injection_at = EXCLUDED.last_injection_at,
    updated_at = now();
END;
$$;

-- Function to deduct credits with improved error handling
CREATE OR REPLACE FUNCTION public.deduct_credits(
  user_uuid uuid,
  amount integer,
  reason text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_credits integer;
  new_credits integer;
BEGIN
  -- Get current credits with row lock
  SELECT credits INTO current_credits
  FROM public.user_profiles
  WHERE id = user_uuid
  FOR UPDATE;

  -- Check if user exists
  IF current_credits IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not found');
  END IF;

  -- Check sufficient credits
  IF current_credits < amount THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient credits');
  END IF;

  -- Calculate new credits
  new_credits := current_credits - amount;

  -- Update credits
  UPDATE public.user_profiles
  SET credits = new_credits, updated_at = now()
  WHERE id = user_uuid;

  -- Log transaction
  INSERT INTO public.credit_transactions (user_id, amount, type, reason)
  VALUES (user_uuid, -amount, 'debit', reason);

  -- Update user stats
  PERFORM public.update_user_stats(user_uuid);

  RETURN jsonb_build_object(
    'success', true, 
    'previous_credits', current_credits,
    'new_credits', new_credits,
    'amount_deducted', amount
  );
END;
$$;

-- Function to get dashboard stats
CREATE OR REPLACE FUNCTION public.get_dashboard_stats(user_uuid uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  -- Update stats first
  PERFORM public.update_user_stats(user_uuid);
  
  -- Get comprehensive stats
  SELECT jsonb_build_object(
    'total_tests', COALESCE(us.total_tests, 0),
    'total_injections', COALESCE(us.total_injections, 0),
    'credits_spent', COALESCE(us.credits_spent, 0),
    'avg_queue_position', COALESCE(us.avg_queue_position, 0),
    'avg_improvement', COALESCE(us.avg_improvement, 0),
    'last_test_at', us.last_test_at,
    'last_injection_at', us.last_injection_at,
    'current_credits', up.credits,
    'success_rate', COALESCE(
      (SELECT COUNT(*) * 100.0 / NULLIF(COUNT(*), 0) 
       FROM public.test_results 
       WHERE user_id = user_uuid AND success = true), 0
    ),
    'recent_tests', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', id,
          'email', email,
          'test_type', test_type,
          'queue_position', queue_position,
          'success', success,
          'created_at', created_at
        ) ORDER BY created_at DESC
      )
      FROM public.test_results 
      WHERE user_id = user_uuid 
      LIMIT 5
    ),
    'recent_injections', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', id,
          'email', email,
          'original_position', original_position,
          'new_position', new_position,
          'performance_gain', performance_gain,
          'status', status,
          'created_at', created_at
        ) ORDER BY created_at DESC
      )
      FROM public.injection_records 
      WHERE user_id = user_uuid 
      LIMIT 5
    )
  ) INTO result
  FROM public.user_stats us
  RIGHT JOIN public.user_profiles up ON us.user_id = up.id
  WHERE up.id = user_uuid;

  RETURN COALESCE(result, '{}'::jsonb);
END;
$$;

-- Trigger to update stats after test/injection
CREATE OR REPLACE FUNCTION public.trigger_update_user_stats()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM public.update_user_stats(NEW.user_id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_stats_after_test
  AFTER INSERT ON public.test_results
  FOR EACH ROW EXECUTE FUNCTION public.trigger_update_user_stats();

CREATE TRIGGER update_stats_after_injection
  AFTER INSERT OR UPDATE ON public.injection_records
  FOR EACH ROW EXECUTE FUNCTION public.trigger_update_user_stats();
