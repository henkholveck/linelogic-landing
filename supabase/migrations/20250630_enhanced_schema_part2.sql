-- Enhanced Database Schema - Part 2: Stats & Indexes
-- Run this AFTER Part 1

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

-- Performance Indexes
CREATE INDEX idx_injection_records_user_date ON public.injection_records(user_id, created_at);
CREATE INDEX idx_test_results_user_date ON public.test_results(user_id, created_at);
CREATE INDEX idx_test_history_views_user ON public.test_history_views(user_id);
CREATE INDEX idx_injection_records_status ON public.injection_records(status);
CREATE INDEX idx_test_results_success ON public.test_results(user_id, success);
CREATE INDEX idx_user_stats_updated ON public.user_stats(updated_at);
