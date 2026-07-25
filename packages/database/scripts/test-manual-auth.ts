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

const supabaseUrl = getEnv("SUPABASE_URL", getEnv("VITE_SUPABASE_URL"));
const anonKey = getEnv("VITE_SUPABASE_ANON_KEY");
const serviceRoleKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");

const supabase = createClient(supabaseUrl, serviceRoleKey || anonKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function run() {
  console.log("Testing create_manual_user RPC function...");
  const testEmail = `test.manual.${Date.now()}@edgetalent.org`;
  const testPassword = "Password123!";
  const testFullName = "Test Manual User";
  const testRole = "partner";

  const { data, error } = await supabase.rpc("create_manual_user", {
    p_email: testEmail,
    p_password: testPassword,
    p_full_name: testFullName,
    p_role: testRole,
  });

  if (error) {
    console.error("RPC error (migration might need to be applied in Supabase dashboard):", error);
  } else {
    console.log("RPC result:", data);
  }
}

run().catch(console.error);
