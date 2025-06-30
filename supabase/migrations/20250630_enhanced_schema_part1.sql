-- Enhanced Database Schema - Part 1: Core Tables
-- Run this in your Supabase SQL Editor

-- 1. Enhanced Injection Records Table
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
