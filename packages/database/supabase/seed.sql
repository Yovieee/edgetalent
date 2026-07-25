-- =========================================================================
-- EdgeTalent Database Master Seed File
-- High-Quality Production-Grade Dummy Data
-- =========================================================================

-- Enable pgvector extension if not exists
CREATE EXTENSION IF NOT EXISTS vector;

-- -------------------------------------------------------------------------
-- 0. SEED AUTH USERS FIRST (to satisfy profiles_id_fkey constraint)
-- -------------------------------------------------------------------------
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
  aud
) VALUES
(
  '10000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000'::uuid,
  'sarah.chen@ai-edge.org',
  '$2a$10$g1kK4E8sN07Mv1S5W0KzOO8b.X7M/E6f9qJ7X7V0/V1M1/V1M1/V1',
  NOW(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Dr. Sarah Chen"}'::jsonb,
  NOW(),
  NOW(),
  'authenticated',
  'authenticated'
),
(
  '10000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000000'::uuid,
  'marcus.vance@devstudio.com',
  '$2a$10$g1kK4E8sN07Mv1S5W0KzOO8b.X7M/E6f9qJ7X7V0/V1M1/V1M1/V1',
  NOW(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Marcus Vance"}'::jsonb,
  NOW(),
  NOW(),
  'authenticated',
  'authenticated'
),
(
  '10000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000000'::uuid,
  'elena.rostova@uxcraft.design',
  '$2a$10$g1kK4E8sN07Mv1S5W0KzOO8b.X7M/E6f9qJ7X7V0/V1M1/V1M1/V1',
  NOW(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Elena Rostova"}'::jsonb,
  NOW(),
  NOW(),
  'authenticated',
  'authenticated'
),
(
  '10000000-0000-0000-0000-000000000004',
  '00000000-0000-0000-0000-000000000000'::uuid,
  'alex.rivera@mobileedge.io',
  '$2a$10$g1kK4E8sN07Mv1S5W0KzOO8b.X7M/E6f9qJ7X7V0/V1M1/V1M1/V1',
  NOW(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Alex Rivera"}'::jsonb,
  NOW(),
  NOW(),
  'authenticated',
  'authenticated'
),
(
  '10000000-0000-0000-0000-000000000005',
  '00000000-0000-0000-0000-000000000000'::uuid,
  'david.kalu@cloudops.net',
  '$2a$10$g1kK4E8sN07Mv1S5W0KzOO8b.X7M/E6f9qJ7X7V0/V1M1/V1M1/V1',
  NOW(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"David Kalu"}'::jsonb,
  NOW(),
  NOW(),
  'authenticated',
  'authenticated'
),
(
  '20000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000'::uuid,
  'contact@nexusailabs.io',
  '$2a$10$g1kK4E8sN07Mv1S5W0KzOO8b.X7M/E6f9qJ7X7V0/V1M1/V1M1/V1',
  NOW(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Nexus AI Labs"}'::jsonb,
  NOW(),
  NOW(),
  'authenticated',
  'authenticated'
),
(
  '20000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000000'::uuid,
  'partnerships@quantumpay.com',
  '$2a$10$g1kK4E8sN07Mv1S5W0KzOO8b.X7M/E6f9qJ7X7V0/V1M1/V1M1/V1',
  NOW(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"QuantumPay FinTech"}'::jsonb,
  NOW(),
  NOW(),
  'authenticated',
  'authenticated'
),
(
  '20000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000000'::uuid,
  'info@elevatehealth.org',
  '$2a$10$g1kK4E8sN07Mv1S5W0KzOO8b.X7M/E6f9qJ7X7V0/V1M1/V1M1/V1',
  NOW(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"ElevateHealth Tech"}'::jsonb,
  NOW(),
  NOW(),
  'authenticated',
  'authenticated'
),
(
  '30000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000'::uuid,
  'edgetalentindonesia@gmail.com',
  '$2a$10$g1kK4E8sN07Mv1S5W0KzOO8b.X7M/E6f9qJ7X7V0/V1M1/V1M1/V1',
  NOW(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"EdgeTalent Master Admin"}'::jsonb,
  NOW(),
  NOW(),
  'authenticated',
  'authenticated'
)
ON CONFLICT (id) DO NOTHING;

-- -------------------------------------------------------------------------
-- 1. SEED PROFILES
-- -------------------------------------------------------------------------
INSERT INTO public.profiles (id, full_name, email, avatar_url, role, bio, portfolio_links, skills, skill_gaps, skills_embedding)
VALUES
-- Talents
(
  '10000000-0000-0000-0000-000000000001',
  'Dr. Sarah Chen',
  'sarah.chen@ai-edge.org',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
  'talent',
  'Ph.D. in Computer Science specializing in Machine Learning, RAG, and vector search optimization. 7+ years building production AI microservices.',
  '{"github": "https://github.com/sarahchen-ai", "linkedin": "https://linkedin.com/in/sarahchen-ai", "website": "https://sarahchen.io"}'::jsonb,
  ARRAY['ai', 'Python', 'PyTorch', 'Vector Databases', 'LLM', 'Prompt Engineering', 'LangChain', 'pgvector'],
  ARRAY['Rust', 'Kubernetes'],
  ARRAY_FILL(0.025::float, ARRAY[1536])::vector(1536)
),
(
  '10000000-0000-0000-0000-000000000002',
  'Marcus Vance',
  'marcus.vance@devstudio.com',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
  'talent',
  'Senior Full-Stack Architect with 8 years of experience engineering high-scale React, Next.js, and Node.js enterprise solutions.',
  '{"github": "https://github.com/marcusvance", "linkedin": "https://linkedin.com/in/marcusvance", "website": "https://marcusvance.dev"}'::jsonb,
  ARRAY['frontend', 'backend', 'React', 'TypeScript', 'Next.js', 'Node.js', 'Express', 'PostgreSQL', 'GraphQL', 'TailwindCSS'],
  ARRAY['Solidity', 'PyTorch'],
  ARRAY_FILL(0.025::float, ARRAY[1536])::vector(1536)
),
(
  '10000000-0000-0000-0000-000000000003',
  'Elena Rostova',
  'elena.rostova@uxcraft.design',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=80',
  'talent',
  'Lead Product Designer & UI/UX Specialist crafting intuitive digital experiences for FinTech and HealthTech applications.',
  '{"dribbble": "https://dribbble.com/elenarostova", "linkedin": "https://linkedin.com/in/elenarostova"}'::jsonb,
  ARRAY['UI/UX Design', 'Figma', 'Design Systems', 'User Research', 'Prototyping', 'Accessibility'],
  ARRAY['TypeScript', 'Three.js'],
  ARRAY_FILL(0.025::float, ARRAY[1536])::vector(1536)
),
(
  '10000000-0000-0000-0000-000000000004',
  'Alex Rivera',
  'alex.rivera@mobileedge.io',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
  'talent',
  'Cross-platform Mobile Engineer focused on React Native and Flutter app development. Shipped 12+ mobile apps.',
  '{"github": "https://github.com/arivera-mobile", "linkedin": "https://linkedin.com/in/alexrivera-tech"}'::jsonb,
  ARRAY['React Native', 'Flutter', 'TypeScript', 'iOS', 'Android', 'GraphQL'],
  ARRAY['WebAssembly', 'C++'],
  ARRAY_FILL(0.025::float, ARRAY[1536])::vector(1536)
),
(
  '10000000-0000-0000-0000-000000000005',
  'David Kalu',
  'david.kalu@cloudops.net',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
  'talent',
  'DevOps & Cloud Site Reliability Engineer. Specialized in AWS/GCP cloud architecture, Terraform IaC, and Kubernetes.',
  '{"github": "https://github.com/dkalu-ops", "linkedin": "https://linkedin.com/in/davidkalu"}'::jsonb,
  ARRAY['backend', 'DevOps', 'AWS', 'Kubernetes', 'Docker', 'Terraform', 'CI/CD', 'PostgreSQL'],
  ARRAY['React', 'UI/UX Design'],
  ARRAY_FILL(0.025::float, ARRAY[1536])::vector(1536)
),
-- Partners
(
  '20000000-0000-0000-0000-000000000001',
  'Nexus AI Labs',
  'contact@nexusailabs.io',
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&auto=format&fit=crop&q=80',
  'partner',
  'Series-A funded research startup building next-generation multi-modal autonomous agents and vector search systems.',
  '{"website": "https://nexusailabs.io", "linkedin": "https://linkedin.com/company/nexus-ai-labs"}'::jsonb,
  ARRAY['AI', 'LLM', 'Python', 'Vector DB'],
  ARRAY[]::text[],
  NULL
),
(
  '20000000-0000-0000-0000-000000000002',
  'QuantumPay FinTech',
  'partnerships@quantumpay.com',
  'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=400&auto=format&fit=crop&q=80',
  'partner',
  'Global financial technology enterprise providing instant cross-border payments and merchant API gateways.',
  '{"website": "https://quantumpay.com", "linkedin": "https://linkedin.com/company/quantumpay"}'::jsonb,
  ARRAY['FinTech', 'Node.js', 'React', 'PostgreSQL'],
  ARRAY[]::text[],
  NULL
),
(
  '20000000-0000-0000-0000-000000000003',
  'ElevateHealth Tech',
  'info@elevatehealth.org',
  'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400&auto=format&fit=crop&q=80',
  'partner',
  'ElevateHealth leverages digital workflows and AI diagnostics to provide accessible healthcare across emerging markets.',
  '{"website": "https://elevatehealth.org"}'::jsonb,
  ARRAY['HealthTech', 'AI', 'React Native'],
  ARRAY[]::text[],
  NULL
),
-- Admin
(
  '30000000-0000-0000-0000-000000000001',
  'EdgeTalent Master Admin',
  'edgetalentindonesia@gmail.com',
  'https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?w=400&auto=format&fit=crop&q=80',
  'admin',
  'System administrator profile responsible for platform oversight and course moderation.',
  '{"website": "https://edgetalent.org"}'::jsonb,
  ARRAY['Admin'],
  ARRAY[]::text[],
  NULL
)
ON CONFLICT (id) DO UPDATE 
SET full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    bio = EXCLUDED.bio,
    avatar_url = EXCLUDED.avatar_url,
    skills = EXCLUDED.skills,
    skill_gaps = EXCLUDED.skill_gaps,
    skills_embedding = EXCLUDED.skills_embedding;

-- -------------------------------------------------------------------------
-- 2. SEED PROJECTS
-- -------------------------------------------------------------------------
INSERT INTO public.projects (id, partner_id, title, description, required_skills, budget, scope, embedding)
VALUES
(
  '40000000-0000-0000-0000-000000000001',
  '20000000-0000-0000-0000-000000000001',
  'Autonomous AI Customer Support Agent with RAG & pgvector',
  'Build a state-of-the-art retrieval-augmented generation (RAG) agent using PostgreSQL pgvector and OpenRouter LLMs with sub-500ms latency.',
  ARRAY['ai', 'Python', 'pgvector', 'LLM', 'Prompt Engineering', 'LangChain'],
  45000000.00,
  'medium-term',
  ARRAY_FILL(0.025::float, ARRAY[1536])::vector(1536)
),
(
  '40000000-0000-0000-0000-000000000002',
  '20000000-0000-0000-0000-000000000001',
  'LLM Fine-Tuning & Multi-Modal Vision Model Pipeline',
  'Fine-tune open-weight vision-language models for automated document inspection and key-value metadata extraction.',
  ARRAY['ai', 'Python', 'PyTorch', 'LLM'],
  70000000.00,
  'long-term',
  ARRAY_FILL(0.025::float, ARRAY[1536])::vector(1536)
),
(
  '40000000-0000-0000-0000-000000000003',
  '20000000-0000-0000-0000-000000000002',
  'High-Throughput Global Payments Ledger & Microservices',
  'Architect and implement transactional ledger microservices in Node.js / TypeScript handling concurrent balance updates and bank API webhooks.',
  ARRAY['backend', 'Node.js', 'TypeScript', 'PostgreSQL', 'Redis', 'FinTech'],
  60000000.00,
  'medium-term',
  ARRAY_FILL(0.025::float, ARRAY[1536])::vector(1536)
),
(
  '40000000-0000-0000-0000-000000000004',
  '20000000-0000-0000-0000-000000000002',
  'React & Tailwind Merchant Analytics Dashboard',
  'Build an interactive, responsive analytics portal for merchants featuring transaction charts, settlement reports, and refund workflows.',
  ARRAY['frontend', 'React', 'TypeScript', 'TailwindCSS', 'UI/UX Design'],
  35000000.00,
  'short-term',
  ARRAY_FILL(0.025::float, ARRAY[1536])::vector(1536)
),
(
  '40000000-0000-0000-0000-000000000005',
  '20000000-0000-0000-0000-000000000003',
  'AI Tele-Health Diagnostic & Symptom Checker Web App',
  'Build an intuitive patient web intake application integrated with AI diagnostic suggestion engines adhering to healthcare privacy standards.',
  ARRAY['frontend', 'React', 'TypeScript', 'HealthTech', 'UI/UX Design'],
  50000000.00,
  'medium-term',
  ARRAY_FILL(0.025::float, ARRAY[1536])::vector(1536)
)
ON CONFLICT (id) DO UPDATE
SET title = EXCLUDED.title,
    description = EXCLUDED.description,
    required_skills = EXCLUDED.required_skills,
    budget = EXCLUDED.budget,
    scope = EXCLUDED.scope,
    embedding = EXCLUDED.embedding;

-- -------------------------------------------------------------------------
-- 3. SEED APPLICATIONS
-- -------------------------------------------------------------------------
INSERT INTO public.applications (project_id, talent_id, status, match_percentage, match_breakdown)
VALUES
(
  '40000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000001',
  'accepted',
  98.50,
  '{"skills_match": 100, "experience_match": 96, "rag_expertise": 100}'::jsonb
),
(
  '40000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000002',
  'shortlisted',
  84.00,
  '{"skills_match": 80, "experience_match": 90}'::jsonb
),
(
  '40000000-0000-0000-0000-000000000003',
  '10000000-0000-0000-0000-000000000002',
  'accepted',
  96.00,
  '{"skills_match": 98, "backend_architecture": 96}'::jsonb
),
(
  '40000000-0000-0000-0000-000000000004',
  '10000000-0000-0000-0000-000000000002',
  'accepted',
  99.00,
  '{"skills_match": 100, "frontend_design": 98}'::jsonb
),
(
  '40000000-0000-0000-0000-000000000005',
  '10000000-0000-0000-0000-000000000003',
  'shortlisted',
  94.00,
  '{"skills_match": 96, "ui_design": 98}'::jsonb
)
ON CONFLICT (project_id, talent_id) DO UPDATE
SET status = EXCLUDED.status,
    match_percentage = EXCLUDED.match_percentage,
    match_breakdown = EXCLUDED.match_breakdown;

-- -------------------------------------------------------------------------
-- 4. SEED COURSES & LESSONS
-- -------------------------------------------------------------------------
INSERT INTO public.courses (id, title, description, skills_taught, provider, link)
VALUES
(
  '50000000-0000-0000-0000-000000000001',
  'Advanced React Architecture & Custom Hooks',
  'Master modern React 19 patterns, server components, fiber reconciliation, custom hook abstractions, and state management at scale.',
  ARRAY['frontend', 'React', 'TypeScript', 'State Management'],
  'EdgeTalent Academy',
  'https://edgetalent.org/courses/react-architecture'
),
(
  '50000000-0000-0000-0000-000000000002',
  'Enterprise Node.js Backend & Scalable Systems',
  'Deep dive into Node.js asynchronous I/O, Express middleware, database query optimization, Redis caching, and microservices.',
  ARRAY['backend', 'Node.js', 'Express', 'PostgreSQL', 'Redis'],
  'EdgeTalent Academy',
  'https://edgetalent.org/courses/nodejs-backend'
),
(
  '50000000-0000-0000-0000-000000000003',
  'AI Engineering & RAG Systems Masterclass',
  'Build end-to-end intelligent systems with OpenRouter LLMs, embeddings, vector databases (pgvector), and production RAG pipelines.',
  ARRAY['ai', 'LLM', 'Prompt Engineering', 'Vector Databases', 'Python', 'pgvector'],
  'EdgeTalent Academy',
  'https://edgetalent.org/courses/ai-engineering'
)
ON CONFLICT (id) DO UPDATE
SET title = EXCLUDED.title,
    description = EXCLUDED.description,
    skills_taught = EXCLUDED.skills_taught;

INSERT INTO public.course_lessons (id, course_id, title, content, sequence_order, duration_minutes)
VALUES
(
  '60000000-0000-0000-0000-000000000001',
  '50000000-0000-0000-0000-000000000001',
  'React 19 Fiber Mechanics & Render Lifecycle',
  '# React 19 Fiber Mechanics' || chr(10) || 'Understand how fibers represent component tree work units, priority queuing, and concurrent rendering features.',
  1,
  20
),
(
  '60000000-0000-0000-0000-000000000002',
  '50000000-0000-0000-0000-000000000001',
  'Designing Custom React Hooks & Abstracting UI Logic',
  '# Custom React Hooks' || chr(10) || 'Learn patterns for encapsulating complex state logic into testable, clean custom hooks across React applications.',
  2,
  25
),
(
  '60000000-0000-0000-0000-000000000003',
  '50000000-0000-0000-0000-000000000001',
  'Enterprise TypeScript Integration & Type Safety',
  '# TypeScript in React' || chr(10) || 'Master generic component props, union state types, and schema validation with Zod in React applications.',
  3,
  18
),
(
  '60000000-0000-0000-0000-000000000006',
  '50000000-0000-0000-0000-000000000003',
  'Vector Embeddings & Cosine Distance Mechanics',
  '# Understanding Embeddings' || chr(10) || 'Learn how neural networks map text tokens into 1536-dimensional semantic spaces and calculate cosine similarity.',
  1,
  20
),
(
  '60000000-0000-0000-0000-000000000007',
  '50000000-0000-0000-0000-000000000003',
  'Building Enterprise RAG Pipelines with pgvector',
  '# Enterprise RAG Pipelines' || chr(10) || 'Design end-to-end document chunking, vector indexing in PostgreSQL, and dynamic prompt context injection.',
  2,
  35
)
ON CONFLICT (id) DO UPDATE
SET title = EXCLUDED.title,
    content = EXCLUDED.content;

-- -------------------------------------------------------------------------
-- 5. SEED ENROLLMENTS & CERTIFICATES
-- -------------------------------------------------------------------------
INSERT INTO public.course_enrollments (user_id, course_id, completed_lessons, completed_at, credential_id, digital_signature)
VALUES
(
  '10000000-0000-0000-0000-000000000001',
  '50000000-0000-0000-0000-000000000003',
  ARRAY['60000000-0000-0000-0000-000000000006'::uuid, '60000000-0000-0000-0000-000000000007'::uuid],
  NOW() - INTERVAL '5 days',
  'CERT-AI-2026-9841',
  'sig_edgetalent_ai_9841_sarah_chen_verified'
),
(
  '10000000-0000-0000-0000-000000000002',
  '50000000-0000-0000-0000-000000000001',
  ARRAY['60000000-0000-0000-0000-000000000001'::uuid, '60000000-0000-0000-0000-000000000002'::uuid, '60000000-0000-0000-0000-000000000003'::uuid],
  NOW() - INTERVAL '12 days',
  'CERT-REACT-2026-4712',
  'sig_edgetalent_react_4712_marcus_vance_verified'
)
ON CONFLICT (user_id, course_id) DO UPDATE
SET completed_lessons = EXCLUDED.completed_lessons,
    completed_at = EXCLUDED.completed_at,
    credential_id = EXCLUDED.credential_id,
    digital_signature = EXCLUDED.digital_signature;

INSERT INTO public.talent_certificates (user_id, name, issuing_organization, issue_date, expiration_date, credential_id, credential_url, digital_signature)
VALUES
(
  '10000000-0000-0000-0000-000000000001',
  'Google Cloud Professional Machine Learning Engineer',
  'Google Cloud',
  '2025-06-15',
  '2027-06-15',
  'GCP-MLE-884912',
  'https://www.credential.net/gcp-mle-884912',
  'sig_gcp_mle_884912_sarah_chen'
),
(
  '10000000-0000-0000-0000-000000000002',
  'Meta Certified Senior Frontend Developer',
  'Meta',
  '2025-03-10',
  NULL,
  'META-FE-992104',
  'https://coursera.org/verify/meta-fe-992104',
  'sig_meta_fe_992104_marcus_vance'
),
(
  '10000000-0000-0000-0000-000000000005',
  'AWS Certified Solutions Architect – Professional',
  'Amazon Web Services',
  '2024-11-20',
  '2027-11-20',
  'AWS-SAP-773419',
  'https://aws.amazon.com/verification/AWS-SAP-773419',
  'sig_aws_sap_773419_david_kalu'
)
ON CONFLICT DO NOTHING;

-- -------------------------------------------------------------------------
-- 6. SEED FUNDING OPPORTUNITIES
-- -------------------------------------------------------------------------
INSERT INTO public.funding_opportunities (id, title, description, content, amount, eligibility, deadline, link, category)
VALUES
(
  '70000000-0000-0000-0000-000000000001',
  'Y Combinator Winter 2027 Accelerator',
  'YC invests Rp 7.500.000.000 in early-stage tech founders twice a year. Gain access to elite founder networks and global venture capital demo day.',
  'Y Combinator is a world-renowned startup accelerator. Every accepted startup receives Rp 7.500.000.000 investment split across post-money safe and uncapped MFN terms.',
  'Rp 7.500.000.000',
  'Open to early-stage technology founders globally.',
  'October 15, 2026',
  'https://www.ycombinator.com/apply',
  'Accelerators'
),
(
  '70000000-0000-0000-0000-000000000002',
  'Google for Startups Accelerator: AI First',
  'Equity-free program providing up to Rp 1.500.000.000 in Google Cloud credits, technical AI mentorship, and access to Google machine learning experts.',
  'The Google for Startups Accelerator: AI First targets high-potential startups developing core products with Artificial Intelligence and Machine Learning.',
  'Hingga Rp 1.500.000.000 dalam Kredit Cloud + Equity-Free Support',
  'Seed to Series-A startups with AI/ML integrated into their core product.',
  'September 30, 2026',
  'https://startup.google.com/accelerator/',
  'Accelerators'
),
(
  '70000000-0000-0000-0000-000000000003',
  'Thiel Fellowship for Young Entrepreneurs',
  'Rp 1.500.000.000 equity-free grant awarded to young innovators building breakthrough technologies outside traditional academia.',
  'The Thiel Fellowship is a two-year program founded by Peter Thiel giving Rp 1.500.000.000 to young people who want to build new things instead of attending college.',
  'Rp 1.500.000.000 (Equity-Free Grant)',
  'Entrepreneurs aged 22 or under willing to pursue their startup full-time.',
  'Rolling Applications',
  'https://www.thielfellowship.org/',
  'Grants'
)
ON CONFLICT (id) DO UPDATE
SET title = EXCLUDED.title,
    description = EXCLUDED.description,
    content = EXCLUDED.content;

-- -------------------------------------------------------------------------
-- 7. SEED EVENTS & RSVPs
-- -------------------------------------------------------------------------
INSERT INTO public.events (id, title, description, content, event_date, location, organizer, organizer_id, category, capacity, link)
VALUES
(
  '80000000-0000-0000-0000-000000000001',
  'EdgeTalent Global AI & Vector Search Hackathon 2026',
  'A 48-hour global virtual hackathon focused on building open-source AI agents and pgvector developer extensions.',
  'Join developers, AI researchers, and designers for a 48-hour hackathon. Top 3 winning teams receive Rp 150.000.000 in cash prizes.',
  NOW() + INTERVAL '14 days',
  'Virtual (Discord / Zoom)',
  'EdgeTalent Foundation',
  '30000000-0000-0000-0000-000000000001',
  'Hackathon',
  250,
  'https://edgetalent.org/hackathon-2026'
),
(
  '80000000-0000-0000-0000-000000000002',
  'Building Production AI Agents with Gemini & pgvector',
  'Hands-on technical workshop on defining function-calling schemas, system instructions, and vector matching pipelines.',
  'Learn how to build autonomous coding and data agents using Google Gemini models and PostgreSQL vector search.',
  NOW() + INTERVAL '5 days',
  'Virtual (Zoom)',
  'Google Developer Group',
  NULL,
  'Workshop',
  120,
  'https://gdg.community.dev/events/'
)
ON CONFLICT (id) DO UPDATE
SET title = EXCLUDED.title,
    description = EXCLUDED.description,
    content = EXCLUDED.content;

INSERT INTO public.event_registrations (event_id, user_id)
VALUES
('80000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001'),
('80000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002'),
('80000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001')
ON CONFLICT (event_id, user_id) DO NOTHING;

-- -------------------------------------------------------------------------
-- 8. SEED QUIZ QUESTIONS
-- -------------------------------------------------------------------------
INSERT INTO public.quiz_questions (category, question, options, answer)
VALUES
('frontend', 'Which hook in React 19 is specifically designed to handle asynchronous form actions?', ARRAY['useActionState', 'useEffect', 'useMemo', 'useRef'], 'useActionState'),
('frontend', 'What is the primary benefit of React Server Components (RSC)?', ARRAY['Zero client-side JavaScript bundle size for server components', 'Faster CSS compilation', 'Automatic Redux store synchronization', 'Replacing WebSockets entirely'], 'Zero client-side JavaScript bundle size for server components'),
('backend', 'In PostgreSQL, which index type is optimized for cosine distance search on pgvector embeddings?', ARRAY['HNSW (Hierarchical Navigable Small World)', 'B-Tree', 'Hash Index', 'BRIN'], 'HNSW (Hierarchical Navigable Small World)'),
('ai', 'In Retrieval-Augmented Generation (RAG), what is chunking used for?', ARRAY['Breaking large text documents into smaller semantically cohesive segments for embedding', 'Compressing audio files', 'Translating code into Python', 'Encrypting API keys'], 'Breaking large text documents into smaller semantically cohesive segments for embedding'),
('english', 'Select the grammatically correct sentence for professional business communication:', ARRAY['We have received your application and will review it shortly.', 'We have received your application and will review it short.', 'We received your application and review it shortly.', 'We receive your application and reviewing it shortly.'], 'We have received your application and will review it shortly.'),
('iq', 'What number comes next in the sequence? 2, 6, 12, 20, 30, ___', ARRAY['42', '40', '44', '46'], '42'),
('mbti', 'In a team workspace environment, where do you draw your primary energy from?', ARRAY['Collaborating actively with teammates and group brainstorming (Extraversion - E)', 'Deep focused solo work and independent problem solving (Introversion - I)'], 'Collaborating actively with teammates and group brainstorming (Extraversion - E)'),
('disc', 'When facing a high-pressure project obstacle, what is your natural default reaction?', ARRAY['Take charge directly and drive immediate results (Dominance - D)', 'Rally the team enthusiastically and inspire creative ideas (Influence - I)', 'Maintain steady composure and support team members (Steadiness - S)', 'Analyze the root cause methodically and ensure precision (Conscientiousness - C)'], 'Take charge directly and drive immediate results (Dominance - D)')
ON CONFLICT DO NOTHING;
