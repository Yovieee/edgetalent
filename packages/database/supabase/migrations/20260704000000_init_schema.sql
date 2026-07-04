-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    full_name TEXT,
    email TEXT,
    avatar_url TEXT,
    role TEXT CHECK (role IN ('talent', 'partner', 'admin')),
    bio TEXT,
    portfolio_links JSONB DEFAULT '{}'::jsonb,
    skills TEXT[] DEFAULT '{}'::text[],
    skill_gaps TEXT[] DEFAULT '{}'::text[],
    skills_embedding vector(1536), -- Matches OpenRouter openai/text-embedding-3-small
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT email_unq UNIQUE (email)
);

-- 2. Courses Table (Upskilling Hub)
CREATE TABLE IF NOT EXISTS public.courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    skills_taught TEXT[] DEFAULT '{}'::text[],
    provider TEXT,
    link TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Projects Table (Marketplace)
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    required_skills TEXT[] DEFAULT '{}'::text[],
    budget NUMERIC,
    scope TEXT CHECK (scope IN ('short-term', 'medium-term', 'long-term')),
    embedding vector(1536), -- Matches OpenRouter openai/text-embedding-3-small
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. Applications Table
CREATE TABLE IF NOT EXISTS public.applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    talent_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    status TEXT CHECK (status IN ('applied', 'reviewing', 'shortlisted', 'accepted', 'rejected')) DEFAULT 'applied' NOT NULL,
    match_percentage NUMERIC CHECK (match_percentage >= 0 AND match_percentage <= 100),
    match_breakdown JSONB DEFAULT '{}'::jsonb,
    applied_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT unique_talent_project_application UNIQUE (project_id, talent_id)
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- =========================================================================
-- PROFILES POLICIES
-- =========================================================================
CREATE POLICY "Profiles viewable by authenticated users" 
ON public.profiles FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
TO authenticated 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Trigger to create profile automatically on auth.users sign-up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, avatar_url, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    new.email,
    COALESCE(new.raw_user_meta_data->>'avatar_url', ''),
    NULL -- To be updated on onboarding role selection
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================================================================
-- COURSES POLICIES
-- =========================================================================
CREATE POLICY "Courses are viewable by everyone" 
ON public.courses FOR SELECT 
TO public 
USING (true);

CREATE POLICY "Only admins can modify courses" 
ON public.courses FOR ALL 
TO authenticated 
USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- =========================================================================
-- PROJECTS POLICIES
-- =========================================================================
CREATE POLICY "Projects are viewable by everyone" 
ON public.projects FOR SELECT 
TO public 
USING (true);

CREATE POLICY "Partners can insert projects" 
ON public.projects FOR INSERT 
TO authenticated 
WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'partner') 
    AND auth.uid() = partner_id
);

CREATE POLICY "Partners can update/delete their own projects" 
ON public.projects FOR ALL 
TO authenticated 
USING (auth.uid() = partner_id)
WITH CHECK (auth.uid() = partner_id);

-- =========================================================================
-- APPLICATIONS POLICIES
-- =========================================================================
CREATE POLICY "Users can view relevant applications" 
ON public.applications FOR SELECT 
TO authenticated 
USING (
    auth.uid() = talent_id OR 
    EXISTS (SELECT 1 FROM public.projects WHERE projects.id = applications.project_id AND projects.partner_id = auth.uid())
);

CREATE POLICY "Talents can submit applications" 
ON public.applications FOR INSERT 
TO authenticated 
WITH CHECK (
    auth.uid() = talent_id AND 
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'talent')
);

CREATE POLICY "Partners can update application status" 
ON public.applications FOR UPDATE 
TO authenticated 
USING (
    EXISTS (SELECT 1 FROM public.projects WHERE projects.id = applications.project_id AND projects.partner_id = auth.uid())
)
WITH CHECK (
    EXISTS (SELECT 1 FROM public.projects WHERE projects.id = applications.project_id AND projects.partner_id = auth.uid())
);

-- =========================================================================
-- pgvector MATCHING RPCs
-- =========================================================================

