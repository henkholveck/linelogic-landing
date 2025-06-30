-- Enhanced Database Schema - Part 5: Credit Functions
-- Run this AFTER Part 4

-- Enhanced function to deduct credits with improved error handling
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
