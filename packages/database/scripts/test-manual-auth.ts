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

  const { data: createData, error: createError } = await supabase.rpc("create_manual_user", {
    p_email: testEmail,
    p_password: testPassword,
    p_full_name: testFullName,
    p_role: testRole,
  });

  if (createError) {
    console.error("create_manual_user error:", createError);
  } else {
    console.log("create_manual_user result:", createData);
  }

  console.log("Testing login_manual_user RPC function...");
  const { data: loginData, error: loginError } = await supabase.rpc("login_manual_user", {
    p_email: testEmail,
    p_password: testPassword,
  });

  if (loginError) {
    console.error("login_manual_user error:", loginError);
  } else {
    console.log("login_manual_user result:", loginData);
  }

  console.log("Testing reset_user_password_manual RPC function...");
  const newPassword = "NewPassword123!";
  const { data: resetData, error: resetError } = await supabase.rpc("reset_user_password_manual", {
    p_email: testEmail,
    p_new_password: newPassword,
  });

  if (resetError) {
    console.error("reset_user_password_manual error:", resetError);
  } else {
    console.log("reset_user_password_manual result:", resetData);
  }
}

run().catch(console.error);

