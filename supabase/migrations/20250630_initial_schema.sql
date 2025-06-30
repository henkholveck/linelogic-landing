-- Enable Row Level Security
alter table auth.users enable row level security;

-- Create user_profiles table
create table public.user_profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  name text not null,
  credits integer not null default 10,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create analysis_results table
create table public.analysis_results (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  email text not null,
  analysis_data jsonb not null,
  credits_used integer not null default 5,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create injection_records table
create table public.injection_records (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  accounts jsonb not null,
  total_price decimal(10,2) not null,
  payment_method text not null,
  status text not null default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  completed_at timestamp with time zone
);

-- Create payment_receipts table
create table public.payment_receipts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  payment_type text not null,
  service_type text not null,
  amount decimal(10,2) not null,
  receipt_id text not null,
  status text not null default 'pending_verification',
  verified_by text,
  verified_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create credit_transactions table for audit log
create table public.credit_transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  amount integer not null,
  type text not null, -- 'debit', 'credit'
  reason text not null, -- 'analysis', 'purchase', 'admin_adjustment'
  admin_email text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up Row Level Security (RLS)
alter table public.user_profiles enable row level security;
alter table public.analysis_results enable row level security;
alter table public.injection_records enable row level security;
alter table public.payment_receipts enable row level security;
alter table public.credit_transactions enable row level security;

-- RLS Policies for user_profiles
create policy "Users can view their own profile" on public.user_profiles
  for select using (auth.uid() = id);

create policy "Users can update their own profile" on public.user_profiles
  for update using (auth.uid() = id);

-- RLS Policies for analysis_results
create policy "Users can view their own analysis results" on public.analysis_results
  for select using (auth.uid() = user_id);

create policy "Users can insert their own analysis results" on public.analysis_results
  for insert with check (auth.uid() = user_id);

-- RLS Policies for injection_records
create policy "Users can view their own injection records" on public.injection_records
  for select using (auth.uid() = user_id);

create policy "Users can insert their own injection records" on public.injection_records
  for insert with check (auth.uid() = user_id);

-- RLS Policies for payment_receipts
create policy "Users can view their own payment receipts" on public.payment_receipts
  for select using (auth.uid() = user_id);

create policy "Users can insert their own payment receipts" on public.payment_receipts
  for insert with check (auth.uid() = user_id);

-- RLS Policies for credit_transactions
create policy "Users can view their own credit transactions" on public.credit_transactions
  for select using (auth.uid() = user_id);

-- Function to automatically create user profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.user_profiles (id, email, name, credits)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce((new.raw_user_meta_data->>'credits')::integer, 10)
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to create profile on user signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Function to update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Trigger for updated_at on user_profiles
create trigger handle_updated_at
  before update on public.user_profiles
  for each row execute procedure public.handle_updated_at();