-- Match talents for a specific project based on profile embedding similarity
CREATE OR REPLACE FUNCTION public.match_talents_for_project(
    p_project_id UUID,
    p_match_limit INT DEFAULT 10
)
RETURNS TABLE (
    talent_id UUID,
    full_name TEXT,
    email TEXT,
    skills TEXT[],
    bio TEXT,
    similarity NUMERIC
) AS $$
DECLARE
    v_project_embedding vector(1536);
BEGIN
    SELECT embedding INTO v_project_embedding FROM public.projects WHERE id = p_project_id;
    
    IF v_project_embedding IS NULL THEN
        RETURN;
    END IF;
    
    RETURN QUERY
    SELECT 
        p.id AS talent_id,
        p.full_name,
        p.email,
        p.skills,
        p.bio,
        GREATEST(0.0, (1 - (p.skills_embedding <=> v_project_embedding)))::numeric AS similarity
    FROM public.profiles p
    WHERE p.role = 'talent' AND p.skills_embedding IS NOT NULL
    ORDER BY p.skills_embedding <=> v_project_embedding
    LIMIT p_match_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Match projects for a specific talent based on skills embedding similarity
CREATE OR REPLACE FUNCTION public.match_projects_for_talent(
    p_talent_id UUID,
    p_match_limit INT DEFAULT 10
)
RETURNS TABLE (
    project_id UUID,
    title TEXT,
    description TEXT,
    budget NUMERIC,
    scope TEXT,
    required_skills TEXT[],
    similarity NUMERIC
) AS $$
DECLARE
    v_talent_embedding vector(1536);
BEGIN
    SELECT skills_embedding INTO v_talent_embedding FROM public.profiles WHERE id = p_talent_id;
    
    IF v_talent_embedding IS NULL THEN
        RETURN;
    END IF;
    
    RETURN QUERY
    SELECT 
        pr.id AS project_id,
        pr.title,
        pr.description,
        pr.budget,
        pr.scope,
        pr.required_skills,
        GREATEST(0.0, (1 - (pr.embedding <=> v_talent_embedding)))::numeric AS similarity
    FROM public.projects pr
    WHERE pr.embedding IS NOT NULL
    ORDER BY pr.embedding <=> v_talent_embedding
    LIMIT p_match_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =========================================================================
-- PERFORMANCE INDEXES
-- =========================================================================

-- Standard B-Tree indexes for Foreign Keys
CREATE INDEX IF NOT EXISTS idx_projects_partner_id ON public.projects(partner_id);
CREATE INDEX IF NOT EXISTS idx_applications_project_id ON public.applications(project_id);
CREATE INDEX IF NOT EXISTS idx_applications_talent_id ON public.applications(talent_id);

-- pgvector HNSW indexes for Cosine Distance (matching operator <=>)
CREATE INDEX IF NOT EXISTS profiles_skills_embedding_hnsw_idx 
ON public.profiles 
USING hnsw (skills_embedding vector_cosine_ops);

CREATE INDEX IF NOT EXISTS projects_embedding_hnsw_idx 
ON public.projects 
USING hnsw (embedding vector_cosine_ops);

-- =========================================================================
-- SECURITY TRIGGERS
-- =========================================================================

-- Enforce that partners can only update the status field of applications
CREATE OR REPLACE FUNCTION public.check_application_update()
RETURNS trigger AS $$
BEGIN
  IF EXISTS (
      SELECT 1 FROM public.projects 
      WHERE id = OLD.project_id AND partner_id = auth.uid()
  ) THEN
      IF (OLD.id != NEW.id OR 
          OLD.project_id != NEW.project_id OR 
          OLD.talent_id != NEW.talent_id OR 
          OLD.match_percentage != NEW.match_percentage OR 
          OLD.match_breakdown IS DISTINCT FROM NEW.match_breakdown OR 
          OLD.applied_at != NEW.applied_at) THEN
          RAISE EXCEPTION 'Partners can only update the status of applications.';
      END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_application_updated
  BEFORE UPDATE ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.check_application_update();

