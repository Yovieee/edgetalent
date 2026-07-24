import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// Load environment variables manually if not using dotenv
function getEnv(key: string, fallback: string = ""): string {
  if (process.env[key]) return process.env[key]!;
  
  // Try loading from root .env or database .env
  const envPaths = [
    path.resolve(__dirname, "../.env"),
    path.resolve(__dirname, "../../.env"),
    path.resolve(__dirname, "../../../.env"),
  ];

  for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf-8");
      const lines = content.split("\n");
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
          const [k, ...v] = trimmed.split("=");
          if (k.trim() === key) {
            return v.join("=").trim().replace(/^["']|["']$/g, "");
          }
        }
      }
    }
  }
  return fallback;
}

const supabaseUrl = getEnv("SUPABASE_URL", getEnv("VITE_SUPABASE_URL", "https://mhafjhtzpgdyalzwbgky.supabase.co"));
const supabaseKey = getEnv("SUPABASE_SERVICE_ROLE_KEY", getEnv("VITE_SUPABASE_ANON_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1oYWZqaHR6cGdkeWFsendiZ2t5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM0MDEzMzQsImV4cCI6MjA5ODk3NzMzNH0.vjG06M3QeZPt4BELgG8zNWHIRgOxU9lM3VGO89_38i8"));

console.log("🌱 Initializing EdgeTalent High-Quality Database Seeder...");
console.log(`📍 Supabase Endpoint: ${supabaseUrl}`);

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

const mockVector = Array(1536).fill(0.025);

