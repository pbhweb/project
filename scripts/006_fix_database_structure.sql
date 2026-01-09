-- Fix database structure and add missing columns

-- Add missing columns to projects table
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS expected_hours INTEGER,
ADD COLUMN IF NOT EXISTS client_id UUID;

-- Rename owner_id to client_id if needed
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'owner_id') THEN
    UPDATE public.projects SET client_id = owner_id WHERE client_id IS NULL;
    ALTER TABLE public.projects DROP COLUMN owner_id;
  END IF;
END $$;

-- Make sure client_id references profiles
ALTER TABLE public.projects 
DROP CONSTRAINT IF EXISTS projects_owner_id_fkey,
DROP CONSTRAINT IF EXISTS projects_client_id_fkey;

ALTER TABLE public.projects 
ADD CONSTRAINT projects_client_id_fkey 
FOREIGN KEY (client_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Add reviews/ratings table
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reviewee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, reviewer_id)
);

-- Add notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  link TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for new tables
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for reviews
CREATE POLICY "Anyone can view reviews"
  ON public.reviews FOR SELECT
  USING (true);

CREATE POLICY "Users can create reviews for their projects"
  ON public.reviews FOR INSERT
  WITH CHECK (auth.uid() = reviewer_id);

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Update RLS policies for projects to use client_id
DROP POLICY IF EXISTS "Anyone can view open projects" ON public.projects;
DROP POLICY IF EXISTS "Business owners can create projects" ON public.projects;
DROP POLICY IF EXISTS "Project owners can update their projects" ON public.projects;
DROP POLICY IF EXISTS "Project owners can delete their projects" ON public.projects;

CREATE POLICY "Anyone can view open projects"
  ON public.projects FOR SELECT
  USING (status = 'open' OR client_id = auth.uid());

CREATE POLICY "Business owners can create projects"
  ON public.projects FOR INSERT
  WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Project owners can update their projects"
  ON public.projects FOR UPDATE
  USING (auth.uid() = client_id);

CREATE POLICY "Project owners can delete their projects"
  ON public.projects FOR DELETE
  USING (auth.uid() = client_id);

-- Update bids policy to check both client_id and freelancer_id
DROP POLICY IF EXISTS "Project owners and bid creators can view bids" ON public.bids;

CREATE POLICY "Project owners and bid creators can view bids"
  ON public.bids FOR SELECT
  USING (
    freelancer_id = auth.uid() OR 
    project_id IN (SELECT id FROM public.projects WHERE client_id = auth.uid())
  );

-- Update project owners can accept bids policy
CREATE POLICY "Project owners can update bids"
  ON public.bids FOR UPDATE
  USING (project_id IN (SELECT id FROM public.projects WHERE client_id = auth.uid()));

-- Update transactions RLS policy
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.transactions;

CREATE POLICY "Users can view their own transactions"
  ON public.transactions FOR SELECT
  USING (
    project_id IN (SELECT id FROM public.projects WHERE client_id = auth.uid()) OR
    bid_id IN (SELECT id FROM public.bids WHERE freelancer_id = auth.uid()) OR
    affiliate_id IN (SELECT id FROM public.affiliates WHERE user_id = auth.uid())
  );

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_projects_client ON public.projects(client_id);
CREATE INDEX IF NOT EXISTS idx_reviews_project ON public.reviews(project_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewee ON public.reviews(reviewee_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(user_id, is_read);

-- Function to create notification
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_title TEXT,
  p_message TEXT,
  p_type TEXT,
  p_link TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO public.notifications (user_id, title, message, type, link)
  VALUES (p_user_id, p_title, p_message, p_type, p_link)
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to notify project owner when bid is created
CREATE OR REPLACE FUNCTION notify_on_new_bid()
RETURNS TRIGGER AS $$
DECLARE
  project_owner_id UUID;
  project_title TEXT;
  freelancer_name TEXT;
BEGIN
  SELECT client_id, title INTO project_owner_id, project_title
  FROM public.projects
  WHERE id = NEW.project_id;
  
  SELECT full_name INTO freelancer_name
  FROM public.profiles
  WHERE id = NEW.freelancer_id;
  
  PERFORM create_notification(
    project_owner_id,
    'عرض جديد على مشروعك',
    freelancer_name || ' قدم عرضاً على مشروع: ' || project_title,
    'new_bid',
    '/projects/' || NEW.project_id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_bid_created ON public.bids;
CREATE TRIGGER on_bid_created
  AFTER INSERT ON public.bids
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_new_bid();

-- Trigger to notify freelancer when bid is accepted
CREATE OR REPLACE FUNCTION notify_on_bid_accepted()
RETURNS TRIGGER AS $$
DECLARE
  project_title TEXT;
BEGIN
  IF NEW.status = 'accepted' AND OLD.status != 'accepted' THEN
    SELECT title INTO project_title
    FROM public.projects
    WHERE id = NEW.project_id;
    
    PERFORM create_notification(
      NEW.freelancer_id,
      'تم قبول عرضك',
      'تم قبول عرضك على مشروع: ' || project_title,
      'bid_accepted',
      '/projects/' || NEW.project_id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_bid_status_changed ON public.bids;
CREATE TRIGGER on_bid_status_changed
  AFTER UPDATE ON public.bids
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_bid_accepted();

-- Function to complete project and calculate commissions
CREATE OR REPLACE FUNCTION complete_project(p_project_id UUID, p_bid_id UUID)
RETURNS VOID AS $$
DECLARE
  project_budget NUMERIC;
  affiliate_ref_id UUID;
  commission_amount NUMERIC;
BEGIN
  -- Update project status
  UPDATE public.projects 
  SET status = 'completed', updated_at = NOW()
  WHERE id = p_project_id;
  
  -- Get project details
  SELECT budget_min, affiliate_referral_id INTO project_budget, affiliate_ref_id
  FROM public.projects
  WHERE id = p_project_id;
  
  -- Create transaction for freelancer
  INSERT INTO public.transactions (project_id, bid_id, amount, transaction_type, status)
  VALUES (p_project_id, p_bid_id, project_budget, 'project_payment', 'completed');
  
  -- If affiliate referral exists, calculate commission
  IF affiliate_ref_id IS NOT NULL THEN
    commission_amount := project_budget * 0.10; -- 10% commission
    
    -- Create commission transaction
    INSERT INTO public.transactions (project_id, affiliate_id, amount, commission_amount, transaction_type, status)
    VALUES (p_project_id, affiliate_ref_id, commission_amount, commission_amount, 'affiliate_commission', 'completed');
    
    -- Update affiliate stats
    UPDATE public.affiliates
    SET total_earnings = total_earnings + commission_amount
    WHERE id = affiliate_ref_id;
    
    -- Update referral status
    UPDATE public.affiliate_referrals
    SET status = 'completed'
    WHERE project_id = p_project_id AND affiliate_id = affiliate_ref_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
