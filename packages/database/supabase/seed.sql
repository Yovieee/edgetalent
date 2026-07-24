-- =========================================================================
-- EdgeTalent Database Master Seed File
-- High-Quality Production-Grade Dummy Data
-- =========================================================================

-- Enable pgvector extension if not exists
CREATE EXTENSION IF NOT EXISTS vector;

-- -------------------------------------------------------------------------
-- 1. PROFILES & AUTH MOCK SETUP
-- -------------------------------------------------------------------------

-- Clean up existing seed data (if re-running seed)
DELETE FROM public.event_registrations WHERE true;
DELETE FROM public.events WHERE true;
DELETE FROM public.funding_opportunities WHERE true;
DELETE FROM public.talent_certificates WHERE true;
DELETE FROM public.course_enrollments WHERE true;
DELETE FROM public.course_lessons WHERE true;
DELETE FROM public.courses WHERE true;
DELETE FROM public.applications WHERE true;
DELETE FROM public.projects WHERE true;
DELETE FROM public.profiles WHERE id IN (
  '10000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000002',
  '10000000-0000-0000-0000-000000000003',
  '10000000-0000-0000-0000-000000000004',
  '10000000-0000-0000-0000-000000000005',
  '10000000-0000-0000-0000-000000000006',
  '10000000-0000-0000-0000-000000000007',
  '10000000-0000-0000-0000-000000000008',
  '10000000-0000-0000-0000-000000000009',
  '10000000-0000-0000-0000-000000000010',
  '20000000-0000-0000-0000-000000000001',
  '20000000-0000-0000-0000-000000000002',
  '20000000-0000-0000-0000-000000000003',
  '20000000-0000-0000-0000-000000000004',
  '20000000-0000-0000-0000-000000000005',
  '30000000-0000-0000-0000-000000000001'
);

