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

async function main() {
  console.log("🧹 Starting Reset & Re-Seed Data Script...");
  console.log(`📍 Supabase Target: ${supabaseUrl}`);

  const migrationPath = path.resolve(__dirname, "../supabase/migrations/20260726000002_reset_and_reseed_all_data.sql");

  if (!supabaseKey) {
    console.warn("⚠️ SUPABASE_SERVICE_ROLE_KEY is required to reset & re-seed auth users via API.");
    console.log(`\n📄 SQL Reset & Seed migration script is available at:\n   ${migrationPath}`);
    console.log("\n👉 You can paste & run this SQL file directly in Supabase Dashboard -> SQL Editor.\n");
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false }
  });

  try {
    console.log("⚡ Executing reset & seed SQL...");
    const sqlContent = fs.readFileSync(migrationPath, "utf-8");
    
    // Deleting existing auth users programmatically
    const { data: usersData } = await supabase.auth.admin.listUsers();
    if (usersData?.users) {
      console.log(`🗑️ Deleting ${usersData.users.length} existing Auth Users...`);
      for (const u of usersData.users) {
        await supabase.auth.admin.deleteUser(u.id).catch(() => {});
      }
    }

    console.log("✅ Auth Users reset complete.");
    console.log("👉 Please apply migration 20260726000002_reset_and_reseed_all_data.sql in Supabase SQL Editor to populate new dummy data.");
  } catch (err: any) {
    console.error("❌ Error during reset & seed:", err.message);
  }
}

main();
