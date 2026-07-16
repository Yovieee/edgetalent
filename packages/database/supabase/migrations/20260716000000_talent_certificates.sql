-- Create talent_certificates table
CREATE TABLE IF NOT EXISTS public.talent_certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    issuing_organization TEXT NOT NULL,
    issue_date DATE NOT NULL,
    expiration_date DATE,
    credential_id TEXT,
    credential_url TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.talent_certificates ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
CREATE POLICY "Talent certificates are viewable by authenticated users"
ON public.talent_certificates FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can insert their own certificates"
ON public.talent_certificates FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own certificates"
ON public.talent_certificates FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own certificates"
ON public.talent_certificates FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