-- Seed Profiles (Talents, Partners, Admin)
INSERT INTO public.profiles (id, full_name, email, avatar_url, role, bio, portfolio_links, skills, skill_gaps) VALUES
-- Talents
(
  '10000000-0000-0000-0000-000000000001',
  'Dr. Sarah Chen',
  'sarah.chen@ai-edge.org',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
  'talent',
  'Ph.D. in Computer Science specializing in Applied Machine Learning, Retrieval-Augmented Generation (RAG), and vector search optimization. 7+ years building production AI microservices.',
  '{"github": "https://github.com/sarahchen-ai", "linkedin": "https://linkedin.com/in/sarahchen-ai", "website": "https://sarahchen.io"}'::jsonb,
  ARRAY['ai', 'Python', 'PyTorch', 'Vector Databases', 'LLM', 'Prompt Engineering', 'LangChain', 'pgvector'],
  ARRAY['Rust', 'Kubernetes']
),
(
  '10000000-0000-0000-0000-000000000002',
  'Marcus Vance',
  'marcus.vance@devstudio.com',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
  'talent',
  'Senior Full-Stack Architect with 8 years of experience engineering high-scale React, Next.js, and Node.js enterprise solutions. Passionate about design systems, web performance, and state management.',
  '{"github": "https://github.com/marcusvance", "linkedin": "https://linkedin.com/in/marcusvance", "website": "https://marcusvance.dev"}'::jsonb,
  ARRAY['frontend', 'backend', 'React', 'TypeScript', 'Next.js', 'Node.js', 'Express', 'PostgreSQL', 'GraphQL', 'TailwindCSS'],
  ARRAY['Solidity', 'PyTorch']
),
(
  '10000000-0000-0000-0000-000000000003',
  'Elena Rostova',
  'elena.rostova@uxcraft.design',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=80',
  'talent',
  'Lead Product Designer & UI/UX Specialist crafting intuitive digital experiences for FinTech and HealthTech applications. Expert in component design tokens, accessibility (WCAG), and micro-interactions.',
  '{"dribbble": "https://dribbble.com/elenarostova", "linkedin": "https://linkedin.com/in/elenarostova", "website": "https://elenarostova.design"}'::jsonb,
  ARRAY['UI/UX Design', 'Figma', 'Design Systems', 'User Research', 'Prototyping', 'Accessibility'],
  ARRAY['TypeScript', 'Three.js']
),
(
  '10000000-0000-0000-0000-000000000004',
  'Alex Rivera',
  'alex.rivera@mobileedge.io',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
  'talent',
  'Cross-platform Mobile Engineer focused on React Native and Flutter app development. Shipped 12+ apps to the App Store and Google Play with emphasis on smooth 60fps animations and offline sync.',
  '{"github": "https://github.com/arivera-mobile", "linkedin": "https://linkedin.com/in/alexrivera-tech"}'::jsonb,
  ARRAY['React Native', 'Flutter', 'TypeScript', 'iOS', 'Android', 'GraphQL', 'REST API'],
  ARRAY['WebAssembly', 'C++']
),
(
  '10000000-0000-0000-0000-000000000005',
  'David Kalu',
  'david.kalu@cloudops.net',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
  'talent',
  'DevOps & Cloud Site Reliability Engineer. Specialized in AWS/GCP cloud architecture, Terraform IaC, Kubernetes orchestration, and automated CI/CD pipelines for zero-downtime deployments.',
  '{"github": "https://github.com/dkalu-ops", "linkedin": "https://linkedin.com/in/davidkalu"}'::jsonb,
  ARRAY['backend', 'DevOps', 'AWS', 'Kubernetes', 'Docker', 'Terraform', 'CI/CD', 'PostgreSQL', 'Redis'],
  ARRAY['React', 'UI/UX Design']
),
(
  '10000000-0000-0000-0000-000000000006',
  'Aisha Patel',
  'aisha.patel@datanode.org',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80',
  'talent',
  'Data Platform Engineer building real-time data pipelines, ETL infrastructure, and analytics engines using Apache Spark, Snowflake, Python, and SQL.',
  '{"github": "https://github.com/aishapatel-data", "linkedin": "https://linkedin.com/in/aishapatel"}'::jsonb,
  ARRAY['backend', 'Python', 'SQL', 'Snowflake', 'Apache Spark', 'Data Engineering', 'PostgreSQL'],
  ARRAY['Frontend', 'Figma']
),
(
  '10000000-0000-0000-0000-000000000007',
  'James Thorne',
  'james.thorne@chaindef.io',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&auto=format&fit=crop&q=80',
  'talent',
  'Smart Contract Developer & Web3 Security Auditor. Expert in Solidity, Rust, Ethereum layer-2 scaling, and formal verification of decentralized financial protocols.',
  '{"github": "https://github.com/jthorne-sec", "linkedin": "https://linkedin.com/in/jamesthorne"}'::jsonb,
  ARRAY['Solidity', 'Rust', 'Web3', 'Smart Contracts', 'Security Auditing', 'Ethereum'],
  ARRAY['Python', 'PyTorch']
),
(
  '10000000-0000-0000-0000-000000000008',
  'Maya Lin',
  'maya.lin@growthcraft.co',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
  'talent',
  'Technical Product Marketer & Growth Engineer. Specializes in conversion rate optimization (CRO), user retention funnels, product analytics, and SEO for SaaS startups.',
  '{"linkedin": "https://linkedin.com/in/mayalin-growth", "website": "https://mayalin.co"}'::jsonb,
  ARRAY['Growth Marketing', 'Product Analytics', 'SEO', 'Conversion Optimization', 'Product Strategy'],
  ARRAY['Docker', 'Kubernetes']
),
(
  '10000000-0000-0000-0000-000000000009',
  'Liam O''Connor',
  'liam.oconnor@cyberguard.tech',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&auto=format&fit=crop&q=80',
  'talent',
  'Cybersecurity Analyst & Penetration Tester. Focused on cloud security posture, OWASP top 10 auditing, compliance (SOC 2, ISO 27001), and API security.',
  '{"github": "https://github.com/liam-cyber", "linkedin": "https://linkedin.com/in/liamoconnor-sec"}'::jsonb,
  ARRAY['Cybersecurity', 'Penetration Testing', 'API Security', 'SOC 2', 'Python', 'Linux'],
  ARRAY['Flutter', 'React']
),
(
  '10000000-0000-0000-0000-000000000010',
  'Priya Sharma',
  'priya.sharma@agilepm.io',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&auto=format&fit=crop&q=80',
  'talent',
  'Technical Product Manager & Certified Scrum Master. 6+ years leading cross-functional engineering teams to ship high-impact SaaS products on schedule.',
  '{"linkedin": "https://linkedin.com/in/priyasharma-pm", "website": "https://priyasharma.pm"}'::jsonb,
  ARRAY['Product Management', 'Agile/Scrum', 'Product Strategy', 'Roadmapping', 'Jira', 'User Stories'],
  ARRAY['Rust', 'Solidity']
),

