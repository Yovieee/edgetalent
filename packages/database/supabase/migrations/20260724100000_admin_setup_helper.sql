-- 1. Helper function to promote any user to admin by email
CREATE OR REPLACE FUNCTION public.promote_user_to_admin(user_email TEXT)
RETURNS void AS $$
BEGIN
  UPDATE public.profiles
  SET role = 'admin', updated_at = NOW()
  WHERE LOWER(email) = LOWER(user_email);
  
  IF NOT FOUND THEN
    RAISE NOTICE 'No profile found for email: %', user_email;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Trigger to sync email changes from auth.users to public.profiles
CREATE OR REPLACE FUNCTION public.handle_user_email_update()
RETURNS trigger AS $$
BEGIN
  IF NEW.email IS DISTINCT FROM OLD.email THEN
    UPDATE public.profiles
    SET email = NEW.email, updated_at = NOW()
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_email_updated ON auth.users;
CREATE TRIGGER on_auth_user_email_updated
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_email_update();

-- 3. Enhance handle_new_user to handle conflict gracefully
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
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
