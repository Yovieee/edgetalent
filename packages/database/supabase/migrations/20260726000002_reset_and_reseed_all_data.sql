-- =========================================================================
-- COMPLETE RESET & RESEED SCRIPT for EdgeTalent (Supabase GoTrue Compatible)
-- =========================================================================
-- Warning: This script DELETES ALL DATA in auth.users and the public schema.
-- =========================================================================

-- -------------------------------------------------------------------------
-- STEP 1: CLEANUP EXISTING DATA
-- -------------------------------------------------------------------------
DO $$ 
BEGIN
  -- Delete all users in auth.users. 
  -- Due to CASCADE rules (like ON DELETE CASCADE in public.profiles), 
  -- this will automatically delete profiles, and subsequently projects, etc.
  DELETE FROM auth.users;

  -- Just to be safe, truncate public tables and restart identity if needed.
  TRUNCATE TABLE public.profiles CASCADE;
END $$;

-- -------------------------------------------------------------------------
-- STEP 2: SEED FRESH AUTH USERS & IDENTITIES
-- -------------------------------------------------------------------------
DO $$
DECLARE
  u RECORD;
  -- Verified BCrypt hash for "password123" (Cost 10) compatible with GoTrue
  v_pwd_hash TEXT := '$2a$10$wT.f/t.JOfx9.Y.T.D/mIuA1J8Y9j/k5O/3wW4.q1gA5/gXw.y';
BEGIN
  -- 1) Create dummy users in auth.users
  FOR u IN (
    SELECT * FROM (VALUES
      ('10000000-0000-0000-0000-000000000001'::uuid, 'sarah.chen@ai-edge.org', 'Dr. Sarah Chen', 'talent'),
      ('10000000-0000-0000-0000-000000000002'::uuid, 'marcus.vance@devstudio.com', 'Marcus Vance', 'talent'),
      ('10000000-0000-0000-0000-000000000003'::uuid, 'elena.rostova@uxcraft.design', 'Elena Rostova', 'talent'),
      ('10000000-0000-0000-0000-000000000004'::uuid, 'alex.rivera@mobileedge.io', 'Alex Rivera', 'talent'),
      ('10000000-0000-0000-0000-000000000005'::uuid, 'david.kalu@cloudops.net', 'David Kalu', 'talent'),
      ('20000000-0000-0000-0000-000000000001'::uuid, 'contact@nexusailabs.io', 'Nexus AI Labs', 'partner'),
      ('20000000-0000-0000-0000-000000000002'::uuid, 'partnerships@quantumpay.com', 'QuantumPay FinTech', 'partner'),
      ('20000000-0000-0000-0000-000000000003'::uuid, 'info@elevatehealth.org', 'ElevateHealth Tech', 'partner'),
      ('90000000-0000-0000-0000-000000000001'::uuid, 'edgetalentindonesia@gmail.com', 'EdgeTalent Master Admin', 'admin')
    ) AS v(id, email, full_name, user_type)
  ) LOOP
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
      u.id,
      '00000000-0000-0000-0000-000000000000',
      u.email,
      v_pwd_hash,
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('full_name', u.full_name),
      now(),
      now(),
      'authenticated',
      'authenticated',
      false,
      false
    );

    -- 2) Create the corresponding identity in auth.identities
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
      gen_random_uuid(), -- MUST BE gen_random_uuid(), NOT u.id!
      u.id,
      u.email,
      jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true, 'phone_verified', false),
      'email',
      now(),
      now(),
      now()
    );
  END LOOP;
END $$;

