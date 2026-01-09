-- Create function to increment affiliate referrals
CREATE OR REPLACE FUNCTION increment_affiliate_referrals(affiliate_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.affiliates
  SET total_referrals = total_referrals + 1
  WHERE id = affiliate_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
