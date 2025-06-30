-- Enhanced Database Schema - Part 6: Dashboard Functions  
-- Run this AFTER Part 5

-- Function to get comprehensive dashboard stats
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
