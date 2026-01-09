-- Fix increment_affiliate_referrals function
CREATE OR REPLACE FUNCTION increment_affiliate_referrals(affiliate_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.affiliates
  SET total_referrals = total_referrals + 1,
      updated_at = NOW()
  WHERE id = affiliate_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update RLS policy for bid acceptance by project owners
DROP POLICY IF EXISTS "Project owners can update bids" ON public.bids;
CREATE POLICY "Project owners can update bids"
  ON public.bids FOR UPDATE
  USING (
    freelancer_id = auth.uid() OR 
    project_id IN (SELECT id FROM public.projects WHERE owner_id = auth.uid())
  );
