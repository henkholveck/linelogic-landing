-- Admin policies for LineLogic admin panel
-- These policies allow specific admin emails to access all user data

-- Admin emails that should have full access
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

-- Admin policies for user_profiles
CREATE POLICY "Admins can view all user profiles" ON public.user_profiles
  FOR SELECT USING (is_admin());

CREATE POLICY "Admins can update all user profiles" ON public.user_profiles
  FOR UPDATE USING (is_admin());

-- Admin policies for analysis_results  
CREATE POLICY "Admins can view all analysis results" ON public.analysis_results
  FOR SELECT USING (is_admin());

-- Admin policies for injection_records
CREATE POLICY "Admins can view all injection records" ON public.injection_records
  FOR SELECT USING (is_admin());

-- Admin policies for payment_receipts
CREATE POLICY "Admins can view all payment receipts" ON public.payment_receipts
  FOR SELECT USING (is_admin());

CREATE POLICY "Admins can update all payment receipts" ON public.payment_receipts
  FOR UPDATE USING (is_admin());

-- Admin policies for credit_transactions
CREATE POLICY "Admins can view all credit transactions" ON public.credit_transactions
  FOR SELECT USING (is_admin());

CREATE POLICY "Admins can insert credit transactions" ON public.credit_transactions
  FOR INSERT WITH CHECK (is_admin());