-- Partners
(
  '20000000-0000-0000-0000-000000000001',
  'Nexus AI Labs',
  'contact@nexusailabs.io',
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&auto=format&fit=crop&q=80',
  'partner',
  'Nexus AI Labs is a Series-A funded research startup building next-generation multi-modal autonomous agents and vector search systems for enterprise decision-making.',
  '{"website": "https://nexusailabs.io", "linkedin": "https://linkedin.com/company/nexus-ai-labs"}'::jsonb,
  ARRAY['AI', 'LLM', 'Python', 'Vector DB'],
  ARRAY[]::text[]
),
(
  '20000000-0000-0000-0000-000000000002',
  'QuantumPay FinTech',
  'partnerships@quantumpay.com',
  'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=400&auto=format&fit=crop&q=80',
  'partner',
  'QuantumPay is a global financial technology enterprise providing instant, sub-second cross-border payments and programmable merchant API gateways.',
  '{"website": "https://quantumpay.com", "linkedin": "https://linkedin.com/company/quantumpay"}'::jsonb,
  ARRAY['FinTech', 'Node.js', 'React', 'PostgreSQL'],
  ARRAY[]::text[]
),
(
  '20000000-0000-0000-0000-000000000003',
  'ElevateHealth Tech',
  'info@elevatehealth.org',
  'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400&auto=format&fit=crop&q=80',
  'partner',
  'ElevateHealth leverages digital health workflows, AI-assisted diagnostics, and remote patient monitoring to provide accessible healthcare across emerging markets.',
  '{"website": "https://elevatehealth.org", "linkedin": "https://linkedin.com/company/elevatehealth"}'::jsonb,
  ARRAY['HealthTech', 'AI', 'React Native', 'AWS'],
  ARRAY[]::text[]
),
(
  '20000000-0000-0000-0000-000000000004',
  'GreenStack Energy',
  'hello@greenstack.energy',
  'https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?w=400&auto=format&fit=crop&q=80',
  'partner',
  'GreenStack Energy develops IoT sensor networks and clean-tech telemetry dashboards for real-time microgrid power distribution monitoring.',
  '{"website": "https://greenstack.energy", "linkedin": "https://linkedin.com/company/greenstack"}'::jsonb,
  ARRAY['CleanTech', 'IoT', 'Python', 'TypeScript', 'DevOps'],
  ARRAY[]::text[]
),
(
  '20000000-0000-0000-0000-000000000005',
  'CyberEdge Security',
  'support@cyberedge.tech',
  'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=400&auto=format&fit=crop&q=80',
  'partner',
  'CyberEdge Security offers zero-trust API protection, automated cloud vulnerability scanning, and real-time threat intelligence software.',
  '{"website": "https://cyberedge.tech", "linkedin": "https://linkedin.com/company/cyberedge"}'::jsonb,
  ARRAY['Cybersecurity', 'AWS', 'Rust', 'Kubernetes'],
  ARRAY[]::text[]
),

-- Admin Profile
(
  '30000000-0000-0000-0000-000000000001',
  'EdgeTalent Master Admin',
  'admin@edgetalent.com',
  'https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?w=400&auto=format&fit=crop&q=80',
  'admin',
  'System administrator profile responsible for platform oversight, course moderation, and partner verification.',
  '{"website": "https://edgetalent.org"}'::jsonb,
  ARRAY['Admin', 'Platform Management'],
  ARRAY[]::text[]
);

-- -------------------------------------------------------------------------
-- 2. PROJECTS (MARKETPLACE OPPORTUNITIES)
-- -------------------------------------------------------------------------

