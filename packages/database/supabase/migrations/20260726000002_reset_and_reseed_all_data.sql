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
INSERT INTO public.profiles (id, email, full_name, role, avatar_url, bio, skills, portfolio_links)
VALUES
  ('10000000-0000-0000-0000-000000000001', 'sarah.chen@ai-edge.org', 'Dr. Sarah Chen', 'talent', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah&backgroundColor=b6e3f4', 'Senior AI/ML Researcher specializing in LLM optimization.', ARRAY['Python', 'PyTorch', 'TensorFlow', 'LLMs', 'MLOps'], '{"github": "https://github.com/sarahchen", "linkedin": "https://linkedin.com/in/sarahchen", "location": "San Francisco, CA", "hourly_rate": 120}'::jsonb),
  ('10000000-0000-0000-0000-000000000002', 'marcus.vance@devstudio.com', 'Marcus Vance', 'talent', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus&backgroundColor=c0aede', 'Full-stack developer with a passion for web3 and decentralized apps.', ARRAY['TypeScript', 'React', 'Node.js', 'Solidity', 'GraphQL'], '{"github": "https://github.com/marcusv", "linkedin": "https://linkedin.com/in/marcusvance", "location": "London, UK", "hourly_rate": 85}'::jsonb),
  ('10000000-0000-0000-0000-000000000003', 'elena.rostova@uxcraft.design', 'Elena Rostova', 'talent', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Elena&backgroundColor=ffdfbf', 'Award-winning UI/UX designer focusing on accessibility.', ARRAY['Figma', 'UI/UX', 'Design Systems', 'User Research', 'CSS'], '{"linkedin": "https://linkedin.com/in/elenarostova", "location": "Berlin, Germany", "hourly_rate": 90}'::jsonb),
  ('10000000-0000-0000-0000-000000000004', 'alex.rivera@mobileedge.io', 'Alex Rivera', 'talent', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex&backgroundColor=d1d4f9', 'Mobile engineer creating fluid React Native experiences.', ARRAY['React Native', 'Swift', 'Kotlin', 'Mobile Architecture', 'Firebase'], '{"github": "https://github.com/alexrivera", "linkedin": "https://linkedin.com/in/alexrivera", "location": "Austin, TX", "hourly_rate": 95}'::jsonb),
  ('10000000-0000-0000-0000-000000000005', 'david.kalu@cloudops.net', 'David Kalu', 'talent', 'https://api.dicebear.com/7.x/avataaars/svg?seed=David&backgroundColor=c0aede', 'Cloud infrastructure expert and DevOps specialist.', ARRAY['AWS', 'Kubernetes', 'Terraform', 'CI/CD', 'Go'], '{"github": "https://github.com/dkalu", "linkedin": "https://linkedin.com/in/davidkalu", "location": "Toronto, Canada", "hourly_rate": 110}'::jsonb),
  ('20000000-0000-0000-0000-000000000001', 'contact@nexusailabs.io', 'Nexus AI Labs', 'partner', 'https://api.dicebear.com/7.x/shapes/svg?seed=Nexus&backgroundColor=1c1917', 'Pushing the boundaries of artificial general intelligence.', ARRAY['AI', 'Machine Learning', 'Research'], '{"linkedin": "https://linkedin.com/company/nexus-ai-labs", "location": "Boston, MA"}'::jsonb),
  ('20000000-0000-0000-0000-000000000002', 'partnerships@quantumpay.com', 'QuantumPay FinTech', 'partner', 'https://api.dicebear.com/7.x/shapes/svg?seed=Quantum&backgroundColor=1c1917', 'Next-generation payment gateway leveraging blockchain.', ARRAY['FinTech', 'Blockchain', 'Payments'], '{"linkedin": "https://linkedin.com/company/quantumpay", "location": "Singapore"}'::jsonb),
  ('20000000-0000-0000-0000-000000000003', 'info@elevatehealth.org', 'ElevateHealth Tech', 'partner', 'https://api.dicebear.com/7.x/shapes/svg?seed=Elevate&backgroundColor=1c1917', 'Transforming patient care through data analytics.', ARRAY['HealthTech', 'Data Analytics', 'Healthcare'], '{"linkedin": "https://linkedin.com/company/elevatehealth", "location": "New York, NY"}'::jsonb),
  ('90000000-0000-0000-0000-000000000001', 'edgetalentindonesia@gmail.com', 'EdgeTalent Master Admin', 'admin', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin&backgroundColor=f87171', 'System Administrator', ARRAY['Admin', 'System'], '{"location": "Jakarta, Indonesia"}'::jsonb)
ON CONFLICT (id) DO UPDATE SET
  role = EXCLUDED.role,
  avatar_url = EXCLUDED.avatar_url,
  bio = EXCLUDED.bio,
  skills = EXCLUDED.skills,
  portfolio_links = EXCLUDED.portfolio_links,
  updated_at = NOW();

-- -------------------------------------------------------------------------
-- STEP 4: SEED PROJECTS (Job Listings)
-- -------------------------------------------------------------------------
INSERT INTO public.projects (id, partner_id, title, description, required_skills, budget, scope, created_at)
VALUES
  ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Optimize LLM Inference Pipeline', 'Looking for an experienced MLOps engineer to reduce latency in our custom LLM inference pipeline. Must have experience with vLLM and TensorRT-LLM.', ARRAY['Python', 'MLOps', 'LLMs', 'CUDA'], 15000, 'short-term', now() - interval '2 days'),
  ('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', 'Design AI Platform Dashboard', 'We need a sleek, dark-mode dashboard for our enterprise AI platform. Focus on data visualization and accessibility.', ARRAY['UI/UX', 'Figma', 'Design Systems'], 7000, 'medium-term', now() - interval '5 days'),
  ('30000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000002', 'Smart Contract Auditor for DeFi Protocol', 'Require a thorough security audit of our upcoming DeFi payment protocol. High proficiency in Solidity and security best practices required.', ARRAY['Solidity', 'Smart Contracts', 'Security'], 20000, 'short-term', now() - interval '1 day'),
  ('30000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000003', 'React Native Patient App MVP', 'Build the MVP for our patient tracking mobile app. Must integrate with our existing Go backend API.', ARRAY['React Native', 'Mobile Architecture', 'TypeScript'], 18000, 'medium-term', now() - interval '10 days'),
  ('30000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000003', 'Migrate Infrastructure to Kubernetes', 'Need a DevOps engineer to migrate our legacy EC2 deployment to a highly available EKS cluster using Terraform.', ARRAY['AWS', 'Kubernetes', 'Terraform'], 25000, 'long-term', now() - interval '15 days');

-- -------------------------------------------------------------------------
-- STEP 5: SEED APPLICATIONS
-- -------------------------------------------------------------------------
INSERT INTO public.applications (id, project_id, talent_id, match_percentage, status, applied_at)
VALUES
  ('40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 95, 'reviewing', now() - interval '1 day'),
  ('40000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000003', 88, 'accepted', now() - interval '4 days'),
  ('40000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000002', 92, 'reviewing', now() - interval '12 hours'),
  ('40000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000005', 98, 'accepted', now() - interval '14 days');
