-- Helper function to check if the current user is an admin without causing infinite recursion
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create Quiz Questions Table
CREATE TABLE IF NOT EXISTS public.quiz_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT CHECK (category IN ('frontend', 'backend', 'ai')),
    question TEXT NOT NULL,
    options TEXT[] DEFAULT '{}'::text[] NOT NULL,
    answer TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS on quiz_questions
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;

-- 1. Quiz questions viewable by everyone
CREATE POLICY "Quiz questions are viewable by everyone"
ON public.quiz_questions FOR SELECT
TO public
USING (true);

-- 2. Only admins can modify quiz questions
CREATE POLICY "Only admins can modify quiz questions"
ON public.quiz_questions FOR ALL
TO authenticated
USING (
    public.is_admin()
)
WITH CHECK (
    public.is_admin()
);

-- Seed quiz questions
INSERT INTO public.quiz_questions (category, question, options, answer) VALUES
('frontend', 'Which hook in React is used to run side effects?', ARRAY['useEffect', 'useState', 'useContext', 'useReducer'], 'useEffect'),
('frontend', 'What does TypeScript do?', ARRAY['Provides static type checking', 'Compiles to machine code', 'Replaces JavaScript entirely', 'Manages CSS styles'], 'Provides static type checking'),
('frontend', 'What is the correct CSS property to align flex items along the cross-axis?', ARRAY['align-items', 'justify-content', 'align-content', 'flex-direction'], 'align-items'),
('frontend', 'Which HTML5 tag is most appropriate for navigation links?', ARRAY['<nav>', '<header>', '<section>', '<aside>'], '<nav>'),
('frontend', 'In React, what is the key prop used for?', ARRAY['Helping React identify which items have changed/added/removed', 'Styling list elements', 'Storing state', 'Accessing global context'], 'Helping React identify which items have changed/added/removed'),

('backend', 'Which Node.js module is used to handle file paths?', ARRAY['path', 'fs', 'http', 'os'], 'path'),
('backend', 'What is the purpose of an index in a relational database?', ARRAY['To speed up data retrieval operations', 'To enforce unique constraints', 'To encrypt sensitive columns', 'To define table relationships'], 'To speed up data retrieval operations'),
('backend', 'Which HTTP status code represents ''Internal Server Error''?', ARRAY['500', '400', '401', '404'], '500'),
('backend', 'What is the main characteristic of a REST API?', ARRAY['Statelessness', 'Uses XML only', 'Requires WebSockets', 'Single entry point query language'], 'Statelessness'),
('backend', 'Which package manager is native to Node.js?', ARRAY['npm', 'pnpm', 'yarn', 'bower'], 'npm'),

('ai', 'What is the primary language used for Machine Learning and AI frameworks like PyTorch?', ARRAY['Python', 'JavaScript', 'C++', 'Java'], 'Python'),
('ai', 'In vector databases, what is cosine similarity used for?', ARRAY['Measuring the angle/semantic similarity between two vector embeddings', 'Sorting text alphabetically', 'Compressing image files', 'Hashing passwords'], 'Measuring the angle/semantic similarity between two vector embeddings'),
('ai', 'What does ''LLM'' stand for in AI?', ARRAY['Large Language Model', 'Local Logic Machine', 'Linear Log Matrix', 'Low Latency Memory'], 'Large Language Model'),
('ai', 'What is the purpose of ''embeddings'' in NLP?', ARRAY['To represent text tokens as high-dimensional numerical vectors', 'To format text in HTML', 'To encrypt text content', 'To translate text to different languages'], 'To represent text tokens as high-dimensional numerical vectors'),
('ai', 'What is ''prompt engineering''?', ARRAY['The process of structuring instructions to guide LLM responses', 'Designing processor hardware', 'Running database backups', 'Optimizing network routers'], 'The process of structuring instructions to guide LLM responses');

-- 3. Update Profiles Policies for Admins
CREATE POLICY "Admins can manage all profiles"
ON public.profiles FOR ALL
TO authenticated
USING (
    public.is_admin()
)
WITH CHECK (
    public.is_admin()
);

-- 4. Update Projects Policies for Admins
CREATE POLICY "Admins can manage all projects"
ON public.projects FOR ALL
TO authenticated
USING (
    public.is_admin()
)
WITH CHECK (
    public.is_admin()
);

-- 5. Update Applications Policies for Admins
CREATE POLICY "Admins can manage all applications"
ON public.applications FOR ALL
TO authenticated
USING (
    public.is_admin()
)
WITH CHECK (
    public.is_admin()
);
