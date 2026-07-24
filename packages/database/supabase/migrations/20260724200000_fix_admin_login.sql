-- Fix admin login: Add missing INSERT policy on profiles table
-- Without this, the client-side fallback profile creation fails silently,
-- leaving admin users with no profile row and stuck on onboarding.

-- 1. Add INSERT policy so authenticated users can create their own profile row
CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- 2. Ensure handle_new_user trigger preserves existing role on conflict
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, avatar_url, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
    NULL
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      full_name = CASE 
        WHEN public.profiles.full_name IS NULL OR public.profiles.full_name = '' 
        THEN EXCLUDED.full_name 
        ELSE public.profiles.full_name 
      END;
  -- NOTE: role is intentionally NOT updated on conflict to preserve admin/existing roles
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
