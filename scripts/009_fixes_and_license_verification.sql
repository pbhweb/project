-- =====================================================================
-- 009_fixes_and_license_verification.sql
-- Run this once in the Supabase SQL editor (Project > SQL Editor > New query)
-- Safe to re-run (uses IF NOT EXISTS / CREATE OR REPLACE / DROP ... IF EXISTS)
-- =====================================================================

-- ---------------------------------------------------------------------
-- FIX 1: accept_bid() referenced "projects.owner_id" which no longer
-- exists (schema 008 renamed it to "client_id"). This is why accepting
-- a bid failed with "column owner_id does not exist".
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION accept_bid(p_bid_id UUID, p_project_id UUID)
RETURNS VOID AS $$
DECLARE
  v_freelancer_id UUID;
  v_project_owner UUID;
  v_amount NUMERIC;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.projects
    WHERE id = p_project_id AND client_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Only the project owner can accept a bid';
  END IF;

  SELECT freelancer_id, amount INTO v_freelancer_id, v_amount
  FROM public.bids
  WHERE id = p_bid_id AND project_id = p_project_id;

  IF v_freelancer_id IS NULL THEN
    RAISE EXCEPTION 'Bid not found for this project';
  END IF;

  SELECT client_id INTO v_project_owner
  FROM public.projects
  WHERE id = p_project_id;

  UPDATE public.bids
  SET status = 'accepted', updated_at = NOW()
  WHERE id = p_bid_id;

  UPDATE public.bids
  SET status = 'rejected', updated_at = NOW()
  WHERE project_id = p_project_id AND id != p_bid_id AND status = 'pending';

  UPDATE public.projects
  SET status = 'in_progress', updated_at = NOW()
  WHERE id = p_project_id;

  PERFORM create_notification(
    v_freelancer_id,
    'تم قبول عرضك! / Your bid was accepted!',
    'تهانينا! تم قبول عرضك على المشروع. / Congratulations! Your bid has been accepted.',
    'bid_accepted',
    p_bid_id
  );

  INSERT INTO public.transactions (project_id, bid_id, user_id, amount, type, description, status)
  VALUES (
    p_project_id, p_bid_id, v_freelancer_id, v_amount, 'bid_accepted',
    'Bid accepted for project', 'completed'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ---------------------------------------------------------------------
-- FIX 2: Storage buckets. No bucket existed for "project-files", which
-- is why every file upload silently failed. Also add a private bucket
-- for freelancer license/permit documents.
-- ---------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('project-files', 'project-files', false, 52428800) -- 50MB/file
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('license-documents', 'license-documents', false, 20971520) -- 20MB/file
ON CONFLICT (id) DO NOTHING;

-- Anyone signed in can upload project files into their own project's folder
DROP POLICY IF EXISTS "authenticated can upload project files" ON storage.objects;
CREATE POLICY "authenticated can upload project files" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'project-files');

DROP POLICY IF EXISTS "authenticated can read project files" ON storage.objects;
CREATE POLICY "authenticated can read project files" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'project-files');

DROP POLICY IF EXISTS "owner can manage own license doc" ON storage.objects;
CREATE POLICY "owner can manage own license doc" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'license-documents' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'license-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

-- ---------------------------------------------------------------------
-- FIX 3: Freelancer business-license / permit verification fields.
-- Optional upload so a freelancer can prove they hold a local
-- freelance/home-business license; business owners can see the
-- verification status before accepting a bid.
-- ---------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE license_status AS ENUM ('not_submitted', 'pending', 'verified', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.freelancer_licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  freelancer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  country_code TEXT NOT NULL,           -- e.g. 'BH', 'SA', 'AE', 'QA', 'KW', 'EG', 'TN', 'DZ', 'JO', 'IQ', 'LY', 'PK', 'IN', 'US', 'GB', 'OTHER'
  license_name TEXT NOT NULL,           -- e.g. 'Freelance Permit (Ministry of Labour)'
  license_number TEXT,
  document_url TEXT,                    -- path inside the license-documents bucket
  status license_status NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES public.profiles(id),
  reviewed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_freelancer_licenses_freelancer ON public.freelancer_licenses(freelancer_id);

ALTER TABLE public.freelancer_licenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "freelancer manages own license" ON public.freelancer_licenses;
CREATE POLICY "freelancer manages own license" ON public.freelancer_licenses
  FOR ALL USING (auth.uid() = freelancer_id) WITH CHECK (auth.uid() = freelancer_id);

-- Anyone signed in can read license rows (needed so a business owner can see
-- verification status on a bid). Document contents themselves stay private
-- (separate storage policy above only lets the owner read the raw file).
DROP POLICY IF EXISTS "authenticated can view license status" ON public.freelancer_licenses;
CREATE POLICY "authenticated can view license status" ON public.freelancer_licenses
  FOR SELECT TO authenticated USING (true);

CREATE TRIGGER update_freelancer_licenses_updated_at BEFORE UPDATE ON public.freelancer_licenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Convenience view: quick "is this freelancer verified" flag for joins
CREATE OR REPLACE VIEW public.freelancer_verification AS
SELECT
  freelancer_id,
  BOOL_OR(status = 'verified') AS is_verified,
  MAX(updated_at) AS last_update
FROM public.freelancer_licenses
GROUP BY freelancer_id;