INSERT INTO public.projects (id, partner_id, title, description, required_skills, budget, scope) VALUES
(
  '40000000-0000-0000-0000-000000000001',
  '20000000-0000-0000-0000-000000000001',
  'Autonomous AI Customer Support Agent with RAG & pgvector',
  'We are seeking an AI Engineer to build a state-of-the-art retrieval-augmented generation (RAG) agent. The system will index enterprise knowledge bases into PostgreSQL using pgvector and serve dynamic responses via OpenRouter LLM APIs with sub-500ms latency.',
  ARRAY['ai', 'Python', 'pgvector', 'LLM', 'Prompt Engineering', 'LangChain'],
  4500.00,
  'medium-term'
),
(
  '40000000-0000-0000-0000-000000000002',
  '20000000-0000-0000-0000-000000000001',
  'LLM Fine-Tuning & Multi-Modal Vision Model Pipeline',
  'Looking for a Machine Learning Specialist to fine-tune open-weight vision-language models (e.g. LLaVA, Qwen-VL) for automated document inspection and key-value metadata extraction.',
  ARRAY['ai', 'Python', 'PyTorch', 'LLM', 'Data Engineering'],
  7000.00,
  'long-term'
),
(
  '40000000-0000-0000-0000-000000000002',
  '20000000-0000-0000-0000-000000000002',
  'High-Throughput Global Payments Ledger & Microservices',
  'Architect and implement transactional ledger microservices in Node.js / TypeScript. Must handle concurrent balance updates, idempotent webhook processing, and bank API gateway integrations.',
  ARRAY['backend', 'Node.js', 'TypeScript', 'PostgreSQL', 'Redis', 'FinTech'],
  6000.00,
  'medium-term'
),
(
  '40000000-0000-0000-0000-000000000003',
  '20000000-0000-0000-0000-000000000002',
  'React & Tailwind Merchant Analytics Dashboard',
  'We need a Senior Frontend Engineer to build an interactive, responsive analytics portal for merchants. Features include transaction charts, settlement reports, refund workflows, and custom theme tokens.',
  ARRAY['frontend', 'React', 'TypeScript', 'TailwindCSS', 'UI/UX Design'],
  3500.00,
  'short-term'
),
(
  '40000000-0000-0000-0000-000000000005',
  '20000000-0000-0000-0000-000000000003',
  'AI Tele-Health Diagnostic & Symptom Checker Web App',
  'Build an intuitive patient web intake application integrated with AI diagnostic suggestion engines. Requires compliance with healthcare privacy best practices and ultra-clean UI/UX.',
  ARRAY['frontend', 'React', 'TypeScript', 'HealthTech', 'UI/UX Design'],
  5000.00,
  'medium-term'
),
(
  '40000000-0000-0000-0000-000000000006',
  '20000000-0000-0000-0000-000000000004',
  'Clean-Tech Smart Grid Telemetry & Real-Time Analytics',
  'Build high-frequency IoT streaming telemetry pipelines capturing solar microgrid energy metrics into PostgreSQL/Timescale. Includes building real-time dashboard visualizations.',
  ARRAY['backend', 'Python', 'Apache Spark', 'PostgreSQL', 'DevOps', 'CleanTech'],
  8000.00,
  'long-term'
),
(
  '40000000-0000-0000-0000-000000000007',
  '20000000-0000-0000-0000-000000000005',
  'Enterprise Zero-Trust API Gateway & Security Audit',
  'Perform security penetration testing and threat modeling for our core cloud infrastructure. Implement OAuth2/OIDC token introspection and rate-limiting middleware.',
  ARRAY['Cybersecurity', 'API Security', 'AWS', 'Penetration Testing'],
  4000.00,
  'short-term'
),
(
  '40000000-0000-0000-0000-000000000008',
  '20000000-0000-0000-0000-000000000002',
  'Cross-Platform Flutter Mobile Wallet & Biometrics',
  'Develop a modern iOS/Android mobile wallet application with biometric authentication (FaceID/Fingerprint), QR code scanning, and instant P2P transfers.',
  ARRAY['Flutter', 'React Native', 'iOS', 'Android', 'FinTech'],
  5500.00,
  'medium-term'
);

-- Mock Vector Embeddings (1536 float arrays)
UPDATE public.profiles SET skills_embedding = ARRAY_FILL(0.025::float, ARRAY[1536])::vector(1536) WHERE role = 'talent';
UPDATE public.projects SET embedding = ARRAY_FILL(0.025::float, ARRAY[1536])::vector(1536) WHERE true;

-- -------------------------------------------------------------------------
-- 3. APPLICATIONS
-- -------------------------------------------------------------------------

