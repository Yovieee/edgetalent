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
const serviceRoleKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");

if (!serviceRoleKey) {
  console.error("ERROR: SUPABASE_SERVICE_ROLE_KEY not found in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function runQuery(label: string, sql: string) {
  console.log(`\n--- ${label} ---`);
  const { data, error } = await supabase.rpc("", {} as any).then(
    () => ({ data: null, error: null }),
    () => ({ data: null, error: null })
  );
  // Use the REST SQL endpoint directly
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/`, {
    method: "POST",
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
    },
  });
  // Fallback: use raw postgres via the management API
}

async function diagnose() {
  console.log("=== Supabase Auth Schema Diagnostics ===\n");
  console.log("URL:", supabaseUrl);

  // 1. Check user count
  console.log("\n--- 1. Auth Users Count ---");
  const { data: users, error: usersErr } = await supabase
    .from("users")
    .select("id", { count: "exact", head: true })
    .limit(0);
  // This won't work on auth schema via PostgREST. Let's use the admin API instead.

  // Use the admin auth API to list users
  console.log("\n--- 1. Auth Users (via Admin API) ---");
  const { data: authUsers, error: authUsersErr } =
    await supabase.auth.admin.listUsers({ page: 1, perPage: 100 });
  if (authUsersErr) {
    console.error("ERROR:", authUsersErr.message);
  } else {
    console.log(`Total users: ${authUsers.users.length}`);
    authUsers.users.forEach((u) => {
      console.log(`  - ${u.email} (id: ${u.id}, created: ${u.created_at})`);
    });
  }

  // 2. Check extensions via PostgREST RPC - we need a function for this
  // Instead, let's query via the SQL endpoint
  console.log("\n--- 2. Check Extensions (via REST) ---");
  try {
    const extResponse = await fetch(
      `${supabaseUrl}/rest/v1/rpc/`,
      {
        method: "POST",
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
          "Content-Type": "application/json",
        },
      }
    );
    console.log("REST /rpc/ status:", extResponse.status);
  } catch (e: any) {
    console.log("REST error:", e.message);
  }

  // 3. Try direct auth sign-in to see the exact error
  console.log("\n--- 3. Auth Sign-In Test ---");
  const { data: signInData, error: signInErr } =
    await supabase.auth.signInWithPassword({
      email: "sarah.chen@ai-edge.org",
      password: "password123",
    });
  if (signInErr) {
    console.error("Sign-in error:", JSON.stringify(signInErr, null, 2));
  } else {
    console.log("Sign-in OK! User:", signInData.user?.email);
  }

  // 4. Try the raw token endpoint to see full error
  console.log("\n--- 4. Raw Token Endpoint ---");
  try {
    const tokenResponse = await fetch(
      `${supabaseUrl}/auth/v1/token?grant_type=password`,
      {
        method: "POST",
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "sarah.chen@ai-edge.org",
          password: "password123",
        }),
      }
    );
    console.log("Status:", tokenResponse.status);
    const body = await tokenResponse.json();
    console.log("Response:", JSON.stringify(body, null, 2));
  } catch (e: any) {
    console.error("Fetch error:", e.message);
  }

  // 5. Check auth health
  console.log("\n--- 5. Auth Health ---");
  try {
    const healthResponse = await fetch(`${supabaseUrl}/auth/v1/health`, {
      headers: { apikey: serviceRoleKey },
    });
    const healthBody = await healthResponse.json();
    console.log("Health:", JSON.stringify(healthBody, null, 2));
  } catch (e: any) {
    console.error("Health check error:", e.message);
  }

  // 6. Check public schema tables (to see if any triggers/functions reference auth)
  console.log("\n--- 6. Public Tables ---");
  const { data: tables, error: tablesErr } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .limit(0);
  if (tablesErr) {
    console.error("Profiles table error:", tablesErr.message, tablesErr.code, tablesErr.details);
  } else {
    console.log("Profiles table accessible");
  }

  // 7. Try to create a test user via admin to see if auth.users is writable
  console.log("\n--- 7. Admin Create User Test ---");
  const testEmail = `diag-test-${Date.now()}@test.com`;
  const { data: newUser, error: createErr } =
    await supabase.auth.admin.createUser({
      email: testEmail,
      password: "testpass123",
      email_confirm: true,
    });
  if (createErr) {
    console.error("Create user error:", JSON.stringify(createErr, null, 2));
  } else {
    console.log("Created test user:", newUser.user?.id);
    // Try to sign in with the new user
    console.log("  Attempting sign-in with new user...");
    const { error: newSignInErr } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: "testpass123",
    });
    if (newSignInErr) {
      console.error("  Sign-in with new user failed:", JSON.stringify(newSignInErr, null, 2));
    } else {
      console.log("  Sign-in with new user OK!");
    }
    // Clean up
    await supabase.auth.admin.deleteUser(newUser.user!.id);
    console.log("  Cleaned up test user.");
  }
}

diagnose().catch(console.error);
