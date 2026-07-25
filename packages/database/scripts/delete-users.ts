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

const WHITELISTED_EMAILS = new Set([
  "blasius.yonas@gmail.com",
  "nana59352@gmail.com",
  "edgetalentindonesia@gmail.com"
]);

async function main() {
  console.log("🧹 Starting EdgeTalent User Cleanup Script...");
  console.log(`📍 Target Supabase Instance: ${supabaseUrl}`);
  console.log(`🛡️ Whitelisted emails to keep: ${Array.from(WHITELISTED_EMAILS).join(", ")}`);

  if (!supabaseKey) {
    console.warn("⚠️ SUPABASE_SERVICE_ROLE_KEY not found in environment or .env file.");
    console.warn("   To execute user deletion on live Supabase, set SUPABASE_SERVICE_ROLE_KEY in .env");
    console.log("\n📄 SQL Migration file is ready at:");
    console.log("   packages/database/supabase/migrations/20260726000001_delete_users_except_whitelisted.sql\n");
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false }
  });

  try {
    // 1. Fetch all Auth users
    const { data: usersData, error: listErr } = await supabase.auth.admin.listUsers();
    if (listErr) {
      throw new Error(`Failed to list users from auth: ${listErr.message}`);
    }

    const usersToDelete = (usersData?.users || []).filter(user => {
      const email = user.email?.toLowerCase().trim();
      return !email || !WHITELISTED_EMAILS.has(email);
    });

    console.log(`🔍 Found ${usersData?.users?.length || 0} total auth users. ${usersToDelete.length} slated for deletion.`);

    for (const u of usersToDelete) {
      console.log(`🗑️ Deleting user: ${u.email} (ID: ${u.id})...`);
      const { error: delErr } = await supabase.auth.admin.deleteUser(u.id);
      if (delErr) {
        console.error(`❌ Failed to delete user ${u.email}: ${delErr.message}`);
      } else {
        console.log(`  ✅ Successfully deleted ${u.email}`);
      }
    }

    // 2. Also delete any orphaned profiles from public.profiles
    const { data: profiles, error: profErr } = await supabase
      .from("profiles")
      .select("id, email");

    if (!profErr && profiles) {
      const orphanProfiles = profiles.filter(p => {
        const email = p.email?.toLowerCase().trim();
        return !email || !WHITELISTED_EMAILS.has(email);
      });

      for (const p of orphanProfiles) {
        console.log(`🗑️ Deleting profile: ${p.email} (ID: ${p.id})...`);
        const { error: pDelErr } = await supabase.from("profiles").delete().eq("id", p.id);
        if (pDelErr) {
          console.error(`❌ Failed to delete profile ${p.email}: ${pDelErr.message}`);
        } else {
          console.log(`  ✅ Successfully deleted profile ${p.email}`);
        }
      }
    }

    console.log("\n✨ User cleanup process completed successfully.");
  } catch (err: any) {
    console.error("❌ Error during user cleanup:", err.message);
    process.exit(1);
  }
}

main();
