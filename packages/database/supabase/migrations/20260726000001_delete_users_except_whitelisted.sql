-- Migration: Delete all users except specified whitelisted emails on delete cascade
-- Whitelisted emails:
-- 1. blasius.yonas@gmail.com
-- 2. nana59352@gmail.com
-- 3. edgetalentindonesia@gmail.com

-- 1. Delete profiles not matching whitelisted emails (cascades to projects, applications, registrations, progress, etc.)
DELETE FROM public.profiles
WHERE LOWER(email) NOT IN (
  'blasius.yonas@gmail.com',
  'nana59352@gmail.com',
  'edgetalentindonesia@gmail.com'
) OR email IS NULL;

-- 2. Delete auth users not matching whitelisted emails (cascades to profiles and all dependent resources)
DELETE FROM auth.users
WHERE LOWER(email) NOT IN (
  'blasius.yonas@gmail.com',
  'nana59352@gmail.com',
  'edgetalentindonesia@gmail.com'
) OR email IS NULL;
