-- Create course_lessons table
CREATE TABLE IF NOT EXISTS public.course_lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    sequence_order INT NOT NULL,
    duration_minutes INT DEFAULT 10 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT unique_course_seq UNIQUE(course_id, sequence_order)
);

-- Create course_enrollments table
CREATE TABLE IF NOT EXISTS public.course_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
    completed_lessons UUID[] DEFAULT '{}'::uuid[] NOT NULL,
    completed_at TIMESTAMPTZ,
    last_accessed_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT unique_user_course_enrollment UNIQUE(user_id, course_id)
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.course_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for course_lessons
CREATE POLICY "Course lessons are viewable by everyone"
ON public.course_lessons FOR SELECT
TO public
USING (true);

CREATE POLICY "Only admins can modify course lessons"
ON public.course_lessons FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- RLS Policies for course_enrollments
CREATE POLICY "Users can view their own course enrollments"
ON public.course_enrollments FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users can enroll in courses"
ON public.course_enrollments FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own course enrollments"
ON public.course_enrollments FOR UPDATE
TO authenticated
USING (auth.uid() = user_id OR public.is_admin())
WITH CHECK (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users can delete their own course enrollments"
ON public.course_enrollments FOR DELETE
TO authenticated
USING (auth.uid() = user_id OR public.is_admin());

-- Seed developer/talent courses
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.courses WHERE title = 'Advanced Frontend Engineering with React & TS') THEN
    INSERT INTO public.courses (title, description, skills_taught, provider, link)
    VALUES (
      'Advanced Frontend Engineering with React & TS',
      'Master React hooks, custom state management, performance profiling, and enterprise TypeScript applications.',
      ARRAY['frontend', 'React', 'TypeScript', 'State Management'],
      'EdgeTalent Academy',
      ''
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.courses WHERE title = 'Enterprise Backend Development with Node.js') THEN
    INSERT INTO public.courses (title, description, skills_taught, provider, link)
    VALUES (
      'Enterprise Backend Development with Node.js',
      'Deep dive into Node.js, Express, databases, caching, and building scalable API gateways.',
      ARRAY['backend', 'Node.js', 'Express', 'PostgreSQL', 'Redis'],
      'EdgeTalent Academy',
      ''
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.courses WHERE title = 'AI Engineering & Intelligent Systems') THEN
    INSERT INTO public.courses (title, description, skills_taught, provider, link)
    VALUES (
      'AI Engineering & Intelligent Systems',
      'Learn how to build applications using Large Language Models, embeddings, vector databases, and retrieval-augmented generation.',
      ARRAY['ai', 'LLM', 'Prompt Engineering', 'Vector Databases', 'Python'],
      'EdgeTalent Academy',
      ''
    );
  END IF;
END $$;

-- Seed lessons for all courses
DO $$
DECLARE
  v_course_id UUID;
BEGIN
  -- 1. Startup School
  SELECT id INTO v_course_id FROM public.courses WHERE title = 'Startup School: How to Start a Startup';
  IF v_course_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.course_lessons WHERE course_id = v_course_id) THEN
    INSERT INTO public.course_lessons (course_id, title, content, sequence_order, duration_minutes) VALUES
    (v_course_id, 'How to Evaluate Startup Ideas', '# Evaluating Startup Ideas' || chr(10) || 'Evaluating ideas is the first step. Look at the problem size, execution feasibility, and market size.', 1, 15),
    (v_course_id, 'Talking to Users', '# Talking to Users' || chr(10) || 'The main goal is to understand users'' pain points. Do not pitch; ask open-ended questions about their current behaviors.', 2, 20),
    (v_course_id, 'Finding Product-Market Fit', '# Finding Product-Market Fit' || chr(10) || 'Product-market fit happens when you build something that people want and are actively using or paying for.', 3, 25);
  END IF;

  -- 2. Venture Capital & Deal Structuring
  SELECT id INTO v_course_id FROM public.courses WHERE title = 'Venture Capital & Deal Structuring';
  IF v_course_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.course_lessons WHERE course_id = v_course_id) THEN
    INSERT INTO public.course_lessons (course_id, title, content, sequence_order, duration_minutes) VALUES
    (v_course_id, 'Introduction to Venture Capital', '# Intro to VC' || chr(10) || 'Venture capital is a form of private equity targeting high-growth early-stage startups.', 1, 15),
    (v_course_id, 'Startup Valuation & Equity', '# Valuation & Equity' || chr(10) || 'Understand pre-money vs post-money valuation, dilution, and how capitalization tables are constructed.', 2, 18),
    (v_course_id, 'Understanding Term Sheets', '# Term Sheets Decoded' || chr(10) || 'Learn about liquidation preference, participation rights, and protective provisions.', 3, 22);
  END IF;

  -- 3. Advanced Frontend Engineering
  SELECT id INTO v_course_id FROM public.courses WHERE title = 'Advanced Frontend Engineering with React & TS';
  IF v_course_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.course_lessons WHERE course_id = v_course_id) THEN
    INSERT INTO public.course_lessons (course_id, title, content, sequence_order, duration_minutes) VALUES
    (v_course_id, 'Advanced React Hook Mechanics', '# Hook Mechanics' || chr(10) || 'Understand how fibers work, render triggers, and how dependencies are compared using Object.is.', 1, 20),
    (v_course_id, 'Designing Custom React Hooks', '# Custom Hooks' || chr(10) || 'Learn to abstract UI behavior into reusable, testable custom hooks for clean component separation.', 2, 25),
    (v_course_id, 'Enterprise TypeScript Patterns', '# TS Patterns' || chr(10) || 'Master generics, template literal types, conditional types, and schema validation integrations.', 3, 18);
  END IF;

  -- 4. Enterprise Backend Development
  SELECT id INTO v_course_id FROM public.courses WHERE title = 'Enterprise Backend Development with Node.js';
  IF v_course_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.course_lessons WHERE course_id = v_course_id) THEN
    INSERT INTO public.course_lessons (course_id, title, content, sequence_order, duration_minutes) VALUES
    (v_course_id, 'Node.js Event Loop & Asynchronous I/O', '# Event Loop' || chr(10) || 'Deep dive into single-threaded execution, timer phases, poll phase, and how microtasks (promises) are executed.', 1, 22),
    (v_course_id, 'High-Performance Database Querying', '# DB Optimization' || chr(10) || 'Explain indexes, query analyzer, connection pooling, and transactional safety under load.', 2, 20),
    (v_course_id, 'Caching with Redis', '# Redis Caching' || chr(10) || 'Implement cache-aside, cache-through strategies, TTL, and cache stampede prevention.', 3, 15);
  END IF;

  -- 5. AI Engineering
  SELECT id INTO v_course_id FROM public.courses WHERE title = 'AI Engineering & Intelligent Systems';
  IF v_course_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.course_lessons WHERE course_id = v_course_id) THEN
    INSERT INTO public.course_lessons (course_id, title, content, sequence_order, duration_minutes) VALUES
    (v_course_id, 'Understanding Vector Embeddings', '# Vector Embeddings' || chr(10) || 'Learn about embedding dimensions, vector normalization, and semantic proximity representations.', 1, 15),
    (v_course_id, 'Designing Retrieval-Augmented Generation (RAG)', '# RAG Pipelines' || chr(10) || 'Build systems that query databases for relevant context and inject it into LLM context windows dynamically.', 2, 25),
    (v_course_id, 'Optimizing LLM Prompts', '# Prompt Engineering' || chr(10) || 'Explore advanced techniques: zero-shot, few-shot, self-consistency, and prompt template parameters.', 3, 18);
  END IF;
END $$;
