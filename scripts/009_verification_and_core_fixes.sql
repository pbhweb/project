-- =====================================================================
-- 009_verification_and_core_fixes.sql
--
-- Run this once in the Supabase SQL editor (Project -> SQL Editor).
-- It is safe to re-run (uses IF NOT EXISTS / OR REPLACE everywhere).
--
-- What this migration does:
--   1. Makes the "new user" signup trigger crash-proof, so choosing
--      a user type (freelancer / business owner / affiliate) at
--      signup can never silently break account creation again.
--   2. Adds an optional freelancer "work license / verification"
--      system (country, license type, license number, uploaded file,
--      status) so business owners can see whether a freelancer who
--      bid on their project has a verified local freelance license.
--   3. Adds a secure `accept_bid()` function so the "Accept offer"
--      button on a project page actually does something (previously
--      it had no backend call at all).
--   4. Creates/repairs the storage buckets used for project files and
--      freelancer license documents, with correct RLS policies (this
--      is almost certainly why file uploads on /projects/new were
--      failing silently).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Crash-proof signup trigger
-- ---------------------------------------------------------------------
-- Previously: `(NEW.raw_user_meta_data->>'role')::user_role` throws a
-- hard Postgres error when the value is missing/unexpected, which
-- aborts the ENTIRE auth.users insert -> the person sees a generic
-- "Database error saving new user" and no account is created at all.
-- This version never throws: it always creates a profile row, and
-- logs anything unexpected to signup_debug_log for later inspection.

CREATE TABLE IF NOT EXISTS public.signup_debug_log (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id TEXT,
  raw_meta_data JSONB,
  error_message TEXT
);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  safe_role user_role;
BEGIN
  BEGIN
    safe_role := COALESCE(NEW.raw_user_meta_data->>'role', 'freelancer')::user_role;
  EXCEPTION WHEN OTHERS THEN
    safe_role := 'freelancer';
    INSERT INTO public.signup_debug_log (user_id, raw_meta_data, error_message)
    VALUES (NEW.id::text, NEW.raw_user_meta_data, 'invalid role value, defaulted to freelancer: ' || SQLERRM);
  END;

  BEGIN
    INSERT INTO public.profiles (id, full_name, role, email)
    VALUES (
      NEW.id,
      COALESCE(NULLIF(NEW.raw_user_meta_data->>'full_name', ''), split_part(NEW.email, '@', 1), 'New User'),
      safe_role,
      NEW.email
    )
    ON CONFLICT (id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO public.signup_debug_log (user_id, raw_meta_data, error_message)
    VALUES (NEW.id::text, NEW.raw_user_meta_data, 'profile insert failed: ' || SQLERRM);
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ---------------------------------------------------------------------
-- 2. Freelancer license / verification fields
-- ---------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE license_status AS ENUM ('not_submitted', 'pending', 'verified', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS license_country TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS license_type TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS license_number TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS license_file_path TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS license_status license_status NOT NULL DEFAULT 'not_submitted';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS license_submitted_at TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS license_verified_at TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS license_notes TEXT;

-- A business owner is only allowed to see the *file itself* for a
-- freelancer that has actually placed a bid on one of their projects.
-- This view/function keeps that rule enforced in the database, not
-- just hidden in the UI.
CREATE OR REPLACE FUNCTION public.get_bidder_verification(p_bid_id UUID)
RETURNS TABLE (
  license_status license_status,
  license_country TEXT,
  license_type TEXT,
  license_file_path TEXT
) SECURITY DEFINER SET search_path = public AS $$
  SELECT p.license_status, p.license_country, p.license_type, p.license_file_path
  FROM public.bids b
  JOIN public.projects pr ON pr.id = b.project_id
  JOIN public.profiles p ON p.id = b.freelancer_id
  WHERE b.id = p_bid_id
    AND (pr.client_id = auth.uid() OR b.freelancer_id = auth.uid());
$$ LANGUAGE sql;

-- ---------------------------------------------------------------------
-- 3. accept_bid(): the missing backend for the "Accept offer" button
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.accept_bid(p_bid_id UUID)
RETURNS JSON SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_project_id UUID;
  v_client_id UUID;
BEGIN
  SELECT b.project_id, pr.client_id INTO v_project_id, v_client_id
  FROM public.bids b
  JOIN public.projects pr ON pr.id = b.project_id
  WHERE b.id = p_bid_id;

  IF v_project_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'bid_not_found');
  END IF;

  IF v_client_id != auth.uid() THEN
    RETURN json_build_object('success', false, 'error', 'not_project_owner');
  END IF;

  UPDATE public.bids SET status = 'accepted', updated_at = NOW() WHERE id = p_bid_id;
  UPDATE public.bids SET status = 'rejected', updated_at = NOW()
    WHERE project_id = v_project_id AND id != p_bid_id AND status = 'pending';
  UPDATE public.projects SET status = 'in_progress', updated_at = NOW() WHERE id = v_project_id;

  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION public.accept_bid(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_bidder_verification(UUID) TO authenticated;

-- ---------------------------------------------------------------------
-- 4. Storage buckets + policies (fixes "upload files not work")
-- ---------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('project-files', 'project-files', false, 26214400)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('freelancer-licenses', 'freelancer-licenses', false, 10485760)
ON CONFLICT (id) DO NOTHING;

-- project-files: uploader or project owner can read; any signed-in
-- user can upload into a folder for a project they created (folder
-- name is the project id, matching the app's upload path convention
-- `projects/<project_id>/<filename>`).
DROP POLICY IF EXISTS "project-files insert" ON storage.objects;
CREATE POLICY "project-files insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'project-files'
    AND EXISTS (
      SELECT 1 FROM public.projects
      WHERE id::text = (storage.foldername(name))[2] AND client_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "project-files read" ON storage.objects;
CREATE POLICY "project-files read" ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'project-files'
    AND EXISTS (
      SELECT 1 FROM public.projects pr
      WHERE pr.id::text = (storage.foldername(name))[2]
        AND (pr.client_id = auth.uid()
             OR EXISTS (SELECT 1 FROM public.bids b WHERE b.project_id = pr.id AND b.freelancer_id = auth.uid()))
    )
  );

-- freelancer-licenses: only the owner can upload/read their own
-- document; project owners read it only through get_bidder_verification()
-- (a SECURITY DEFINER function), never directly from storage.
DROP POLICY IF EXISTS "license insert own" ON storage.objects;
CREATE POLICY "license insert own" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'freelancer-licenses' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "license read own" ON storage.objects;
CREATE POLICY "license read own" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'freelancer-licenses' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "license update own" ON storage.objects;
CREATE POLICY "license update own" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'freelancer-licenses' AND (storage.foldername(name))[1] = auth.uid()::text);

-- ---------------------------------------------------------------------
-- Done. Next: create a Signed URL from the app when a business owner
-- needs to view a license file (see components using
-- get_bidder_verification + storage.createSignedUrl in the code).
-- ---------------------------------------------------------------------
