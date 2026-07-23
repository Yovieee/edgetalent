-- Migration to support public certificate verification with 8-digit NanoIDs

-- 1. Add credential_id column to course_enrollments
ALTER TABLE public.course_enrollments 
ADD COLUMN IF NOT EXISTS credential_id TEXT UNIQUE;

-- 2. Backfill existing completed course_enrollments with 8-character NanoIDs if null
UPDATE public.course_enrollments
SET credential_id = UPPER(SUBSTRING(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT), 1, 8))
WHERE credential_id IS NULL AND completed_at IS NOT NULL;

-- 3. Backfill existing talent_certificates with 8-character NanoIDs if null
UPDATE public.talent_certificates
SET credential_id = UPPER(SUBSTRING(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT), 1, 8))
WHERE credential_id IS NULL;

-- 4. Create public.verify_certificate stored procedure (SECURITY DEFINER allows unauthenticated public queries)
CREATE OR REPLACE FUNCTION public.verify_certificate(p_credential_id TEXT)
RETURNS TABLE (
  cert_type TEXT,
  id UUID,
  credential_id TEXT,
  title TEXT,
  recipient_name TEXT,
  issuing_organization TEXT,
  issue_date TIMESTAMPTZ,
  expiration_date DATE,
  skills TEXT[],
  credential_url TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    'platform'::TEXT AS cert_type,
    ce.id AS id,
    ce.credential_id AS credential_id,
    c.title AS title,
    p.full_name AS recipient_name,
    COALESCE(c.provider, 'EdgeTalent Academy')::TEXT AS issuing_organization,
    ce.completed_at AS issue_date,
    NULL::DATE AS expiration_date,
    c.skills_taught AS skills,
    NULL::TEXT AS credential_url
  FROM public.course_enrollments ce
  JOIN public.courses c ON c.id = ce.course_id
  JOIN public.profiles p ON p.id = ce.user_id
  WHERE ce.completed_at IS NOT NULL 
    AND (
      UPPER(ce.credential_id) = UPPER(p_credential_id) 
      OR UPPER(ce.id::text) LIKE UPPER(p_credential_id) || '%'
    )

  UNION ALL

  SELECT 
    'external'::TEXT AS cert_type,
    tc.id AS id,
    tc.credential_id AS credential_id,
    tc.name AS title,
    p.full_name AS recipient_name,
    tc.issuing_organization AS issuing_organization,
    tc.issue_date::TIMESTAMPTZ AS issue_date,
    tc.expiration_date AS expiration_date,
    ARRAY[]::TEXT[] AS skills,
    tc.credential_url AS credential_url
  FROM public.talent_certificates tc
  JOIN public.profiles p ON p.id = tc.user_id
  WHERE UPPER(tc.credential_id) = UPPER(p_credential_id) 
     OR UPPER(tc.id::text) LIKE UPPER(p_credential_id) || '%';
END;
$$;

-- 5. Add RLS policies for public verification
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can view completed course enrollments for verification'
  ) THEN
    CREATE POLICY "Anyone can view completed course enrollments for verification"
    ON public.course_enrollments FOR SELECT
    TO public
    USING (completed_at IS NOT NULL);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can view talent certificates for verification'
  ) THEN
    CREATE POLICY "Anyone can view talent certificates for verification"
    ON public.talent_certificates FOR SELECT
    TO public
    USING (true);
  END IF;
END $$;
