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

-- Drop recursive policies
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all projects" ON public.projects;
DROP POLICY IF EXISTS "Admins can manage all applications" ON public.applications;
DROP POLICY IF EXISTS "Only admins can modify quiz questions" ON public.quiz_questions;
DROP POLICY IF EXISTS "Only admins can modify courses" ON public.courses;

-- Re-create clean policies using is_admin()
CREATE POLICY "Admins can manage all profiles"
ON public.profiles FOR ALL
TO authenticated
USING (
    public.is_admin()
)
WITH CHECK (
    public.is_admin()
);

CREATE POLICY "Admins can manage all projects"
ON public.projects FOR ALL
TO authenticated
USING (
    public.is_admin()
)
WITH CHECK (
    public.is_admin()
);

CREATE POLICY "Admins can manage all applications"
ON public.applications FOR ALL
TO authenticated
USING (
    public.is_admin()
)
WITH CHECK (
    public.is_admin()
);

CREATE POLICY "Only admins can modify quiz questions"
ON public.quiz_questions FOR ALL
TO authenticated
USING (
    public.is_admin()
)
WITH CHECK (
    public.is_admin()
);

CREATE POLICY "Only admins can modify courses" 
ON public.courses FOR ALL 
TO authenticated 
USING (
    public.is_admin()
);
