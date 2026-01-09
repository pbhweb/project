-- Add expected_hours and reviews to projects table
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS expected_hours INTEGER,
ADD COLUMN IF NOT EXISTS skills_required TEXT[];

-- Create reviews table
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reviewed_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, reviewer_id)
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL, -- 'bid_received', 'bid_accepted', 'bid_rejected', 'review_received'
  related_id UUID,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for reviews
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies for reviews
CREATE POLICY "Anyone can view reviews"
  ON public.reviews FOR SELECT
  USING (true);

CREATE POLICY "Project owners can create reviews"
  ON public.reviews FOR INSERT
  WITH CHECK (auth.uid() = reviewer_id);

CREATE POLICY "Reviewers can update their own reviews"
  ON public.reviews FOR UPDATE
  USING (auth.uid() = reviewer_id);

-- Enable RLS for notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_reviews_project ON public.reviews(project_id);
CREATE INDEX idx_reviews_reviewed_user ON public.reviews(reviewed_user_id);
CREATE INDEX idx_notifications_user ON public.notifications(user_id);
CREATE INDEX idx_notifications_read ON public.notifications(is_read);

-- Function to create notification
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_title TEXT,
  p_message TEXT,
  p_type TEXT,
  p_related_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO public.notifications (user_id, title, message, type, related_id)
  VALUES (p_user_id, p_title, p_message, p_type, p_related_id)
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle bid acceptance
CREATE OR REPLACE FUNCTION accept_bid(p_bid_id UUID, p_project_id UUID)
RETURNS VOID AS $$
DECLARE
  v_freelancer_id UUID;
  v_project_owner UUID;
  v_amount NUMERIC;
BEGIN
  -- Get bid details
  SELECT freelancer_id, amount INTO v_freelancer_id, v_amount
  FROM public.bids
  WHERE id = p_bid_id;
  
  -- Get project owner
  SELECT owner_id INTO v_project_owner
  FROM public.projects
  WHERE id = p_project_id;
  
  -- Update bid status to accepted
  UPDATE public.bids
  SET status = 'accepted', updated_at = NOW()
  WHERE id = p_bid_id;
  
  -- Reject all other bids for this project
  UPDATE public.bids
  SET status = 'rejected', updated_at = NOW()
  WHERE project_id = p_project_id AND id != p_bid_id;
  
  -- Update project status
  UPDATE public.projects
  SET status = 'in_progress', updated_at = NOW()
  WHERE id = p_project_id;
  
  -- Create notification for freelancer
  PERFORM create_notification(
    v_freelancer_id,
    'تم قبول عرضك!',
    'تهانينا! تم قبول عرضك على المشروع.',
    'bid_accepted',
    p_bid_id
  );
  
  -- Create transaction record
  INSERT INTO public.transactions (
    project_id,
    bid_id,
    amount,
    transaction_type,
    status
  ) VALUES (
    p_project_id,
    p_bid_id,
    v_amount,
    'project_payment',
    'pending'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle project completion and affiliate commission
CREATE OR REPLACE FUNCTION complete_project(p_project_id UUID)
RETURNS VOID AS $$
DECLARE
  v_affiliate_id UUID;
  v_project_amount NUMERIC;
  v_commission NUMERIC;
  v_commission_rate NUMERIC;
BEGIN
  -- Get project details
  SELECT p.affiliate_referral_id, b.amount 
  INTO v_affiliate_id, v_project_amount
  FROM public.projects p
  LEFT JOIN public.bids b ON b.project_id = p.id AND b.status = 'accepted'
  WHERE p.id = p_project_id;
  
  -- Update project status
  UPDATE public.projects
  SET status = 'completed', updated_at = NOW()
  WHERE id = p_project_id;
  
  -- If there's an affiliate, calculate and record commission
  IF v_affiliate_id IS NOT NULL AND v_project_amount IS NOT NULL THEN
    -- Get commission rate
    SELECT commission_rate INTO v_commission_rate
    FROM public.affiliates
    WHERE id = v_affiliate_id;
    
    -- Calculate commission (10%)
    v_commission := v_project_amount * (v_commission_rate / 100);
    
    -- Update affiliate earnings
    UPDATE public.affiliates
    SET total_earnings = total_earnings + v_commission,
        updated_at = NOW()
    WHERE id = v_affiliate_id;
    
    -- Update referral status
    UPDATE public.affiliate_referrals
    SET status = 'completed'
    WHERE affiliate_id = v_affiliate_id AND project_id = p_project_id;
    
    -- Create commission transaction
    INSERT INTO public.transactions (
      project_id,
      affiliate_id,
      amount,
      commission_amount,
      transaction_type,
      status
    ) VALUES (
      p_project_id,
      v_affiliate_id,
      v_project_amount,
      v_commission,
      'affiliate_commission',
      'completed'
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check for contact info in text
CREATE OR REPLACE FUNCTION contains_contact_info(text_content TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check for phone numbers, emails, or social media handles
  RETURN text_content ~* '(\d{10,}|@[\w]+|[\w\.-]+@[\w\.-]+\.\w+|whatsapp|telegram|facebook|instagram|twitter|linkedin)';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add constraint to prevent contact info in project descriptions
ALTER TABLE public.projects 
DROP CONSTRAINT IF EXISTS check_no_contact_in_description;

ALTER TABLE public.projects 
ADD CONSTRAINT check_no_contact_in_description 
CHECK (NOT contains_contact_info(description));

-- Add constraint to prevent contact info in bid proposals
ALTER TABLE public.bids 
DROP CONSTRAINT IF EXISTS check_no_contact_in_proposal;

ALTER TABLE public.bids 
ADD CONSTRAINT check_no_contact_in_proposal 
CHECK (NOT contains_contact_info(proposal));
