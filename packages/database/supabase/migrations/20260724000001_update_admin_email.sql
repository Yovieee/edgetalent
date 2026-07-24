-- Update administrator email and assign admin role to edgetalentindonesia@gmail.com

-- 1. Update existing admin profiles matching admin@example.com or admin@edgetalent.com
UPDATE public.profiles
SET email = 'edgetalentindonesia@gmail.com', role = 'admin'
WHERE email IN ('admin@example.com', 'admin@edgetalent.com');

-- 2. Ensure any profile registered with edgetalentindonesia@gmail.com has the admin role
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'edgetalentindonesia@gmail.com';

-- 3. Update auth.users email if matching admin@example.com or admin@edgetalent.com
UPDATE auth.users
SET email = 'edgetalentindonesia@gmail.com', email_confirmed_at = NOW()
WHERE email IN ('admin@example.com', 'admin@edgetalent.com');
