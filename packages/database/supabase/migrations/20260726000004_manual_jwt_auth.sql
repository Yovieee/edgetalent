-- Migration: Manual JWT Authentication Functions
-- Creates stored procedures for manual user registration, manual password-based login, and manual password reset.

-- 1. Enable pgcrypto extension for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- 2. Function: login_manual_user
-- Validates user credentials against auth.users using bcrypt and returns user + profile details
CREATE OR REPLACE FUNCTION public.login_manual_user(
  p_email TEXT,
  p_password TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  v_user_id UUID;
  v_encrypted_pwd TEXT;
  v_user_email TEXT;
  v_profile RECORD;
BEGIN
  p_email := LOWER(TRIM(p_email));

  IF p_email IS NULL OR p_email = '' THEN
    RETURN jsonb_build_object('success', false, 'message', 'Email address is required.');
  END IF;

  IF p_password IS NULL OR p_password = '' THEN
    RETURN jsonb_build_object('success', false, 'message', 'Password is required.');
  END IF;

  -- Fetch user from auth.users
  SELECT id, email, encrypted_password INTO v_user_id, v_user_email, v_encrypted_pwd
  FROM auth.users
  WHERE LOWER(email) = p_email
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Invalid email or password.');
  END IF;

  -- Verify password with bcrypt
  IF v_encrypted_pwd IS NULL OR v_encrypted_pwd != extensions.crypt(p_password, v_encrypted_pwd) THEN
    RETURN jsonb_build_object('success', false, 'message', 'Invalid email or password.');
  END IF;

  -- Fetch profile from public.profiles
  SELECT id, email, full_name, role, avatar_url, bio, created_at, updated_at
  INTO v_profile
  FROM public.profiles
  WHERE id = v_user_id
  LIMIT 1;

  RETURN jsonb_build_object(
    'success', true,
    'user', jsonb_build_object(
      'id', v_user_id,
      'email', v_user_email,
      'full_name', COALESCE(v_profile.full_name, ''),
      'role', COALESCE(v_profile.role, 'talent'),
      'avatar_url', COALESCE(v_profile.avatar_url, '')
    ),
    'profile', jsonb_build_object(
      'id', v_user_id,
      'email', v_user_email,
      'full_name', COALESCE(v_profile.full_name, ''),
      'role', COALESCE(v_profile.role, 'talent'),
      'avatar_url', COALESCE(v_profile.avatar_url, ''),
      'bio', COALESCE(v_profile.bio, '')
    ),
    'message', 'Login successful.'
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$;

-- 3. Function: create_manual_user
-- Securely creates user in auth.users, auth.identities, and public.profiles
CREATE OR REPLACE FUNCTION public.create_manual_user(
  p_email TEXT,
  p_password TEXT,
  p_full_name TEXT DEFAULT '',
  p_role TEXT DEFAULT 'talent'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  v_user_id UUID;
  v_identity_id UUID;
  v_pwd_hash TEXT;
  v_normalized_role TEXT;
  v_existing_id UUID;
BEGIN
  -- Normalize inputs
  p_email := LOWER(TRIM(p_email));
  v_normalized_role := LOWER(TRIM(COALESCE(p_role, 'talent')));
  
  IF v_normalized_role NOT IN ('talent', 'partner', 'admin') THEN
    v_normalized_role := 'talent';
  END IF;

  IF p_email IS NULL OR p_email = '' THEN
    RETURN jsonb_build_object('success', false, 'message', 'Email address is required.');
  END IF;

  IF p_password IS NULL OR length(p_password) < 6 THEN
    RETURN jsonb_build_object('success', false, 'message', 'Password must be at least 6 characters long.');
  END IF;

  -- Check if user already exists in auth.users
  SELECT id INTO v_existing_id FROM auth.users WHERE LOWER(email) = p_email LIMIT 1;
  IF v_existing_id IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'A user with this email address already exists.');
  END IF;

  -- Generate UUIDs and Hash Password using GoTrue compatible BCrypt (Cost 10)
  v_user_id := gen_random_uuid();
  v_identity_id := gen_random_uuid();
  v_pwd_hash := extensions.crypt(p_password, extensions.gen_salt('bf', 10));

  -- Insert into auth.users
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    role,
    aud,
    is_sso_user,
    is_anonymous
  ) VALUES (
    v_user_id,
    '00000000-0000-0000-0000-000000000000'::uuid,
    p_email,
    v_pwd_hash,
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('full_name', p_full_name),
    now(),
    now(),
    'authenticated',
    'authenticated',
    false,
    false
  );

  -- Insert into auth.identities
  INSERT INTO auth.identities (
    id,
    user_id,
    provider_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    v_identity_id,
    v_user_id,
    p_email,
    jsonb_build_object('sub', v_user_id::text, 'email', p_email, 'email_verified', true, 'phone_verified', false),
    'email',
    now(),
    now(),
    now()
  );

  -- Upsert into public.profiles
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    role,
    avatar_url,
    created_at,
    updated_at
  ) VALUES (
    v_user_id,
    p_email,
    p_full_name,
    v_normalized_role,
    'https://api.dicebear.com/7.x/avataaars/svg?seed=' || encode(v_user_id::text::bytea, 'hex'),
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    updated_at = now();

  RETURN jsonb_build_object(
    'success', true,
    'user', jsonb_build_object(
      'id', v_user_id,
      'email', p_email,
      'full_name', p_full_name,
      'role', v_normalized_role
    ),
    'profile', jsonb_build_object(
      'id', v_user_id,
      'email', p_email,
      'full_name', p_full_name,
      'role', v_normalized_role
    ),
    'message', 'User account created successfully.'
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$;

-- 4. Function: reset_user_password_manual
-- Securely updates a user's password directly in auth.users
CREATE OR REPLACE FUNCTION public.reset_user_password_manual(
  p_email TEXT,
  p_new_password TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  v_user_id UUID;
  v_pwd_hash TEXT;
BEGIN
  p_email := LOWER(TRIM(p_email));

  IF p_email IS NULL OR p_email = '' THEN
    RETURN jsonb_build_object('success', false, 'message', 'Email address is required.');
  END IF;

  IF p_new_password IS NULL OR length(p_new_password) < 6 THEN
    RETURN jsonb_build_object('success', false, 'message', 'New password must be at least 6 characters long.');
  END IF;

  SELECT id INTO v_user_id FROM auth.users WHERE LOWER(email) = p_email LIMIT 1;
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'User with specified email address does not exist.');
  END IF;

  v_pwd_hash := extensions.crypt(p_new_password, extensions.gen_salt('bf', 10));

  UPDATE auth.users
  SET encrypted_password = v_pwd_hash,
      updated_at = now()
  WHERE id = v_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'id', v_user_id,
    'email', p_email,
    'message', 'Password updated successfully.'
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$;

-- 5. Permissions
GRANT EXECUTE ON FUNCTION public.login_manual_user(TEXT, TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.create_manual_user(TEXT, TEXT, TEXT, TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.reset_user_password_manual(TEXT, TEXT) TO anon, authenticated, service_role;