INSERT INTO public.applications (project_id, talent_id, status, match_percentage, match_breakdown) VALUES
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
  '{"skills_match": 80, "experience_match": 90, "node_expertise": 95}'::jsonb
),
(
  '40000000-0000-0000-0000-000000000003',
  '10000000-0000-0000-0000-000000000002',
  'accepted',
  96.00,
  '{"skills_match": 98, "experience_match": 94, "backend_architecture": 96}'::jsonb
),
(
  '40000000-0000-0000-0000-000000000004',
  '10000000-0000-0000-0000-000000000002',
  'accepted',
  99.00,
  '{"skills_match": 100, "experience_match": 98, "frontend_design": 98}'::jsonb
),
(
  '40000000-0000-0000-0000-000000000004',
  '10000000-0000-0000-0000-000000000003',
  'reviewing',
  91.50,
  '{"skills_match": 95, "experience_match": 88, "ui_design": 100}'::jsonb
),
(
  '40000000-0000-0000-0000-000000000005',
  '10000000-0000-0000-0000-000000000003',
  'shortlisted',
  94.00,
  '{"skills_match": 96, "experience_match": 92, "healthtech_ui": 95}'::jsonb
),
(
  '40000000-0000-0000-0000-000000000006',
  '10000000-0000-0000-0000-000000000006',
  'accepted',
  97.00,
  '{"skills_match": 98, "experience_match": 95, "data_pipeline": 98}'::jsonb
),
(
  '40000000-0000-0000-0000-000000000006',
  '10000000-0000-0000-0000-000000000005',
  'reviewing',
  89.00,
  '{"skills_match": 88, "experience_match": 90, "devops_cloud": 94}'::jsonb
),
(
  '40000000-0000-0000-0000-000000000007',
  '10000000-0000-0000-0000-000000000009',
  'accepted',
  99.50,
  '{"skills_match": 100, "experience_match": 99, "security_audit": 100}'::jsonb
),
(
  '40000000-0000-0000-0000-000000000008',
  '10000000-0000-0000-0000-000000000004',
  'accepted',
  96.50,
  '{"skills_match": 98, "experience_match": 95, "mobile_flutter": 98}'::jsonb
);

-- -------------------------------------------------------------------------
-- 4. COURSES & LESSONS (UPSKILLING HUB)
-- -------------------------------------------------------------------------

-- Insert additional courses if missing
INSERT INTO public.courses (id, title, description, skills_taught, provider, link) VALUES
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
),
(
  '50000000-0000-0000-0000-000000000004',
  'Startup School: How to Build & Scale a Startup',
  'A comprehensive practical guide for early-stage founders. Learn idea evaluation, talking to users, finding product-market fit, and pitching investors.',
  ARRAY['Entrepreneurship', 'Product-Market Fit', 'Pitching', 'Startup Scaling'],
  'Y Combinator',
  'https://www.startupschool.org/'
),
(
  '50000000-0000-0000-0000-000000000005',
  'DevOps, Docker & Kubernetes Production Deployment',
  'Learn containerization with Docker, infrastructure as code with Terraform, and zero-downtime microservice deployments on Kubernetes.',
  ARRAY['DevOps', 'Docker', 'Kubernetes', 'AWS', 'CI/CD'],
  'EdgeTalent Academy',
  'https://edgetalent.org/courses/devops-kubernetes'
)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description;

-- Insert Lessons for Courses
INSERT INTO public.course_lessons (id, course_id, title, content, sequence_order, duration_minutes) VALUES
-- React Course Lessons
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

-- Node.js Course Lessons
(
  '60000000-0000-0000-0000-000000000004',
  '50000000-0000-0000-0000-000000000002',
  'Node.js Event Loop & Microtask Queue Deep Dive',
  '# The Node.js Event Loop' || chr(10) || 'Explore libuv thread pools, timer phases, I/O callbacks, process.nextTick, and promise microtasks.',
  1,
  22
),
(
  '60000000-0000-0000-0000-000000000005',
  '50000000-0000-0000-0000-000000000002',
  'PostgreSQL Query Optimization & Connection Pooling',
  '# DB Query Optimization' || chr(10) || 'Learn EXPLAIN ANALYZE, B-Tree and GIN indexing strategies, and connection pool sizing under high concurrent traffic.',
  2,
  30
),

-- AI Engineering Lessons
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
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, content = EXCLUDED.content;

