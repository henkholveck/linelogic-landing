-- Enhanced Database Schema - Part 4: Stats Functions
-- Run this AFTER Part 3

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