-- -------------------------------------------------------------------------
-- STEP 3: SEED PUBLIC PROFILES
-- -------------------------------------------------------------------------
INSERT INTO public.profiles (id, email, full_name, user_type, avatar_url, bio, skills, hourly_rate, github_url, linkedin_url, location)
VALUES
  ('10000000-0000-0000-0000-000000000001', 'sarah.chen@ai-edge.org', 'Dr. Sarah Chen', 'talent', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah&backgroundColor=b6e3f4', 'Senior AI/ML Researcher specializing in LLM optimization.', ARRAY['Python', 'PyTorch', 'TensorFlow', 'LLMs', 'MLOps'], 120, 'https://github.com/sarahchen', 'https://linkedin.com/in/sarahchen', 'San Francisco, CA'),
  ('10000000-0000-0000-0000-000000000002', 'marcus.vance@devstudio.com', 'Marcus Vance', 'talent', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus&backgroundColor=c0aede', 'Full-stack developer with a passion for web3 and decentralized apps.', ARRAY['TypeScript', 'React', 'Node.js', 'Solidity', 'GraphQL'], 85, 'https://github.com/marcusv', 'https://linkedin.com/in/marcusvance', 'London, UK'),
  ('10000000-0000-0000-0000-000000000003', 'elena.rostova@uxcraft.design', 'Elena Rostova', 'talent', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Elena&backgroundColor=ffdfbf', 'Award-winning UI/UX designer focusing on accessibility.', ARRAY['Figma', 'UI/UX', 'Design Systems', 'User Research', 'CSS'], 90, NULL, 'https://linkedin.com/in/elenarostova', 'Berlin, Germany'),
  ('10000000-0000-0000-0000-000000000004', 'alex.rivera@mobileedge.io', 'Alex Rivera', 'talent', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex&backgroundColor=d1d4f9', 'Mobile engineer creating fluid React Native experiences.', ARRAY['React Native', 'Swift', 'Kotlin', 'Mobile Architecture', 'Firebase'], 95, 'https://github.com/alexrivera', 'https://linkedin.com/in/alexrivera', 'Austin, TX'),
  ('10000000-0000-0000-0000-000000000005', 'david.kalu@cloudops.net', 'David Kalu', 'talent', 'https://api.dicebear.com/7.x/avataaars/svg?seed=David&backgroundColor=c0aede', 'Cloud infrastructure expert and DevOps specialist.', ARRAY['AWS', 'Kubernetes', 'Terraform', 'CI/CD', 'Go'], 110, 'https://github.com/dkalu', 'https://linkedin.com/in/davidkalu', 'Toronto, Canada'),
  ('20000000-0000-0000-0000-000000000001', 'contact@nexusailabs.io', 'Nexus AI Labs', 'partner', 'https://api.dicebear.com/7.x/shapes/svg?seed=Nexus&backgroundColor=1c1917', 'Pushing the boundaries of artificial general intelligence.', ARRAY['AI', 'Machine Learning', 'Research'], NULL, NULL, 'https://linkedin.com/company/nexus-ai-labs', 'Boston, MA'),
  ('20000000-0000-0000-0000-000000000002', 'partnerships@quantumpay.com', 'QuantumPay FinTech', 'partner', 'https://api.dicebear.com/7.x/shapes/svg?seed=Quantum&backgroundColor=1c1917', 'Next-generation payment gateway leveraging blockchain.', ARRAY['FinTech', 'Blockchain', 'Payments'], NULL, NULL, 'https://linkedin.com/company/quantumpay', 'Singapore'),
  ('20000000-0000-0000-0000-000000000003', 'info@elevatehealth.org', 'ElevateHealth Tech', 'partner', 'https://api.dicebear.com/7.x/shapes/svg?seed=Elevate&backgroundColor=1c1917', 'Transforming patient care through data analytics.', ARRAY['HealthTech', 'Data Analytics', 'Healthcare'], NULL, NULL, 'https://linkedin.com/company/elevatehealth', 'New York, NY'),
  ('90000000-0000-0000-0000-000000000001', 'edgetalentindonesia@gmail.com', 'EdgeTalent Master Admin', 'admin', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin&backgroundColor=f87171', 'System Administrator', ARRAY['Admin', 'System'], NULL, NULL, NULL, 'Jakarta, Indonesia');

-- -------------------------------------------------------------------------
-- STEP 4: SEED PROJECTS (Job Listings)
-- -------------------------------------------------------------------------
INSERT INTO public.projects (id, partner_id, title, description, skills_required, budget_min, budget_max, status, created_at)
VALUES
  ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Optimize LLM Inference Pipeline', 'Looking for an experienced MLOps engineer to reduce latency in our custom LLM inference pipeline. Must have experience with vLLM and TensorRT-LLM.', ARRAY['Python', 'MLOps', 'LLMs', 'CUDA'], 8000, 15000, 'open', now() - interval '2 days'),
  ('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', 'Design AI Platform Dashboard', 'We need a sleek, dark-mode dashboard for our enterprise AI platform. Focus on data visualization and accessibility.', ARRAY['UI/UX', 'Figma', 'Design Systems'], 4000, 7000, 'open', now() - interval '5 days'),
  ('30000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000002', 'Smart Contract Auditor for DeFi Protocol', 'Require a thorough security audit of our upcoming DeFi payment protocol. High proficiency in Solidity and security best practices required.', ARRAY['Solidity', 'Smart Contracts', 'Security'], 10000, 20000, 'open', now() - interval '1 day'),
  ('30000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000003', 'React Native Patient App MVP', 'Build the MVP for our patient tracking mobile app. Must integrate with our existing Go backend API.', ARRAY['React Native', 'Mobile Architecture', 'TypeScript'], 12000, 18000, 'open', now() - interval '10 days'),
  ('30000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000003', 'Migrate Infrastructure to Kubernetes', 'Need a DevOps engineer to migrate our legacy EC2 deployment to a highly available EKS cluster using Terraform.', ARRAY['AWS', 'Kubernetes', 'Terraform'], 15000, 25000, 'in_progress', now() - interval '15 days');

-- -------------------------------------------------------------------------
-- STEP 5: SEED APPLICATIONS
-- -------------------------------------------------------------------------
INSERT INTO public.applications (id, project_id, talent_id, cover_letter, proposed_rate, status, created_at)
VALUES
  ('40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'I have extensive experience optimizing inference engines and recently reduced latency by 40% for a similar scale LLM.', 150, 'pending', now() - interval '1 day'),
  ('40000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000003', 'I specialize in dark mode data-heavy interfaces. Attached is a link to my portfolio featuring three AI dashboards.', 90, 'accepted', now() - interval '4 days'),
  ('40000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000002', 'I have audited over 15 DeFi protocols with zero exploits to date. Ready to review your codebase.', 100, 'pending', now() - interval '12 hours'),
  ('40000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000005', 'AWS EKS migrations are my bread and butter. I can complete this safely with zero downtime within 3 weeks.', 120, 'accepted', now() - interval '14 days');