-- -------------------------------------------------------------------------
-- 5. COURSE ENROLLMENTS & CERTIFICATES
-- -------------------------------------------------------------------------

INSERT INTO public.course_enrollments (user_id, course_id, completed_lessons, completed_at, credential_id, digital_signature) VALUES
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
),
(
  '10000000-0000-0000-0000-000000000002',
  '50000000-0000-0000-0000-000000000002',
  ARRAY['60000000-0000-0000-0000-000000000004'::uuid, '60000000-0000-0000-0000-000000000005'::uuid],
  NOW() - INTERVAL '2 days',
  'CERT-NODE-2026-3109',
  'sig_edgetalent_node_3109_marcus_vance_verified'
),
(
  '10000000-0000-0000-0000-000000000005',
  '50000000-0000-0000-0000-000000000005',
  ARRAY[]::uuid[],
  NULL,
  NULL,
  NULL
);

-- External Certificates
INSERT INTO public.talent_certificates (user_id, name, issuing_organization, issue_date, expiration_date, credential_id, credential_url, digital_signature) VALUES
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
),
(
  '10000000-0000-0000-0000-000000000005',
  'Certified Kubernetes Administrator (CKA)',
  'Cloud Native Computing Foundation (CNCF)',
  '2025-01-14',
  '2028-01-14',
  'CKA-2400-55912',
  'https://cncf.io/verify/CKA-2400-55912',
  'sig_cncf_cka_55912_david_kalu'
);

-- -------------------------------------------------------------------------
-- 6. FUNDING OPPORTUNITIES
-- -------------------------------------------------------------------------

INSERT INTO public.funding_opportunities (id, title, description, content, amount, eligibility, deadline, link, category) VALUES
(
  '70000000-0000-0000-0000-000000000001',
  'Y Combinator Winter 2027 Accelerator',
  'YC invests $500,000 in early-stage tech founders twice a year. Gain access to elite founder networks and global venture capital demo day.',
  'Y Combinator is a world-renowned startup accelerator. Every accepted startup receives $500,000 investment split across post-money safe and uncapped MFN terms. Beyond funding, founders receive hands-on technical and go-to-market mentorship from industry leaders.',
  '$500,000',
  'Open to early-stage technology founders globally.',
  'October 15, 2026',
  'https://www.ycombinator.com/apply',
  'Accelerators'
),
(
  '70000000-0000-0000-0000-000000000002',
  'Google for Startups Accelerator: AI First',
  'Equity-free program providing up to $100,000 in Google Cloud credits, technical AI mentorship, and access to Google machine learning experts.',
  'The Google for Startups Accelerator: AI First targets high-potential startups developing core products with Artificial Intelligence and Machine Learning. Selected startups receive dedicated cloud compute, architectural reviews, and product strategy guidance.',
  'Up to $100,000 in Cloud Credits + Equity-Free Support',
  'Seed to Series-A startups with AI/ML integrated into their core product.',
  'September 30, 2026',
  'https://startup.google.com/accelerator/',
  'Accelerators'
),
(
  '70000000-0000-0000-0000-000000000003',
  'Thiel Fellowship for Young Entrepreneurs',
  '$100,000 equity-free grant awarded to young innovators building breakthrough technologies outside traditional academia.',
  'The Thiel Fellowship is a two-year program founded by Peter Thiel giving $100,000 to young people who want to build new things instead of attending college.',
  '$100,000 (Equity-Free Grant)',
  'Entrepreneurs aged 22 or under willing to pursue their startup full-time.',
  'Rolling Applications',
  'https://www.thielfellowship.org/',
  'Grants'
),
(
  '70000000-0000-0000-0000-000000000004',
  'NSF SBIR/STTR America''s Seed Fund',
  'Up to $2,000,000 in non-dilutive federal research grant funding for high-risk, high-impact deep technology startups.',
  'The National Science Foundation Small Business Innovation Research (SBIR) program provides non-dilutive R&D grants for commercializing scientific breakthroughs without equity loss.',
  'Up to $2,000,000 (Equity-Free Grant)',
  'U.S.-based small tech businesses under 500 employees.',
  'November 10, 2026',
  'https://seedfund.nsf.gov/',
  'Grants'
),
(
  '70000000-0000-0000-0000-000000000005',
  'Sequoia Capital Surge Early-Stage Investment',
  'Rapid scale-up program investing $1M–$3M in early-stage startups across Southeast Asia, India, and global markets.',
  'Sequoia Surge pairs seed capital with company-building workshops, engineering recruitment assistance, and introductions to top institutional co-investors.',
  '$1,000,000 - $3,000,000 Equity Investment',
  'Early-stage founders building scalable software or FinTech platforms.',
  'December 01, 2026',
  'https://www.surgeahead.com/',
  'Equity/VC'
)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, content = EXCLUDED.content;

