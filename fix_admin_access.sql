-- Run this in your Supabase SQL Editor to fix admin access
-- This will allow your admin emails to see all users in the admin panel

-- Admin function to check if current user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM auth.users 
    WHERE auth.uid() = auth.users.id 
    AND auth.users.email IN ('henkster91@gmail.com', 'monksb92@gmail.com')
  );
$$;

-- Add admin policies for user_profiles
CREATE POLICY "Admins can view all user profiles" ON public.user_profiles
  FOR SELECT USING (is_admin());

CREATE POLICY "Admins can update all user profiles" ON public.user_profiles
  FOR UPDATE USING (is_admin());

-- Add admin policies for payment_receipts
CREATE POLICY "Admins can view all payment receipts" ON public.payment_receipts
  FOR SELECT USING (is_admin());

CREATE POLICY "Admins can update all payment receipts" ON public.payment_receipts
  FOR UPDATE USING (is_admin());

-- Add admin policies for credit_transactions
CREATE POLICY "Admins can view all credit transactions" ON public.credit_transactions
  FOR SELECT USING (is_admin());

CREATE POLICY "Admins can insert credit transactions" ON public.credit_transactions
  FOR INSERT WITH CHECK (is_admin());
