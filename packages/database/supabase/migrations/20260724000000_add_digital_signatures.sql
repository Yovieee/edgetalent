-- Add digital_signature column to course_enrollments and talent_certificates
ALTER TABLE public.course_enrollments
ADD COLUMN IF NOT EXISTS digital_signature TEXT;

ALTER TABLE public.talent_certificates
ADD COLUMN IF NOT EXISTS digital_signature TEXT;

-- Update the verify_certificate RPC to also return the digital_signature field
-- Must DROP first because return type is changing (adding digital_signature column)
DROP FUNCTION IF EXISTS public.verify_certificate(TEXT);
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
  credential_url TEXT,
  digital_signature TEXT
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
    NULL::TEXT AS credential_url,
    ce.digital_signature AS digital_signature
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
    tc.credential_url AS credential_url,
    tc.digital_signature AS digital_signature
  FROM public.talent_certificates tc
  JOIN public.profiles p ON p.id = tc.user_id
  WHERE UPPER(tc.credential_id) = UPPER(p_credential_id) 
     OR UPPER(tc.id::text) LIKE UPPER(p_credential_id) || '%';
END;
$$;
