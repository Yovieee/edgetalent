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

async function diagnose() {
  console.log("=== Deep Auth Diagnostics ===\n");

  // 1. Try admin.getUserById for each seeded user
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const seededIds = [
    { id: "10000000-0000-0000-0000-000000000001", email: "sarah.chen@ai-edge.org" },
    { id: "90000000-0000-0000-0000-000000000001", email: "edgetalentindonesia@gmail.com" },
  ];

  console.log("--- 1. Admin getUserById ---");
  for (const u of seededIds) {
    const { data, error } = await supabase.auth.admin.getUserById(u.id);
    if (error) {
      console.log(`  ${u.email}: ERROR - ${JSON.stringify(error)}`);
    } else {
      console.log(`  ${u.email}: OK (id=${data.user.id})`);
    }
  }

  // 2. Create a temporary RPC function to query auth.users directly
  console.log("\n--- 2. Creating temp diagnostic function ---");
  const createFnResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
    method: "POST",
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: "SELECT 1" }),
  });
  console.log("exec_sql exists?", createFnResponse.status);

  // 3. Use the raw SQL via pg_net or management API isn't available
  // Instead, let's create a function via PostgREST
  // First, we need to check if we can create functions via REST... we can't.
  // Let's try a different approach - use the Supabase DB REST proxy

  // Actually, let's try the Management API
  console.log("\n--- 3. Checking auth.users via Management API ---");
  // The management API uses a different endpoint format
  // But we can check user details from admin API

  console.log("\n--- 4. Admin listUsers with pagination ---");
  try {
    const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1 });
    if (error) {
      console.log("listUsers error:", JSON.stringify(error));
    } else {
      console.log("listUsers OK, total:", data.users.length);
    }
  } catch (e: any) {
    console.log("listUsers exception:", e.message);
  }

  // 5. Try to sign in with the admin email (whitelisted, possibly still exists from before reset)
  console.log("\n--- 5. Sign-in tests ---");
  const testEmails = [
    { email: "sarah.chen@ai-edge.org", label: "seeded talent" },
    { email: "edgetalentindonesia@gmail.com", label: "admin" },
    { email: "blasius.yonas@gmail.com", label: "whitelisted (pre-reset)" },
  ];

  for (const t of testEmails) {
    try {
      const resp = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
        method: "POST",
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: t.email, password: "password123" }),
      });
      const body = await resp.json();
      if (resp.ok) {
        console.log(`  ${t.label} (${t.email}): OK`);
      } else {
        console.log(`  ${t.label} (${t.email}): ${resp.status} - ${body.msg || body.error || JSON.stringify(body)}`);
      }
    } catch (e: any) {
      console.log(`  ${t.label} (${t.email}): EXCEPTION - ${e.message}`);
    }
  }

  // 6. Try querying auth schema via a custom function we create
  console.log("\n--- 6. Direct auth.users query via temp function ---");
  // We'll use the SQL editor approach - create a function, call it, drop it
  const fnName = `_diag_check_auth_${Date.now()}`;
  
  // Create function via PostgREST - this won't work directly
  // Instead, let's use the Supabase Management API SQL endpoint
  const projectRef = supabaseUrl.replace("https://", "").replace(".supabase.co", "");
  
  // Try the SQL API endpoint (available in newer Supabase versions)
  const sqlQueries = [
    {
      label: "User count in auth.users",
      sql: "SELECT count(*) as cnt FROM auth.users"
    },
    {
      label: "Check encrypted_password validity", 
      sql: "SELECT id, email, length(encrypted_password) as pwd_len, left(encrypted_password, 7) as pwd_prefix FROM auth.users LIMIT 10"
    },
    {
      label: "Check auth.identities",
      sql: "SELECT count(*) as cnt FROM auth.identities"
    },
    {
      label: "Check triggers on auth.users",
      sql: "SELECT trigger_name, event_manipulation, action_statement FROM information_schema.triggers WHERE event_object_schema = 'auth' AND event_object_table = 'users'"
    },
    {
      label: "Check for broken crypt extension",
      sql: "SELECT extname, extversion FROM pg_extension WHERE extname IN ('pgcrypto', 'pgjwt', 'uuid-ossp')"
    },
    {
      label: "Validate bcrypt hash with crypt()",
      sql: "SELECT id, email, CASE WHEN encrypted_password = crypt('password123', encrypted_password) THEN 'VALID' ELSE 'INVALID' END as hash_check FROM auth.users LIMIT 10"
    }
  ];

  for (const q of sqlQueries) {
    console.log(`\n  >> ${q.label}`);
    try {
      // Try via pg_jsonb or similar available functions
      const resp = await fetch(`${supabaseUrl}/rest/v1/rpc/${fnName}`, {
        method: "POST",
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });
      // This will 404 since the function doesn't exist
    } catch (e) {
      // Expected
    }
  }

  // 7. The real test - try to verify the bcrypt hash locally
  console.log("\n--- 7. BCrypt hash analysis ---");
  const seedHash = "$2a$10$wT.f/t.JOfx9.Y.T.D/mIuA1J8Y9j/k5O/3wW4.q1gA5/gXw.y";
  console.log(`  Hash: ${seedHash}`);
  console.log(`  Length: ${seedHash.length} (should be 60)`);
  console.log(`  Prefix: ${seedHash.substring(0, 7)} (should be $2a$XX$ or $2b$XX$)`);
  
  // Valid bcrypt: $2a$10$ + 22 chars salt + 31 chars hash = 60 total
  const afterPrefix = seedHash.substring(7);
  console.log(`  After prefix length: ${afterPrefix.length} (should be 53 = 22 salt + 31 hash)`);
  
  // Check valid base64 chars for bcrypt (./A-Za-z0-9)
  const validChars = /^[./A-Za-z0-9]+$/;
  console.log(`  Valid bcrypt chars: ${validChars.test(afterPrefix)}`);
  
  if (seedHash.length !== 60) {
    console.log("\n  ⚠️  INVALID BCRYPT HASH LENGTH! This is likely the root cause.");
    console.log("  GoTrue's crypt() function crashes on invalid bcrypt hashes,");
    console.log("  returning 'Database error querying schema' instead of 'invalid credentials'.");
  }
}

diagnose().catch(console.error);
