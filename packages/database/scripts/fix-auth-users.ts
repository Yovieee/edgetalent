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

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

interface UserSeed {
  id: string;
  email: string;
  fullName: string;
  role: string;
}

const users: UserSeed[] = [
  { id: "10000000-0000-0000-0000-000000000001", email: "sarah.chen@ai-edge.org", fullName: "Dr. Sarah Chen", role: "talent" },
  { id: "10000000-0000-0000-0000-000000000002", email: "marcus.vance@devstudio.com", fullName: "Marcus Vance", role: "talent" },
  { id: "10000000-0000-0000-0000-000000000003", email: "elena.rostova@uxcraft.design", fullName: "Elena Rostova", role: "talent" },
  { id: "10000000-0000-0000-0000-000000000004", email: "alex.rivera@mobileedge.io", fullName: "Alex Rivera", role: "talent" },
  { id: "10000000-0000-0000-0000-000000000005", email: "david.kalu@cloudops.net", fullName: "David Kalu", role: "talent" },
  { id: "20000000-0000-0000-0000-000000000001", email: "contact@nexusailabs.io", fullName: "Nexus AI Labs", role: "partner" },
  { id: "20000000-0000-0000-0000-000000000002", email: "partnerships@quantumpay.com", fullName: "QuantumPay FinTech", role: "partner" },
  { id: "20000000-0000-0000-0000-000000000003", email: "info@elevatehealth.org", fullName: "ElevateHealth Tech", role: "partner" },
  { id: "90000000-0000-0000-0000-000000000001", email: "edgetalentindonesia@gmail.com", fullName: "EdgeTalent Master Admin", role: "admin" },
];

async function fixUsers() {
  console.log("=== Fix Auth Users: Delete broken users and recreate via Admin API ===\n");

  // Step 1: Try to delete all broken seeded users
  console.log("--- Step 1: Deleting broken seeded users ---");
  for (const u of users) {
    try {
      const { error } = await supabase.auth.admin.deleteUser(u.id);
      if (error) {
        console.log(`  Delete ${u.email}: ERROR (${JSON.stringify(error)}) - may not exist`);
      } else {
        console.log(`  Delete ${u.email}: OK`);
      }
    } catch (e: any) {
      console.log(`  Delete ${u.email}: EXCEPTION - ${e.message}`);
    }
  }

  // Step 2: Recreate users via Admin API (which generates proper bcrypt hashes)
  console.log("\n--- Step 2: Creating users via Admin API ---");
  for (const u of users) {
    try {
      const { data, error } = await supabase.auth.admin.createUser({
        id: u.id,
        email: u.email,
        password: "password123",
        email_confirm: true,
        user_metadata: { full_name: u.fullName },
      });
      if (error) {
        console.log(`  Create ${u.email}: ERROR - ${error.message}`);
      } else {
        console.log(`  Create ${u.email}: OK (id=${data.user.id})`);
      }
    } catch (e: any) {
      console.log(`  Create ${u.email}: EXCEPTION - ${e.message}`);
    }
  }

  // Step 3: Update profiles with correct roles (the trigger creates profiles but with NULL role)
  console.log("\n--- Step 3: Updating profile roles ---");
  for (const u of users) {
    const { error } = await supabase
      .from("profiles")
      .update({ role: u.role })
      .eq("id", u.id);
    if (error) {
      console.log(`  Update role ${u.email}: ERROR - ${error.message}`);
    } else {
      console.log(`  Update role ${u.email}: OK (${u.role})`);
    }
  }

  // Step 4: Verify sign-in works
  console.log("\n--- Step 4: Verification ---");
  const testUsers = [
    { email: "sarah.chen@ai-edge.org", label: "talent" },
    { email: "edgetalentindonesia@gmail.com", label: "admin" },
  ];

  for (const t of testUsers) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: t.email,
      password: "password123",
    });
    if (error) {
      console.log(`  Sign-in ${t.label} (${t.email}): ❌ ${error.message}`);
    } else {
      console.log(`  Sign-in ${t.label} (${t.email}): ✅ OK (id=${data.user?.id})`);
      // Sign out
      await supabase.auth.signOut();
    }
  }

  // Step 5: Verify listUsers works
  console.log("\n--- Step 5: Admin listUsers ---");
  const { data: listData, error: listError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 100 });
  if (listError) {
    console.log(`  listUsers: ❌ ${JSON.stringify(listError)}`);
  } else {
    console.log(`  listUsers: ✅ ${listData.users.length} users found`);
    listData.users.forEach(u => console.log(`    - ${u.email} (${u.id})`));
  }

  console.log("\n=== Done! ===");
}

fixUsers().catch(console.error);
