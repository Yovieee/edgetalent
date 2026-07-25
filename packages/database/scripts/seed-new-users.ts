import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

function getEnv(key: string, fallback: string = ""): string {
  if (process.env[key]) return process.env[key]!;

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
const supabaseKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");

if (!supabaseKey) {
  console.error("❌ SUPABASE_SERVICE_ROLE_KEY is required for seeding. Please set it in .env");
  process.exit(1);
}

console.log("🌱 Initializing EdgeTalent New Users Demo Seeder...");
console.log(`📍 Supabase Endpoint: ${supabaseUrl}`);

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

// Mock 1536-dim vector (all values slightly different to avoid exact duplicates)
function makeMockVector(seed: number): number[] {
  return Array.from({ length: 1536 }, (_, i) => 0.01 + (seed * 0.003) + (i * 0.000001));
}

async function seedNewUsers() {
  try {
    // ---------------------------------------------------------------
    // 0. Pre-create Auth Users
    // ---------------------------------------------------------------
    const authUsers = [
      // --- New Talents ---
      { id: "11000000-0000-0000-0000-000000000001", email: "yuki.tanaka@devcraft.jp",        full_name: "Yuki Tanaka" },
      { id: "11000000-0000-0000-0000-000000000002", email: "amara.osei@techbridge.africa",   full_name: "Amara Osei" },
      { id: "11000000-0000-0000-0000-000000000003", email: "lucas.fernandez@codelab.mx",     full_name: "Lucas Fernández" },
      { id: "11000000-0000-0000-0000-000000000004", email: "priya.sharma@aiworks.in",        full_name: "Priya Sharma" },
      { id: "11000000-0000-0000-0000-000000000005", email: "noah.bergstrom@northcode.se",    full_name: "Noah Bergström" },
      { id: "11000000-0000-0000-0000-000000000006", email: "fatima.al-rashid@qatech.ae",     full_name: "Fatima Al-Rashid" },
      { id: "11000000-0000-0000-0000-000000000007", email: "james.okafor@lagosdev.ng",       full_name: "James Okafor" },
      { id: "11000000-0000-0000-0000-000000000008", email: "sofia.marchetti@digitalmi.it",   full_name: "Sofia Marchetti" },
      { id: "11000000-0000-0000-0000-000000000009", email: "ryo.nakamura@startuplab.jp",     full_name: "Ryo Nakamura" },
      { id: "11000000-0000-0000-0000-000000000010", email: "zara.ahmed@hivetech.pk",         full_name: "Zara Ahmed" },
      // --- New Partners ---
      { id: "21000000-0000-0000-0000-000000000001", email: "hello@vortexcloud.io",            full_name: "VortexCloud Technologies" },
      { id: "21000000-0000-0000-0000-000000000002", email: "talent@greenwave-energy.com",     full_name: "GreenWave Energy Tech" },
      { id: "21000000-0000-0000-0000-000000000003", email: "dev@luminarystudios.gg",          full_name: "Luminary Game Studios" },
    ];

    if (supabase.auth?.admin) {
      console.log("\n🔐 [0/6] Ensuring Auth Users exist...");
      for (const u of authUsers) {
        try {
          await supabase.auth.admin.createUser({
            id: u.id,
            email: u.email,
            password: "password123",
            email_confirm: true,
            user_metadata: { full_name: u.full_name }
          }).catch(() => {});
        } catch (_) {}
      }
      console.log(`  ✅ Processed ${authUsers.length} auth user entries.`);
    }

    // ---------------------------------------------------------------
    // 1. Profiles
    // ---------------------------------------------------------------
    console.log("\n👤 [1/6] Seeding New Profiles...");
    const profiles = [
      // ---- TALENTS ----
      {
        id: "11000000-0000-0000-0000-000000000001",
        full_name: "Yuki Tanaka",
        email: "yuki.tanaka@devcraft.jp",
        avatar_url: "https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=400&auto=format&fit=crop&q=80",
        role: "talent",
        bio: "Full-Stack Engineer & Web3 Developer from Tokyo. 6 years building high-performance DeFi protocols, NFT marketplaces, and Solidity smart contracts on EVM chains.",
        portfolio_links: {
          github: "https://github.com/yukitanaka-web3",
          linkedin: "https://linkedin.com/in/yukitanaka-dev",
          website: "https://yukitanaka.dev"
        },
        skills: ["blockchain", "Solidity", "Ethereum", "React", "TypeScript", "Web3.js", "Hardhat", "Node.js"],
        skill_gaps: ["AI/ML", "Rust"],
        skills_embedding: makeMockVector(1)
      },
      {
        id: "11000000-0000-0000-0000-000000000002",
        full_name: "Amara Osei",
        email: "amara.osei@techbridge.africa",
        avatar_url: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=400&auto=format&fit=crop&q=80",
        role: "talent",
        bio: "Backend Engineer & Data Pipeline Architect from Accra, Ghana. Expert in Apache Kafka, Spark, and building real-time data infrastructure for fintech platforms across Africa.",
        portfolio_links: {
          github: "https://github.com/amaraosei-data",
          linkedin: "https://linkedin.com/in/amaraosei"
        },
        skills: ["backend", "Python", "Apache Kafka", "Apache Spark", "PostgreSQL", "Redis", "Docker", "FinTech"],
        skill_gaps: ["Machine Learning", "TypeScript"],
        skills_embedding: makeMockVector(2)
      },
      {
        id: "11000000-0000-0000-0000-000000000003",
        full_name: "Lucas Fernández",
        email: "lucas.fernandez@codelab.mx",
        avatar_url: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&auto=format&fit=crop&q=80",
        role: "talent",
        bio: "Creative Frontend Developer & Motion Engineer from Mexico City. Specialist in 3D web experiences using Three.js, WebGL, and GSAP animation. Shipped award-winning interactive campaigns for global brands.",
        portfolio_links: {
          github: "https://github.com/lucasfdev",
          linkedin: "https://linkedin.com/in/lucasfernandez-creative",
          website: "https://lucasf.mx"
        },
        skills: ["frontend", "Three.js", "WebGL", "GSAP", "React", "TypeScript", "CSS", "Blender"],
        skill_gaps: ["Backend", "Node.js"],
        skills_embedding: makeMockVector(3)
      },
      {
        id: "11000000-0000-0000-0000-000000000004",
        full_name: "Priya Sharma",
        email: "priya.sharma@aiworks.in",
        avatar_url: "https://images.unsplash.com/photo-1551836022-deb4988cc6c0?w=400&auto=format&fit=crop&q=80",
        role: "talent",
        bio: "AI Research Engineer & MLOps Lead from Bangalore. Specializes in building scalable ML model training pipelines, model distillation, and deploying computer vision models to edge devices.",
        portfolio_links: {
          github: "https://github.com/priya-mlops",
          linkedin: "https://linkedin.com/in/priyasharma-ai",
          website: "https://priyasharma.ai"
        },
        skills: ["ai", "Python", "PyTorch", "TensorFlow", "MLOps", "Kubernetes", "Computer Vision", "ONNX"],
        skill_gaps: ["React", "Web Development"],
        skills_embedding: makeMockVector(4)
      },
      {
        id: "11000000-0000-0000-0000-000000000005",
        full_name: "Noah Bergström",
        email: "noah.bergstrom@northcode.se",
        avatar_url: "https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=400&auto=format&fit=crop&q=80",
        role: "talent",
        bio: "Cybersecurity Engineer & Penetration Tester from Stockholm. 9 years hardening cloud infrastructure, conducting red-team exercises, and implementing zero-trust architectures for European enterprises.",
        portfolio_links: {
          github: "https://github.com/nbergstrom-sec",
          linkedin: "https://linkedin.com/in/noahbergstrom"
        },
        skills: ["Security", "Penetration Testing", "AWS", "Zero Trust", "Terraform", "Python", "SIEM", "Kubernetes"],
        skill_gaps: ["Frontend Development", "Mobile"],
        skills_embedding: makeMockVector(5)
      },
      {
        id: "11000000-0000-0000-0000-000000000006",
        full_name: "Fatima Al-Rashid",
        email: "fatima.al-rashid@qatech.ae",
        avatar_url: "https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?w=400&auto=format&fit=crop&q=80",
        role: "talent",
        bio: "Senior QA Engineer & Test Automation Architect from Dubai. Expert in designing end-to-end testing frameworks using Playwright, Cypress, and AI-driven test generation for enterprise SaaS products.",
        portfolio_links: {
          github: "https://github.com/fatima-qa",
          linkedin: "https://linkedin.com/in/fatimaAlrashid-qa"
        },
        skills: ["QA", "Playwright", "Cypress", "TypeScript", "Python", "CI/CD", "Selenium", "Test Automation"],
        skill_gaps: ["Machine Learning", "Cloud Architecture"],
        skills_embedding: makeMockVector(6)
      },
      {
        id: "11000000-0000-0000-0000-000000000007",
        full_name: "James Okafor",
        email: "james.okafor@lagosdev.ng",
        avatar_url: "https://images.unsplash.com/photo-1489424731084-a5d8b2a2cf4a?w=400&auto=format&fit=crop&q=80",
        role: "talent",
        bio: "Mobile & IoT Developer from Lagos, Nigeria. 5+ years building React Native apps for African market conditions — offline-first architecture, low-bandwidth optimization, and hardware sensor integration.",
        portfolio_links: {
          github: "https://github.com/jamesokafor-mobile",
          linkedin: "https://linkedin.com/in/jamesokafor"
        },
        skills: ["React Native", "Flutter", "IoT", "TypeScript", "Python", "Bluetooth BLE", "Firebase", "Android"],
        skill_gaps: ["Cloud Architecture", "AI/ML"],
        skills_embedding: makeMockVector(7)
      },
      {
        id: "11000000-0000-0000-0000-000000000008",
        full_name: "Sofia Marchetti",
        email: "sofia.marchetti@digitalmi.it",
        avatar_url: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&auto=format&fit=crop&q=80",
        role: "talent",
        bio: "Product Manager & UX Strategist from Milan. Bridging design thinking and engineering to ship 0-to-1 products at scale. Led product strategy at two successful Series-B SaaS startups.",
        portfolio_links: {
          linkedin: "https://linkedin.com/in/sofiamarchetti-pm",
          website: "https://sofiamarchetti.io"
        },
        skills: ["Product Management", "UX Strategy", "Figma", "Agile", "OKRs", "Data Analytics", "A/B Testing"],
        skill_gaps: ["Engineering", "SQL"],
        skills_embedding: makeMockVector(8)
      },
      {
        id: "11000000-0000-0000-0000-000000000009",
        full_name: "Ryo Nakamura",
        email: "ryo.nakamura@startuplab.jp",
        avatar_url: "https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=400&auto=format&fit=crop&q=80",
        role: "talent",
        bio: "Blockchain & Smart Contract Auditor from Osaka. Specialized in DeFi protocol security, Solidity code reviews, formal verification, and tokenomics design. Audited $2B+ in on-chain TVL.",
        portfolio_links: {
          github: "https://github.com/ryo-audits",
          linkedin: "https://linkedin.com/in/ryonakamura-web3",
          website: "https://ryo.finance"
        },
        skills: ["blockchain", "Solidity", "Smart Contract Auditing", "DeFi", "Formal Verification", "Python", "Rust"],
        skill_gaps: ["Frontend", "UI/UX Design"],
        skills_embedding: makeMockVector(9)
      },
      {
        id: "11000000-0000-0000-0000-000000000010",
        full_name: "Zara Ahmed",
        email: "zara.ahmed@hivetech.pk",
        avatar_url: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&auto=format&fit=crop&q=80",
        role: "talent",
        bio: "Cloud Solutions Architect & Serverless Specialist from Karachi. Designs cost-optimized, multi-region AWS and Azure architectures. AWS Certified Solutions Architect Professional with 7 years of experience.",
        portfolio_links: {
          github: "https://github.com/zara-cloud",
          linkedin: "https://linkedin.com/in/zaraahmed-cloud"
        },
        skills: ["backend", "AWS", "Azure", "Serverless", "Terraform", "Docker", "Kubernetes", "Node.js"],
        skill_gaps: ["Frontend Development", "Mobile Development"],
        skills_embedding: makeMockVector(10)
      },
      // ---- PARTNERS ----
      {
        id: "21000000-0000-0000-0000-000000000001",
        full_name: "VortexCloud Technologies",
        email: "hello@vortexcloud.io",
        avatar_url: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&auto=format&fit=crop&q=80",
        role: "partner",
        bio: "Series-B cloud infrastructure startup building next-gen multi-cloud orchestration and FinOps platforms for enterprise DevOps teams. HQ in Singapore with 200+ global clients.",
        portfolio_links: {
          website: "https://vortexcloud.io",
          linkedin: "https://linkedin.com/company/vortexcloud"
        },
        skills: ["Cloud", "Kubernetes", "DevOps", "Terraform", "AWS"],
        skill_gaps: []
      },
      {
        id: "21000000-0000-0000-0000-000000000002",
        full_name: "GreenWave Energy Tech",
        email: "talent@greenwave-energy.com",
        avatar_url: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=400&auto=format&fit=crop&q=80",
        role: "partner",
        bio: "CleanTech startup developing IoT-powered smart grid management and solar energy prediction platforms powered by machine learning. Backed by Sequoia Climate.",
        portfolio_links: {
          website: "https://greenwave-energy.com",
          linkedin: "https://linkedin.com/company/greenwave-energy"
        },
        skills: ["IoT", "AI", "Python", "React"],
        skill_gaps: []
      },
      {
        id: "21000000-0000-0000-0000-000000000003",
        full_name: "Luminary Game Studios",
        email: "dev@luminarystudios.gg",
        avatar_url: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&auto=format&fit=crop&q=80",
        role: "partner",
        bio: "Indie-to-AA gaming studio building AAA-quality Web3-integrated multiplayer games. Published 4 titles on Steam & mobile with 3M+ total players. Focusing on play-to-earn ecosystems.",
        portfolio_links: {
          website: "https://luminarystudios.gg",
          linkedin: "https://linkedin.com/company/luminary-studios"
        },
        skills: ["Game Development", "Unity", "Solidity", "Three.js", "Node.js"],
        skill_gaps: []
      }
    ];

    const { error: profErr } = await supabase.from("profiles").upsert(profiles);
    if (profErr) console.warn("  ⚠️ Warning upserting profiles:", profErr.message);
    else console.log(`  ✅ Successfully seeded ${profiles.length} profiles (${10} talents + ${3} partners).`);

    // ---------------------------------------------------------------
    // 2. New Projects (posted by new partners)
    // ---------------------------------------------------------------
    console.log("\n💼 [2/6] Seeding New Marketplace Projects...");
    const projects = [
      {
        id: "41000000-0000-0000-0000-000000000001",
        partner_id: "21000000-0000-0000-0000-000000000001",
        title: "Multi-Cloud Kubernetes Cost Optimizer & FinOps Dashboard",
        description: "Build a real-time FinOps intelligence platform that aggregates AWS, GCP, and Azure spend data, auto-tags resources, and generates actionable cost-reduction recommendations.",
        required_skills: ["Kubernetes", "AWS", "Terraform", "React", "TypeScript", "Node.js"],
        budget: 55000000,
        scope: "medium-term",
        embedding: makeMockVector(11)
      },
      {
        id: "41000000-0000-0000-0000-000000000002",
        partner_id: "21000000-0000-0000-0000-000000000001",
        title: "Cloud Security Posture Management (CSPM) Automation Suite",
        description: "Develop an automated CSPM tool that continuously audits multi-cloud security configurations, maps findings to CIS benchmarks, and triggers auto-remediation playbooks.",
        required_skills: ["Security", "AWS", "Azure", "Python", "Terraform", "Zero Trust"],
        budget: 65000000,
        scope: "long-term",
        embedding: makeMockVector(12)
      },
      {
        id: "41000000-0000-0000-0000-000000000003",
        partner_id: "21000000-0000-0000-0000-000000000002",
        title: "Solar Energy Output Prediction ML Pipeline",
        description: "Design and train a time-series ML model predicting solar farm output 72 hours in advance using weather API feeds, historical generation data, and satellite imagery.",
        required_skills: ["ai", "Python", "PyTorch", "MLOps", "Apache Kafka", "PostgreSQL"],
        budget: 48000000,
        scope: "medium-term",
        embedding: makeMockVector(13)
      },
      {
        id: "41000000-0000-0000-0000-000000000004",
        partner_id: "21000000-0000-0000-0000-000000000002",
        title: "IoT Smart Grid Sensor Dashboard & Real-Time Alert System",
        description: "Build a low-latency IoT data ingestion pipeline and React dashboard for monitoring 10,000+ smart grid sensors with configurable alert thresholds.",
        required_skills: ["IoT", "React", "TypeScript", "Apache Kafka", "PostgreSQL", "Docker"],
        budget: 40000000,
        scope: "short-term",
        embedding: makeMockVector(14)
      },
      {
        id: "41000000-0000-0000-0000-000000000005",
        partner_id: "21000000-0000-0000-0000-000000000003",
        title: "Web3 Play-to-Earn Game Economy Smart Contracts & Auditing",
        description: "Design, implement, and audit the tokenomics smart contracts for our new P2E title — including ERC-20 token mechanics, NFT staking rewards, and anti-inflation governance.",
        required_skills: ["blockchain", "Solidity", "Smart Contract Auditing", "DeFi", "Rust", "Hardhat"],
        budget: 80000000,
        scope: "long-term",
        embedding: makeMockVector(15)
      },
      {
        id: "41000000-0000-0000-0000-000000000006",
        partner_id: "21000000-0000-0000-0000-000000000003",
        title: "3D In-Browser Game Lobby & Multiplayer UI with Three.js",
        description: "Create an immersive Three.js WebGL game lobby and multiplayer matchmaking UI with real-time WebSocket state synchronization and GSAP-powered micro-animations.",
        required_skills: ["frontend", "Three.js", "WebGL", "GSAP", "React", "TypeScript", "Node.js"],
        budget: 38000000,
        scope: "short-term",
        embedding: makeMockVector(16)
      }
    ];

    const { error: projErr } = await supabase.from("projects").upsert(projects);
    if (projErr) console.warn("  ⚠️ Warning upserting projects:", projErr.message);
    else console.log(`  ✅ Successfully seeded ${projects.length} new marketplace projects.`);

    // ---------------------------------------------------------------
    // 3. Applications (new talents applying to new & existing projects)
    // ---------------------------------------------------------------
    console.log("\n📄 [3/6] Seeding Project Applications...");
    const applications = [
      // Yuki (Web3) → Luminary game contracts
      {
        project_id: "41000000-0000-0000-0000-000000000005",
        talent_id: "11000000-0000-0000-0000-000000000001",
        status: "shortlisted",
        match_percentage: 91.0,
        match_breakdown: { skills_match: 93, blockchain_expertise: 95, solidity_score: 92 }
      },
      // Yuki (Web3) → 3D Game Lobby
      {
        project_id: "41000000-0000-0000-0000-000000000006",
        talent_id: "11000000-0000-0000-0000-000000000001",
        status: "applied",
        match_percentage: 78.0,
        match_breakdown: { skills_match: 72, frontend_score: 80, typescript_score: 82 }
      },
      // Amara (Data/Backend) → Solar ML Pipeline
      {
        project_id: "41000000-0000-0000-0000-000000000003",
        talent_id: "11000000-0000-0000-0000-000000000002",
        status: "accepted",
        match_percentage: 93.5,
        match_breakdown: { skills_match: 95, data_engineering: 96, python_score: 96 }
      },
      // Amara → IoT Dashboard backend
      {
        project_id: "41000000-0000-0000-0000-000000000004",
        talent_id: "11000000-0000-0000-0000-000000000002",
        status: "shortlisted",
        match_percentage: 88.0,
        match_breakdown: { skills_match: 87, kafka_score: 92, backend_score: 90 }
      },
      // Lucas (3D/Frontend) → 3D Game Lobby
      {
        project_id: "41000000-0000-0000-0000-000000000006",
        talent_id: "11000000-0000-0000-0000-000000000003",
        status: "accepted",
        match_percentage: 97.5,
        match_breakdown: { skills_match: 99, threejs_score: 100, animation_score: 98, react_score: 96 }
      },
      // Lucas → AI Tele-Health existing project (cross-apply)
      {
        project_id: "40000000-0000-0000-0000-000000000005",
        talent_id: "11000000-0000-0000-0000-000000000003",
        status: "reviewing",
        match_percentage: 80.0,
        match_breakdown: { skills_match: 78, frontend_score: 88, design_score: 75 }
      },
      // Priya (AI/MLOps) → Solar ML Pipeline
      {
        project_id: "41000000-0000-0000-0000-000000000003",
        talent_id: "11000000-0000-0000-0000-000000000004",
        status: "shortlisted",
        match_percentage: 96.0,
        match_breakdown: { skills_match: 97, mlops_score: 98, pytorch_score: 97, computer_vision: 95 }
      },
      // Priya → Nexus AI existing projects
      {
        project_id: "40000000-0000-0000-0000-000000000002",
        talent_id: "11000000-0000-0000-0000-000000000004",
        status: "accepted",
        match_percentage: 94.0,
        match_breakdown: { skills_match: 95, pytorch_score: 98, mlops_score: 95 }
      },
      // Noah (Security) → CSPM project
      {
        project_id: "41000000-0000-0000-0000-000000000002",
        talent_id: "11000000-0000-0000-0000-000000000005",
        status: "accepted",
        match_percentage: 98.0,
        match_breakdown: { skills_match: 99, security_score: 100, cloud_score: 97, terraform_score: 96 }
      },
      // Fatima (QA) → FinOps Dashboard (QA role)
      {
        project_id: "41000000-0000-0000-0000-000000000001",
        talent_id: "11000000-0000-0000-0000-000000000006",
        status: "shortlisted",
        match_percentage: 83.0,
        match_breakdown: { skills_match: 80, qa_score: 96, typescript_score: 88, playwright_score: 95 }
      },
      // James (Mobile/IoT) → IoT Smart Grid Dashboard
      {
        project_id: "41000000-0000-0000-0000-000000000004",
        talent_id: "11000000-0000-0000-0000-000000000007",
        status: "accepted",
        match_percentage: 92.0,
        match_breakdown: { skills_match: 91, iot_score: 95, react_native_score: 93, firebase_score: 90 }
      },
      // James → ElevateHealth mobile (existing project)
      {
        project_id: "40000000-0000-0000-0000-000000000005",
        talent_id: "11000000-0000-0000-0000-000000000007",
        status: "shortlisted",
        match_percentage: 87.5,
        match_breakdown: { skills_match: 88, mobile_score: 94, react_native_score: 93 }
      },
      // Ryo (Smart Contract Auditor) → P2E contracts
      {
        project_id: "41000000-0000-0000-0000-000000000005",
        talent_id: "11000000-0000-0000-0000-000000000009",
        status: "accepted",
        match_percentage: 99.0,
        match_breakdown: { skills_match: 100, audit_score: 100, defi_score: 99, solidity_score: 100 }
      },
      // Zara (Cloud Architect) → FinOps Dashboard
      {
        project_id: "41000000-0000-0000-0000-000000000001",
        talent_id: "11000000-0000-0000-0000-000000000010",
        status: "accepted",
        match_percentage: 95.5,
        match_breakdown: { skills_match: 96, cloud_score: 98, kubernetes_score: 94, terraform_score: 97 }
      },
      // Zara → CSPM Security project
      {
        project_id: "41000000-0000-0000-0000-000000000002",
        talent_id: "11000000-0000-0000-0000-000000000010",
        status: "shortlisted",
        match_percentage: 91.0,
        match_breakdown: { skills_match: 92, aws_score: 96, azure_score: 93, terraform_score: 95 }
      }
    ];

    const { error: appErr } = await supabase.from("applications").upsert(applications, { onConflict: "project_id,talent_id" });
    if (appErr) console.warn("  ⚠️ Warning upserting applications:", appErr.message);
    else console.log(`  ✅ Successfully seeded ${applications.length} applications.`);

    // ---------------------------------------------------------------
    // 4. Course Enrollments (new users in existing courses)
    // ---------------------------------------------------------------
    console.log("\n🎓 [4/6] Seeding Course Enrollments...");
    const enrollments = [
      // Priya → AI Engineering Masterclass (completed)
      {
        user_id: "11000000-0000-0000-0000-000000000004",
        course_id: "50000000-0000-0000-0000-000000000003",
        completed_lessons: ["60000000-0000-0000-0000-000000000006", "60000000-0000-0000-0000-000000000007"],
        completed_at: new Date(Date.now() - 86400000 * 10).toISOString(),
        credential_id: "CERT-AI-2026-5529",
        digital_signature: "sig_edgetalent_ai_5529_priya_sharma_verified"
      },
      // Lucas → Advanced React Architecture (in progress)
      {
        user_id: "11000000-0000-0000-0000-000000000003",
        course_id: "50000000-0000-0000-0000-000000000001",
        completed_lessons: ["60000000-0000-0000-0000-000000000001", "60000000-0000-0000-0000-000000000002"],
        completed_at: null,
        credential_id: null,
        digital_signature: null
      },
      // Amara → Enterprise Node.js Backend (completed)
      {
        user_id: "11000000-0000-0000-0000-000000000002",
        course_id: "50000000-0000-0000-0000-000000000002",
        completed_lessons: [],
        completed_at: new Date(Date.now() - 86400000 * 5).toISOString(),
        credential_id: "CERT-NODE-2026-3341",
        digital_signature: "sig_edgetalent_node_3341_amara_osei_verified"
      },
      // Fatima → Advanced React Architecture (in progress)
      {
        user_id: "11000000-0000-0000-0000-000000000006",
        course_id: "50000000-0000-0000-0000-000000000001",
        completed_lessons: ["60000000-0000-0000-0000-000000000001"],
        completed_at: null,
        credential_id: null,
        digital_signature: null
      },
      // Zara → Enterprise Node.js Backend (enrolled)
      {
        user_id: "11000000-0000-0000-0000-000000000010",
        course_id: "50000000-0000-0000-0000-000000000002",
        completed_lessons: [],
        completed_at: null,
        credential_id: null,
        digital_signature: null
      }
    ];

    const { error: enrErr } = await supabase.from("course_enrollments").upsert(enrollments, { onConflict: "user_id,course_id" });
    if (enrErr) console.warn("  ⚠️ Warning upserting enrollments:", enrErr.message);
    else console.log(`  ✅ Successfully seeded ${enrollments.length} course enrollments.`);

    // ---------------------------------------------------------------
    // 5. Talent External Certificates
    // ---------------------------------------------------------------
    console.log("\n🏅 [5/6] Seeding External Certificates...");
    const certs = [
      {
        user_id: "11000000-0000-0000-0000-000000000004",
        name: "AWS Certified Machine Learning – Specialty",
        issuing_organization: "Amazon Web Services",
        issue_date: "2025-09-01",
        expiration_date: "2028-09-01",
        credential_id: "AWS-MLS-661234",
        credential_url: "https://aws.amazon.com/verification/AWS-MLS-661234",
        digital_signature: "sig_aws_mls_661234_priya_sharma"
      },
      {
        user_id: "11000000-0000-0000-0000-000000000005",
        name: "Certified Information Systems Security Professional (CISSP)",
        issuing_organization: "(ISC)²",
        issue_date: "2024-04-22",
        expiration_date: "2027-04-22",
        credential_id: "CISSP-220897-ISC2",
        credential_url: "https://www.isc2.org/verify/CISSP-220897",
        digital_signature: "sig_cissp_220897_noah_bergstrom"
      },
      {
        user_id: "11000000-0000-0000-0000-000000000010",
        name: "AWS Certified Solutions Architect – Professional",
        issuing_organization: "Amazon Web Services",
        issue_date: "2025-01-15",
        expiration_date: "2028-01-15",
        credential_id: "AWS-SAP-998821",
        credential_url: "https://aws.amazon.com/verification/AWS-SAP-998821",
        digital_signature: "sig_aws_sap_998821_zara_ahmed"
      },
      {
        user_id: "11000000-0000-0000-0000-000000000009",
        name: "Certified Ethereum Developer",
        issuing_organization: "Ethereum Foundation",
        issue_date: "2025-05-03",
        expiration_date: null,
        credential_id: "ETH-DEV-CER-44512",
        credential_url: "https://www.ethereum.org/verify/ETH-DEV-CER-44512",
        digital_signature: "sig_eth_dev_44512_ryo_nakamura"
      },
      {
        user_id: "11000000-0000-0000-0000-000000000001",
        name: "Certified Solidity Developer",
        issuing_organization: "ConsenSys Academy",
        issue_date: "2024-08-18",
        expiration_date: null,
        credential_id: "CSA-SOL-DEV-71234",
        credential_url: "https://consensys.io/academy/verify/CSA-SOL-DEV-71234",
        digital_signature: "sig_csa_sol_71234_yuki_tanaka"
      },
      {
        user_id: "11000000-0000-0000-0000-000000000002",
        name: "Confluent Certified Developer for Apache Kafka",
        issuing_organization: "Confluent",
        issue_date: "2025-03-28",
        expiration_date: "2027-03-28",
        credential_id: "CCDAK-2025-883421",
        credential_url: "https://www.confluent.io/certification/CCDAK-2025-883421",
        digital_signature: "sig_ccdak_883421_amara_osei"
      }
    ];

    const { error: certErr } = await supabase.from("talent_certificates").upsert(certs);
    if (certErr) console.warn("  ⚠️ Warning upserting certificates:", certErr.message);
    else console.log(`  ✅ Successfully seeded ${certs.length} external certificates.`);

    // ---------------------------------------------------------------
    // 6. Event Registrations (new users RSVPing to existing events)
    // ---------------------------------------------------------------
    console.log("\n📅 [6/6] Seeding Event Registrations...");
    const rsvps = [
      // Hackathon registrations
      { event_id: "80000000-0000-0000-0000-000000000001", user_id: "11000000-0000-0000-0000-000000000001" },
      { event_id: "80000000-0000-0000-0000-000000000001", user_id: "11000000-0000-0000-0000-000000000003" },
      { event_id: "80000000-0000-0000-0000-000000000001", user_id: "11000000-0000-0000-0000-000000000004" },
      { event_id: "80000000-0000-0000-0000-000000000001", user_id: "11000000-0000-0000-0000-000000000007" },
      { event_id: "80000000-0000-0000-0000-000000000001", user_id: "11000000-0000-0000-0000-000000000009" },
      // AI Workshop registrations
      { event_id: "80000000-0000-0000-0000-000000000002", user_id: "11000000-0000-0000-0000-000000000002" },
      { event_id: "80000000-0000-0000-0000-000000000002", user_id: "11000000-0000-0000-0000-000000000004" },
      { event_id: "80000000-0000-0000-0000-000000000002", user_id: "11000000-0000-0000-0000-000000000005" },
      { event_id: "80000000-0000-0000-0000-000000000002", user_id: "11000000-0000-0000-0000-000000000010" },
    ];

    const { error: rsvpErr } = await supabase.from("event_registrations").upsert(rsvps, { onConflict: "event_id,user_id" });
    if (rsvpErr) console.warn("  ⚠️ Warning upserting event registrations:", rsvpErr.message);
    else console.log(`  ✅ Successfully seeded ${rsvps.length} event RSVPs.`);

    // ---------------------------------------------------------------
    // Summary
    // ---------------------------------------------------------------
    console.log("\n" + "=".repeat(60));
    console.log("✨ New Demo Users Seeding Completed Successfully!");
    console.log("=".repeat(60));
    console.log("\n📊 Summary of seeded demo data:");
    console.log(`  • 10 new talent profiles (diverse roles & geographies)`);
    console.log(`  •  3 new partner companies`);
    console.log(`  •  6 new marketplace projects`);
    console.log(`  • ${applications.length} project applications`);
    console.log(`  • ${enrollments.length} course enrollments`);
    console.log(`  • ${certs.length} external certificates`);
    console.log(`  • ${rsvps.length} event RSVPs`);
    console.log("\n🔑 All new users can log in with password: password123");
    console.log("\n👥 New Talent Accounts:");
    authUsers.filter(u => u.id.startsWith("11")).forEach(u =>
      console.log(`   • ${u.full_name.padEnd(22)} — ${u.email}`)
    );
    console.log("\n🏢 New Partner Accounts:");
    authUsers.filter(u => u.id.startsWith("21")).forEach(u =>
      console.log(`   • ${u.full_name.padEnd(26)} — ${u.email}`)
    );

  } catch (err: any) {
    console.error("\n❌ Seeding failed:", err.message);
    process.exit(1);
  }
}

seedNewUsers();
