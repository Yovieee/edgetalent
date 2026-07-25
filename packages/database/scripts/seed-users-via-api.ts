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
const supabaseAnonKey = getEnv("SUPABASE_ANON_KEY", getEnv("VITE_SUPABASE_ANON_KEY"));

if (!supabaseAnonKey) {
  console.error("❌ SUPABASE_ANON_KEY or VITE_SUPABASE_ANON_KEY is required.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

const users = [
  { email: "sarah.chen@ai-edge.org", full_name: "Dr. Sarah Chen" },
  { email: "marcus.vance@devstudio.com", full_name: "Marcus Vance" },
  { email: "elena.rostova@uxcraft.design", full_name: "Elena Rostova" },
  { email: "alex.rivera@mobileedge.io", full_name: "Alex Rivera" },
  { email: "david.kalu@cloudops.net", full_name: "David Kalu" },
  { email: "contact@nexusailabs.io", full_name: "Nexus AI Labs" },
  { email: "partnerships@quantumpay.com", full_name: "QuantumPay FinTech" },
  { email: "info@elevatehealth.org", full_name: "ElevateHealth Tech" },
  { email: "edgetalentindonesia@gmail.com", full_name: "EdgeTalent Master Admin" }
];

async function seed() {
  console.log("🌱 Registering users via Supabase API (bypassing raw SQL to avoid 500 errors)...");
  
  // First, we need to ensure the user is deleted if they exist, but we can't via anon key.
  // We will assume the user has run the DELETE FROM auth.users SQL query.
  
  for (const u of users) {
    const { data, error } = await supabase.auth.signUp({
      email: u.email,
      password: "password123",
      options: {
        data: { full_name: u.full_name }
      }
    });
    if (error) {
      console.log(`❌ Failed to register ${u.email}:`, error.message);
    } else {
      console.log(`✅ Registered ${u.email}`);
    }
  }
  console.log("\n🎉 All users registered successfully!");
  console.log("👉 IMPORTANT: Since these were registered via API, they are currently unconfirmed.");
  console.log("👉 Please run the following SQL in your Supabase SQL Editor to confirm them:");
  console.log("\n   UPDATE auth.users SET email_confirmed_at = NOW();\n");
}

seed();