async function seedDatabase() {
  try {
    // -------------------------------------------------------------
    // 1. Profiles (Talents, Partners, Admin)
    // -------------------------------------------------------------
    console.log("\n👤 [1/9] Seeding Profiles...");
    const profiles = [
      {
        id: "10000000-0000-0000-0000-000000000001",
        full_name: "Dr. Sarah Chen",
        email: "sarah.chen@ai-edge.org",
        avatar_url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80",
        role: "talent",
        bio: "Ph.D. in Computer Science specializing in Machine Learning, RAG, and vector search optimization. 7+ years building production AI microservices.",
        portfolio_links: { github: "https://github.com/sarahchen-ai", linkedin: "https://linkedin.com/in/sarahchen-ai", website: "https://sarahchen.io" },
        skills: ["ai", "Python", "PyTorch", "Vector Databases", "LLM", "Prompt Engineering", "LangChain", "pgvector"],
        skill_gaps: ["Rust", "Kubernetes"],
        skills_embedding: mockVector
      },
      {
        id: "10000000-0000-0000-0000-000000000002",
        full_name: "Marcus Vance",
        email: "marcus.vance@devstudio.com",
        avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
        role: "talent",
        bio: "Senior Full-Stack Architect with 8 years of experience engineering high-scale React, Next.js, and Node.js enterprise solutions.",
        portfolio_links: { github: "https://github.com/marcusvance", linkedin: "https://linkedin.com/in/marcusvance", website: "https://marcusvance.dev" },
        skills: ["frontend", "backend", "React", "TypeScript", "Next.js", "Node.js", "Express", "PostgreSQL", "GraphQL", "TailwindCSS"],
        skill_gaps: ["Solidity", "PyTorch"],
        skills_embedding: mockVector
      },
      {
        id: "10000000-0000-0000-0000-000000000003",
        full_name: "Elena Rostova",
        email: "elena.rostova@uxcraft.design",
        avatar_url: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=80",
        role: "talent",
        bio: "Lead Product Designer & UI/UX Specialist crafting intuitive digital experiences for FinTech and HealthTech applications.",
        portfolio_links: { dribbble: "https://dribbble.com/elenarostova", linkedin: "https://linkedin.com/in/elenarostova" },
        skills: ["UI/UX Design", "Figma", "Design Systems", "User Research", "Prototyping", "Accessibility"],
        skill_gaps: ["TypeScript", "Three.js"],
        skills_embedding: mockVector
      },
      {
        id: "10000000-0000-0000-0000-000000000004",
        full_name: "Alex Rivera",
        email: "alex.rivera@mobileedge.io",
        avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80",
        role: "talent",
        bio: "Cross-platform Mobile Engineer focused on React Native and Flutter app development. Shipped 12+ mobile apps.",
        portfolio_links: { github: "https://github.com/arivera-mobile", linkedin: "https://linkedin.com/in/alexrivera-tech" },
        skills: ["React Native", "Flutter", "TypeScript", "iOS", "Android", "GraphQL"],
        skill_gaps: ["WebAssembly", "C++"],
        skills_embedding: mockVector
      },
      {
        id: "10000000-0000-0000-0000-000000000005",
        full_name: "David Kalu",
        email: "david.kalu@cloudops.net",
        avatar_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80",
        role: "talent",
        bio: "DevOps & Cloud Site Reliability Engineer. Specialized in AWS/GCP cloud architecture, Terraform IaC, and Kubernetes.",
        portfolio_links: { github: "https://github.com/dkalu-ops", linkedin: "https://linkedin.com/in/davidkalu" },
        skills: ["backend", "DevOps", "AWS", "Kubernetes", "Docker", "Terraform", "CI/CD", "PostgreSQL"],
        skill_gaps: ["React", "UI/UX Design"],
        skills_embedding: mockVector
      },
      {
        id: "20000000-0000-0000-0000-000000000001",
        full_name: "Nexus AI Labs",
        email: "contact@nexusailabs.io",
        avatar_url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&auto=format&fit=crop&q=80",
        role: "partner",
        bio: "Series-A funded research startup building next-generation multi-modal autonomous agents and vector search systems.",
        portfolio_links: { website: "https://nexusailabs.io", linkedin: "https://linkedin.com/company/nexus-ai-labs" },
        skills: ["AI", "LLM", "Python", "Vector DB"],
        skill_gaps: []
      },
      {
        id: "20000000-0000-0000-0000-000000000002",
        full_name: "QuantumPay FinTech",
        email: "partnerships@quantumpay.com",
        avatar_url: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=400&auto=format&fit=crop&q=80",
        role: "partner",
        bio: "Global financial technology enterprise providing instant cross-border payments and merchant API gateways.",
        portfolio_links: { website: "https://quantumpay.com", linkedin: "https://linkedin.com/company/quantumpay" },
        skills: ["FinTech", "Node.js", "React", "PostgreSQL"],
        skill_gaps: []
      },
      {
        id: "20000000-0000-0000-0000-000000000003",
        full_name: "ElevateHealth Tech",
        email: "info@elevatehealth.org",
        avatar_url: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400&auto=format&fit=crop&q=80",
        role: "partner",
        bio: "ElevateHealth leverages digital workflows and AI diagnostics to provide accessible healthcare across emerging markets.",
        portfolio_links: { website: "https://elevatehealth.org" },
        skills: ["HealthTech", "AI", "React Native"],
        skill_gaps: []
      },
      {
        id: "30000000-0000-0000-0000-000000000001",
        full_name: "EdgeTalent Master Admin",
        email: "admin@edgetalent.com",
        avatar_url: "https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?w=400&auto=format&fit=crop&q=80",
        role: "admin",
        bio: "System administrator profile responsible for platform oversight and course moderation.",
        portfolio_links: { website: "https://edgetalent.org" },
        skills: ["Admin"],
        skill_gaps: []
      }
    ];

    const { error: profErr } = await supabase.from("profiles").upsert(profiles);
    if (profErr) console.warn("  ⚠️ Warning upserting profiles:", profErr.message);
    else console.log(`  ✅ Successfully seeded ${profiles.length} profiles.`);

    // -------------------------------------------------------------
    // 2. Projects
    // -------------------------------------------------------------
    console.log("\n💼 [2/9] Seeding Marketplace Projects...");
    const projects = [
      {
        id: "40000000-0000-0000-0000-000000000001",
        partner_id: "20000000-0000-0000-0000-000000000001",
        title: "Autonomous AI Customer Support Agent with RAG & pgvector",
        description: "Build a state-of-the-art retrieval-augmented generation (RAG) agent using PostgreSQL pgvector and OpenRouter LLMs with sub-500ms latency.",
        required_skills: ["ai", "Python", "pgvector", "LLM", "Prompt Engineering", "LangChain"],
        budget: 4500,
        scope: "medium-term",
        embedding: mockVector
      },
      {
        id: "40000000-0000-0000-0000-000000000002",
        partner_id: "20000000-0000-0000-0000-000000000001",
        title: "LLM Fine-Tuning & Multi-Modal Vision Model Pipeline",
        description: "Fine-tune open-weight vision-language models for automated document inspection and key-value metadata extraction.",
        required_skills: ["ai", "Python", "PyTorch", "LLM"],
        budget: 7000,
        scope: "long-term",
        embedding: mockVector
      },
      {
        id: "40000000-0000-0000-0000-000000000003",
        partner_id: "20000000-0000-0000-0000-000000000002",
        title: "High-Throughput Global Payments Ledger & Microservices",
        description: "Architect and implement transactional ledger microservices in Node.js / TypeScript handling concurrent balance updates and bank API webhooks.",
        required_skills: ["backend", "Node.js", "TypeScript", "PostgreSQL", "Redis", "FinTech"],
        budget: 6000,
        scope: "medium-term",
        embedding: mockVector
      },
      {
        id: "40000000-0000-0000-0000-000000000004",
        partner_id: "20000000-0000-0000-0000-000000000002",
        title: "React & Tailwind Merchant Analytics Dashboard",
        description: "Build an interactive, responsive analytics portal for merchants featuring transaction charts, settlement reports, and refund workflows.",
        required_skills: ["frontend", "React", "TypeScript", "TailwindCSS", "UI/UX Design"],
        budget: 3500,
        scope: "short-term",
        embedding: mockVector
      },
      {
        id: "40000000-0000-0000-0000-000000000005",
        partner_id: "20000000-0000-0000-0000-000000000003",
        title: "AI Tele-Health Diagnostic & Symptom Checker Web App",
        description: "Build an intuitive patient web intake application integrated with AI diagnostic suggestion engines adhering to healthcare privacy standards.",
        required_skills: ["frontend", "React", "TypeScript", "HealthTech", "UI/UX Design"],
        budget: 5000,
        scope: "medium-term",
        embedding: mockVector
      }
    ];

    const { error: projErr } = await supabase.from("projects").upsert(projects);
    if (projErr) console.warn("  ⚠️ Warning upserting projects:", projErr.message);
    else console.log(`  ✅ Successfully seeded ${projects.length} marketplace projects.`);

    // -------------------------------------------------------------
    // 3. Applications
    // -------------------------------------------------------------
    console.log("\n📄 [3/9] Seeding Project Applications...");
    const applications = [
      {
        project_id: "40000000-0000-0000-0000-000000000001",
        talent_id: "10000000-0000-0000-0000-000000000001",
        status: "accepted",
        match_percentage: 98.5,
        match_breakdown: { skills_match: 100, experience_match: 96, rag_expertise: 100 }
      },
      {
        project_id: "40000000-0000-0000-0000-000000000001",
        talent_id: "10000000-0000-0000-0000-000000000002",
        status: "shortlisted",
        match_percentage: 84.0,
        match_breakdown: { skills_match: 80, experience_match: 90 }
      },
      {
        project_id: "40000000-0000-0000-0000-000000000003",
        talent_id: "10000000-0000-0000-0000-000000000002",
        status: "accepted",
        match_percentage: 96.0,
        match_breakdown: { skills_match: 98, backend_architecture: 96 }
      },
      {
        project_id: "40000000-0000-0000-0000-000000000004",
        talent_id: "10000000-0000-0000-0000-000000000002",
        status: "accepted",
        match_percentage: 99.0,
        match_breakdown: { skills_match: 100, frontend_design: 98 }
      },
      {
        project_id: "40000000-0000-0000-0000-000000000005",
        talent_id: "10000000-0000-0000-0000-000000000003",
        status: "shortlisted",
        match_percentage: 94.0,
        match_breakdown: { skills_match: 96, ui_design: 98 }
      }
    ];

    const { error: appErr } = await supabase.from("applications").upsert(applications, { onConflict: "project_id,talent_id" });
    if (appErr) console.warn("  ⚠️ Warning upserting applications:", appErr.message);
    else console.log(`  ✅ Successfully seeded ${applications.length} applications.`);

    // -------------------------------------------------------------
    // 4. Courses & Lessons
    // -------------------------------------------------------------
    console.log("\n📚 [4/9] Seeding Courses & Lessons...");
    const courses = [
      {
        id: "50000000-0000-0000-0000-000000000001",
        title: "Advanced React Architecture & Custom Hooks",
        description: "Master modern React 19 patterns, server components, fiber reconciliation, custom hook abstractions, and state management at scale.",
        skills_taught: ["frontend", "React", "TypeScript", "State Management"],
        provider: "EdgeTalent Academy",
        link: "https://edgetalent.org/courses/react-architecture"
      },
      {
        id: "50000000-0000-0000-0000-000000000002",
        title: "Enterprise Node.js Backend & Scalable Systems",
        description: "Deep dive into Node.js asynchronous I/O, Express middleware, database query optimization, Redis caching, and microservices.",
        skills_taught: ["backend", "Node.js", "Express", "PostgreSQL", "Redis"],
        provider: "EdgeTalent Academy",
        link: "https://edgetalent.org/courses/nodejs-backend"
      },
      {
        id: "50000000-0000-0000-0000-000000000003",
        title: "AI Engineering & RAG Systems Masterclass",
        description: "Build end-to-end intelligent systems with OpenRouter LLMs, embeddings, vector databases (pgvector), and production RAG pipelines.",
        skills_taught: ["ai", "LLM", "Prompt Engineering", "Vector Databases", "Python", "pgvector"],
        provider: "EdgeTalent Academy",
        link: "https://edgetalent.org/courses/ai-engineering"
      }
    ];

    const { error: cErr } = await supabase.from("courses").upsert(courses);
    if (cErr) console.warn("  ⚠️ Warning upserting courses:", cErr.message);
    else console.log(`  ✅ Successfully seeded ${courses.length} courses.`);

    const lessons = [
      {
        id: "60000000-0000-0000-0000-000000000001",
        course_id: "50000000-0000-0000-0000-000000000001",
        title: "React 19 Fiber Mechanics & Render Lifecycle",
        content: "# React 19 Fiber Mechanics\nUnderstand how fibers represent component tree work units, priority queuing, and concurrent rendering features.",
        sequence_order: 1,
        duration_minutes: 20
      },
      {
        id: "60000000-0000-0000-0000-000000000002",
        course_id: "50000000-0000-0000-0000-000000000001",
        title: "Designing Custom React Hooks & Abstracting UI Logic",
        content: "# Custom React Hooks\nLearn patterns for encapsulating complex state logic into testable, clean custom hooks across React applications.",
        sequence_order: 2,
        duration_minutes: 25
      },
      {
        id: "60000000-0000-0000-0000-000000000003",
        course_id: "50000000-0000-0000-0000-000000000001",
        title: "Enterprise TypeScript Integration & Type Safety",
        content: "# TypeScript in React\nMaster generic component props, union state types, and schema validation with Zod in React applications.",
        sequence_order: 3,
        duration_minutes: 18
      },
      {
        id: "60000000-0000-0000-0000-000000000006",
        course_id: "50000000-0000-0000-0000-000000000003",
        title: "Vector Embeddings & Cosine Distance Mechanics",
        content: "# Understanding Embeddings\nLearn how neural networks map text tokens into 1536-dimensional semantic spaces and calculate cosine similarity.",
        sequence_order: 1,
        duration_minutes: 20
      },
      {
        id: "60000000-0000-0000-0000-000000000007",
        course_id: "50000000-0000-0000-0000-000000000003",
        title: "Building Enterprise RAG Pipelines with pgvector",
        content: "# Enterprise RAG Pipelines\nDesign end-to-end document chunking, vector indexing in PostgreSQL, and dynamic prompt context injection.",
        sequence_order: 2,
        duration_minutes: 35
      }
    ];

    const { error: lesErr } = await supabase.from("course_lessons").upsert(lessons);
    if (lesErr) console.warn("  ⚠️ Warning upserting course lessons:", lesErr.message);
    else console.log(`  ✅ Successfully seeded ${lessons.length} course lessons.`);

    // -------------------------------------------------------------
    // 5. Course Enrollments & Digital Certificates
    // -------------------------------------------------------------
    console.log("\n🎓 [5/9] Seeding Course Enrollments & Certificates...");
    const enrollments = [
      {
        user_id: "10000000-0000-0000-0000-000000000001",
        course_id: "50000000-0000-0000-0000-000000000003",
        completed_lessons: ["60000000-0000-0000-0000-000000000006", "60000000-0000-0000-0000-000000000007"],
        completed_at: new Date().toISOString(),
        credential_id: "CERT-AI-2026-9841",
        digital_signature: "sig_edgetalent_ai_9841_sarah_chen_verified"
      },
      {
        user_id: "10000000-0000-0000-0000-000000000002",
        course_id: "50000000-0000-0000-0000-000000000001",
        completed_lessons: ["60000000-0000-0000-0000-000000000001", "60000000-0000-0000-0000-000000000002", "60000000-0000-0000-0000-000000000003"],
        completed_at: new Date().toISOString(),
        credential_id: "CERT-REACT-2026-4712",
        digital_signature: "sig_edgetalent_react_4712_marcus_vance_verified"
      }
    ];

    const { error: enrErr } = await supabase.from("course_enrollments").upsert(enrollments, { onConflict: "user_id,course_id" });
    if (enrErr) console.warn("  ⚠️ Warning upserting enrollments:", enrErr.message);
    else console.log(`  ✅ Successfully seeded ${enrollments.length} course enrollments.`);

    // Talent External Certificates
    const certs = [
      {
        user_id: "10000000-0000-0000-0000-000000000001",
        name: "Google Cloud Professional Machine Learning Engineer",
        issuing_organization: "Google Cloud",
        issue_date: "2025-06-15",
        expiration_date: "2027-06-15",
        credential_id: "GCP-MLE-884912",
        credential_url: "https://www.credential.net/gcp-mle-884912",
        digital_signature: "sig_gcp_mle_884912_sarah_chen"
      },
      {
        user_id: "10000000-0000-0000-0000-000000000002",
        name: "Meta Certified Senior Frontend Developer",
        issuing_organization: "Meta",
        issue_date: "2025-03-10",
        credential_id: "META-FE-992104",
        credential_url: "https://coursera.org/verify/meta-fe-992104",
        digital_signature: "sig_meta_fe_992104_marcus_vance"
      },
      {
        user_id: "10000000-0000-0000-0000-000000000005",
        name: "AWS Certified Solutions Architect – Professional",
        issuing_organization: "Amazon Web Services",
        issue_date: "2024-11-20",
        expiration_date: "2027-11-20",
        credential_id: "AWS-SAP-773419",
        credential_url: "https://aws.amazon.com/verification/AWS-SAP-773419",
        digital_signature: "sig_aws_sap_773419_david_kalu"
      }
    ];

    const { error: certErr } = await supabase.from("talent_certificates").upsert(certs);
    if (certErr) console.warn("  ⚠️ Warning upserting external certificates:", certErr.message);
    else console.log(`  ✅ Successfully seeded ${certs.length} talent external certificates.`);

    // -------------------------------------------------------------
    // 6. Funding Opportunities
    // -------------------------------------------------------------
    console.log("\n💰 [6/9] Seeding Funding Opportunities...");
    const funding = [
      {
        id: "70000000-0000-0000-0000-000000000001",
        title: "Y Combinator Winter 2027 Accelerator",
        description: "YC invests $500,000 in early-stage tech founders twice a year. Gain access to elite founder networks and global venture capital demo day.",
        content: "Y Combinator is a world-renowned startup accelerator. Every accepted startup receives $500,000 investment split across post-money safe and uncapped MFN terms.",
        amount: "$500,000",
        eligibility: "Open to early-stage technology founders globally.",
        deadline: "October 15, 2026",
        link: "https://www.ycombinator.com/apply",
        category: "Accelerators"
      },
      {
        id: "70000000-0000-0000-0000-000000000002",
        title: "Google for Startups Accelerator: AI First",
        description: "Equity-free program providing up to $100,000 in Google Cloud credits, technical AI mentorship, and access to Google machine learning experts.",
        content: "The Google for Startups Accelerator: AI First targets high-potential startups developing core products with Artificial Intelligence and Machine Learning.",
        amount: "Up to $100,000 in Cloud Credits + Equity-Free Support",
        eligibility: "Seed to Series-A startups with AI/ML integrated into their core product.",
        deadline: "September 30, 2026",
        link: "https://startup.google.com/accelerator/",
        category: "Accelerators"
      },
      {
        id: "70000000-0000-0000-0000-000000000003",
        title: "Thiel Fellowship for Young Entrepreneurs",
        description: "$100,000 equity-free grant awarded to young innovators building breakthrough technologies outside traditional academia.",
        content: "The Thiel Fellowship is a two-year program founded by Peter Thiel giving $100,000 to young people who want to build new things instead of attending college.",
        amount: "$100,000 (Equity-Free Grant)",
        eligibility: "Entrepreneurs aged 22 or under willing to pursue their startup full-time.",
        deadline: "Rolling Applications",
        link: "https://www.thielfellowship.org/",
        category: "Grants"
      }
    ];

    const { error: fundErr } = await supabase.from("funding_opportunities").upsert(funding);
    if (fundErr) console.warn("  ⚠️ Warning upserting funding opportunities:", fundErr.message);
    else console.log(`  ✅ Successfully seeded ${funding.length} funding opportunities.`);

    // -------------------------------------------------------------
    // 7. Events & Registrations
    // -------------------------------------------------------------
    console.log("\n📅 [7/9] Seeding Tech Events & RSVPs...");
    const events = [
      {
        id: "80000000-0000-0000-0000-000000000001",
        title: "EdgeTalent Global AI & Vector Search Hackathon 2026",
        description: "A 48-hour global virtual hackathon focused on building open-source AI agents and pgvector developer extensions.",
        content: "Join developers, AI researchers, and designers for a 48-hour hackathon. Top 3 winning teams receive $10,000 in cash prizes.",
        event_date: new Date(Date.now() + 86400000 * 14).toISOString(),
        location: "Virtual (Discord / Zoom)",
        organizer: "EdgeTalent Foundation",
        organizer_id: "30000000-0000-0000-0000-000000000001",
        category: "Hackathon",
        capacity: 250,
        link: "https://edgetalent.org/hackathon-2026"
      },
      {
        id: "80000000-0000-0000-0000-000000000002",
        title: "Building Production AI Agents with Gemini & pgvector",
        description: "Hands-on technical workshop on defining function-calling schemas, system instructions, and vector matching pipelines.",
        content: "Learn how to build autonomous coding and data agents using Google Gemini models and PostgreSQL vector search.",
        event_date: new Date(Date.now() + 86400000 * 5).toISOString(),
        location: "Virtual (Zoom)",
        organizer: "Google Developer Group",
        category: "Workshop",
        capacity: 120,
        link: "https://gdg.community.dev/events/"
      }
    ];

    const { error: evtErr } = await supabase.from("events").upsert(events);
    if (evtErr) console.warn("  ⚠️ Warning upserting events:", evtErr.message);
    else console.log(`  ✅ Successfully seeded ${events.length} tech events.`);

    const rsvps = [
      { event_id: "80000000-0000-0000-0000-000000000001", user_id: "10000000-0000-0000-0000-000000000001" },
      { event_id: "80000000-0000-0000-0000-000000000001", user_id: "10000000-0000-0000-0000-000000000002" },
      { event_id: "80000000-0000-0000-0000-000000000002", user_id: "10000000-0000-0000-0000-000000000001" }
    ];

    const { error: rsvpErr } = await supabase.from("event_registrations").upsert(rsvps, { onConflict: "event_id,user_id" });
    if (rsvpErr) console.warn("  ⚠️ Warning upserting event registrations:", rsvpErr.message);
    else console.log(`  ✅ Successfully seeded ${rsvps.length} event RSVPs.`);

    // -------------------------------------------------------------
    // 8. Quiz Questions
    // -------------------------------------------------------------
    console.log("\n❓ [8/9] Seeding Quiz Questions...");
    const quizQuestions = [
      {
        category: "frontend",
        question: "Which hook in React 19 is specifically designed to handle asynchronous form actions?",
        options: ["useActionState", "useEffect", "useMemo", "useRef"],
        answer: "useActionState"
      },
      {
        category: "frontend",
        question: "What is the primary benefit of React Server Components (RSC)?",
        options: ["Zero client-side JavaScript bundle size for server components", "Faster CSS compilation", "Automatic Redux store synchronization", "Replacing WebSockets entirely"],
        answer: "Zero client-side JavaScript bundle size for server components"
      },
      {
        category: "backend",
        question: "In PostgreSQL, which index type is optimized for cosine distance search on pgvector embeddings?",
        options: ["HNSW (Hierarchical Navigable Small World)", "B-Tree", "Hash Index", "BRIN"],
        answer: "HNSW (Hierarchical Navigable Small World)"
      },
      {
        category: "ai",
        question: "In Retrieval-Augmented Generation (RAG), what is chunking used for?",
        options: ["Breaking large text documents into smaller semantically cohesive segments for embedding", "Compressing audio files", "Translating code into Python", "Encrypting API keys"],
        answer: "Breaking large text documents into smaller semantically cohesive segments for embedding"
      }
    ];

    const { error: quizErr } = await supabase.from("quiz_questions").upsert(quizQuestions);
    if (quizErr) console.warn("  ⚠️ Warning upserting quiz questions:", quizErr.message);
    else console.log(`  ✅ Successfully seeded ${quizQuestions.length} quiz questions.`);

    console.log("\n✨ Database Seeding Completed Successfully!");
  } catch (err: any) {
    console.error("\n❌ Database seeding failed:", err.message);
    process.exit(1);
  }
}

seedDatabase();