-- -------------------------------------------------------------------------
-- 7. EVENTS & EVENT REGISTRATIONS
-- -------------------------------------------------------------------------

INSERT INTO public.events (id, title, description, content, event_date, location, organizer, organizer_id, category, capacity, link) VALUES
(
  '80000000-0000-0000-0000-000000000001',
  'EdgeTalent Global AI & Vector Search Hackathon 2026',
  'A 48-hour global virtual hackathon focused on building open-source AI agents and pgvector developer extensions.',
  'Join developers, AI researchers, and designers for a 48-hour hackathon. Top 3 winning teams receive $10,000 in cash prizes, cloud credits, and direct investor introductions.',
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
  'Learn how to build autonomous coding and data agents using Google Gemini models and PostgreSQL vector search. Live coding demonstration with source code provided.',
  NOW() + INTERVAL '5 days',
  'Virtual (Zoom)',
  'Google Developer Group',
  NULL,
  'Workshop',
  120,
  'https://gdg.community.dev/events/'
),
(
  '80000000-0000-0000-0000-000000000003',
  'Tech Founders Pitch & Venture Networking Night',
  'Connect with seed venture capital partners, angel investors, and fellow tech founders.',
  'Selected early-stage startups present 3-minute elevator pitches to a panel of VC investors followed by open networking and drinks.',
  NOW() + INTERVAL '21 days',
  'Innovation Hub, Tech District & Online',
  'Nexus AI & EdgeTalent',
  '20000000-0000-0000-0000-000000000001',
  'Networking',
  100,
  'https://edgetalent.org/pitch-night'
)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, content = EXCLUDED.content;

-- Event RSVPs
INSERT INTO public.event_registrations (event_id, user_id) VALUES
('80000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001'),
('80000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002'),
('80000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000005'),
('80000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001'),
('80000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002'),
('80000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000010')
ON CONFLICT (event_id, user_id) DO NOTHING;

-- -------------------------------------------------------------------------
-- 8. QUIZ QUESTIONS
-- -------------------------------------------------------------------------

INSERT INTO public.quiz_questions (category, question, options, answer) VALUES
('frontend', 'Which hook in React 19 is specifically designed to handle asynchronous form actions?', ARRAY['useActionState', 'useEffect', 'useMemo', 'useRef'], 'useActionState'),
('frontend', 'What is the primary benefit of React Server Components (RSC)?', ARRAY['Zero client-side JavaScript bundle size for server components', 'Faster CSS compilation', 'Automatic Redux store synchronization', 'Replacing WebSockets entirely'], 'Zero client-side JavaScript bundle size for server components'),
('backend', 'In PostgreSQL, which index type is optimized for cosine distance search on pgvector embeddings?', ARRAY['HNSW (Hierarchical Navigable Small World)', 'B-Tree', 'Hash Index', 'BRIN'], 'HNSW (Hierarchical Navigable Small World)'),
('backend', 'Which HTTP status code corresponds to 429?', ARRAY['Too Many Requests (Rate Limited)', 'Unauthorized', 'Payload Too Large', 'Unprocessable Entity'], 'Too Many Requests (Rate Limited)'),
('ai', 'In Retrieval-Augmented Generation (RAG), what is chunking used for?', ARRAY['Breaking large text documents into smaller semantically cohesive segments for embedding', 'Compressing audio files', 'Translating code into Python', 'Encrypting API keys'], 'Breaking large text documents into smaller semantically cohesive segments for embedding'),
('ai', 'What metric measures the directional alignment between two vector embeddings regardless of magnitude?', ARRAY['Cosine Similarity', 'Euclidean Distance', 'Manhattan Distance', 'Hamming Distance'], 'Cosine Similarity')
ON CONFLICT DO NOTHING;
