-- Enhanced Database Schema - Part 3: Security Policies
-- Run this AFTER Part 2

-- Enable RLS on all new tables
ALTER TABLE public.injection_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_history_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;

-- User policies - can view their own data
CREATE POLICY "Users can view own injection records" ON public.injection_records 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own injection records" ON public.injection_records 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own test results" ON public.test_results 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own test results" ON public.test_results 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own history views" ON public.test_history_views 
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own stats" ON public.user_stats 
  FOR SELECT USING (auth.uid() = user_id);

-- Admin policies - can view/manage all data
CREATE POLICY "Admins can view all injection records" ON public.injection_records 
  FOR ALL USING (is_admin());

CREATE POLICY "Admins can view all test results" ON public.test_results 
  FOR ALL USING (is_admin());

CREATE POLICY "Admins can view all history views" ON public.test_history_views 
  FOR ALL USING (is_admin());

CREATE POLICY "Admins can view all user stats" ON public.user_stats 
  FOR ALL USING (is_admin());
