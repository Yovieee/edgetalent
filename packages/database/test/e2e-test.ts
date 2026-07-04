import { createClient } from "@supabase/supabase-js";
import { RegisterSchema, ProjectSchema, ApplicationSchema } from "@edgetalent/shared";

// Load environment variables
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

async function runE2ETests() {
  console.log("🚀 Starting EdgeTalent End-to-End (E2E) Integration Tests...");
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("❌ Error: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.");
    console.log("\n💡 How to run this test suite:");
    console.log("Set your environment variables and execute the script:");
    console.log("  $env:VITE_SUPABASE_URL=\"https://your-project.supabase.co\"");
    console.log("  $env:SUPABASE_SERVICE_ROLE_KEY=\"your-service-role-key\"");
    console.log("  npm run test:e2e\n");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  // Test data variables
  const testTalentId = "00000000-0000-0000-0000-000000000001";
  const testPartnerId = "00000000-0000-0000-0000-000000000002";
  let testProjectId: string | null = null;
  
  try {
    // -------------------------------------------------------------
    // Test 1: Zod Schemas & Auth Validation
    // -------------------------------------------------------------
    console.log("\n🧪 [1/6] Testing Zod Input Validations...");
    const badEmailAuth = RegisterSchema.safeParse({ email: "invalid-email", password: "123", fullName: "" });
    if (!badEmailAuth.success) {
      console.log("  ✅ Zod correctly blocked invalid email/password format:", badEmailAuth.error.errors[0].message);
    } else {
      throw new Error("Zod failed to catch invalid signup payload");
    }

    const goodAuth = RegisterSchema.safeParse({ email: "test-talent@edgetalent.com", password: "securepassword123", fullName: "Test Talent" });
    if (goodAuth.success) {
      console.log("  ✅ Zod successfully validated correct signup credentials.");
    } else {
      throw new Error("Zod threw false positive error for correct signup credentials");
    }

    // -------------------------------------------------------------
    // Test 2: Database Schema & Trigger Mocking
    // -------------------------------------------------------------
    console.log("\n🧪 [2/6] Verifying database profiles and trigger mocks...");
    
    // Upsert a test talent profile using Service Role key
    const { data: talentProfile, error: talentErr } = await supabase
      .from("profiles")
      .upsert({
        id: testTalentId,
        full_name: "Test Talent Agent",
        email: "test-talent@edgetalent.com",
        role: "talent",
        skills: ["React", "TypeScript", "HTML"],
        skill_gaps: ["pgvector", "Deno"]
      })
      .select()
      .single();

    if (talentErr || !talentProfile) throw new Error(`Talent upsert failed: ${talentErr?.message}`);
    console.log("  ✅ Talent profile successfully upserted into profiles table.");
    console.log(`     Profile UUID: ${talentProfile.id} | Assigned Role: ${talentProfile.role}`);

    // Upsert a test partner profile using Service Role key
    const { data: partnerProfile, error: partnerErr } = await supabase
      .from("profiles")
      .upsert({
        id: testPartnerId,
        full_name: "Test Partner Org",
        email: "test-partner@edgetalent.com",
        role: "partner"
      })
      .select()
      .single();

    if (partnerErr || !partnerProfile) throw new Error(`Partner upsert failed: ${partnerErr?.message}`);
    console.log("  ✅ Partner profile successfully upserted into profiles table.");
    console.log(`     Profile UUID: ${partnerProfile.id} | Assigned Role: ${partnerProfile.role}`);

    // -------------------------------------------------------------
    // Test 3: Project manager validation & inserts
    // -------------------------------------------------------------
    console.log("\n🧪 [3/6] Testing project creation parameters and schemas...");
    
    const projectPayload = {
      partner_id: testPartnerId,
      title: "EdgeTalent AI Matching Engine",
      description: "Build an end-to-end vector matching pipeline inside PostgreSQL using pgvector, typescript, and deno edge functions.",
      required_skills: ["TypeScript", "Supabase", "pgvector"],
      budget: 1500,
      scope: "medium-term"
    };

    const projectCheck = ProjectSchema.safeParse(projectPayload);
    if (!projectCheck.success) {
      throw new Error(`Project Zod validation failed: ${projectCheck.error.errors[0].message}`);
    }
    console.log("  ✅ Zod correctly validated the project publication scope.");

    // Insert project
    const { data: newProj, error: projInsertErr } = await supabase
      .from("projects")
      .insert(projectCheck.data)
      .select()
      .single();

    if (projInsertErr || !newProj) throw new Error(`Database project insert failed: ${projInsertErr?.message}`);
    testProjectId = newProj.id;
    console.log(`  ✅ Project inserted. Project ID: ${testProjectId} | Budget: $${newProj.budget}`);

    // -------------------------------------------------------------
    // Test 4: Mock pgvector calculations & updates
    // -------------------------------------------------------------
    console.log("\n🧪 [4/6] Simulating Edge Functions pgvector embedding updates...");
    
    // We mock the 1536-dimensional float array for testing vector operations
    const mockVector = Array(1536).fill(0.025);
    
    // Update projects embedding
    const { error: projVectorErr } = await supabase
      .from("projects")
      .update({ embedding: mockVector })
      .eq("id", testProjectId);

    if (projVectorErr) throw new Error(`Failed to update project mock embedding: ${projVectorErr.message}`);
    console.log("  ✅ Project mock vector embedding updated in database.");

    // Update talent embedding
    const { error: talentVectorErr } = await supabase
      .from("profiles")
      .update({ skills_embedding: mockVector })
      .eq("id", testTalentId);

    if (talentVectorErr) throw new Error(`Failed to update talent mock embedding: ${talentVectorErr.message}`);
    console.log("  ✅ Talent profile mock vector embedding updated in database.");

    // -------------------------------------------------------------
    // Test 5: pgvector Vector Search similarity matching RPC calls
    // -------------------------------------------------------------
    console.log("\n🧪 [5/6] Testing pgvector similarity queries (RPC calls)...");
    
    // Call match_projects_for_talent
    const { data: matchedProjects, error: rpcProjErr } = await supabase
      .rpc("match_projects_for_talent", { p_talent_id: testTalentId, p_match_limit: 5 });

    if (rpcProjErr) throw new Error(`RPC match_projects_for_talent failed: ${rpcProjErr.message}`);
    console.log(`  ✅ RPC match_projects_for_talent completed. Found ${matchedProjects?.length || 0} matches.`);
    if (matchedProjects && matchedProjects.length > 0) {
      console.log(`     Top match: "${matchedProjects[0].title}" | Match Score: ${Math.round(matchedProjects[0].similarity * 100)}%`);
    }

    // Call match_talents_for_project
    const { data: matchedTalents, error: rpcTalentErr } = await supabase
      .rpc("match_talents_for_project", { p_project_id: testProjectId, p_match_limit: 5 });

    if (rpcTalentErr) throw new Error(`RPC match_talents_for_project failed: ${rpcTalentErr.message}`);
    console.log(`  ✅ RPC match_talents_for_project completed. Found ${matchedTalents?.length || 0} matches.`);
    if (matchedTalents && matchedTalents.length > 0) {
      console.log(`     Top candidate: "${matchedTalents[0].full_name}" | Match Score: ${Math.round(matchedTalents[0].similarity * 100)}%`);
    }

    // -------------------------------------------------------------
    // Test 6: Project Application & Constraints
    // -------------------------------------------------------------
    console.log("\n🧪 [6/6] Testing job applications and schema constraints...");
    
    const appPayload = {
      project_id: testProjectId,
      talent_id: testTalentId,
      status: "applied",
      match_percentage: 100,
      match_breakdown: { score_type: "mock E2E similarity" }
    };

    const appCheck = ApplicationSchema.safeParse(appPayload);
    if (!appCheck.success) {
      throw new Error(`Application Zod validation failed: ${appCheck.error.errors[0].message}`);
    }

    const { data: newApp, error: appInsertErr } = await supabase
      .from("applications")
      .insert(appCheck.data)
      .select()
      .single();

    if (appInsertErr || !newApp) throw new Error(`Database application insert failed: ${appInsertErr?.message}`);
    console.log(`  ✅ Job application successfully submitted. Application ID: ${newApp.id}`);

    // Verify unique constraint: applying to the same project twice should fail
    const { error: doubleAppErr } = await supabase
      .from("applications")
      .insert(appCheck.data);

    if (doubleAppErr) {
      console.log("  ✅ Database correctly blocked duplicate applications (unique constraint passed).");
    } else {
      throw new Error("Database failed to block duplicate job applications!");
    }

    console.log("\n✨ All End-to-End (E2E) integration test cases passed successfully!");

  } catch (err: any) {
    console.error("\n❌ E2E Integration Test failed: ", err.message);
  } finally {
    // -------------------------------------------------------------
    // Cleanup / Teardown
    // -------------------------------------------------------------
    console.log("\n🧹 Cleaning up test database records...");
    
    if (testProjectId) {
      const { error: cleanProjErr } = await supabase
        .from("projects")
        .delete()
        .eq("id", testProjectId);
      if (cleanProjErr) console.error("Error cleaning test project:", cleanProjErr.message);
    }
    
    const { error: cleanTalentErr } = await supabase
      .from("profiles")
      .delete()
      .eq("id", testTalentId);
    if (cleanTalentErr) console.error("Error cleaning test talent profile:", cleanTalentErr.message);

    const { error: cleanPartnerErr } = await supabase
      .from("profiles")
      .delete()
      .eq("id", testPartnerId);
    if (cleanPartnerErr) console.error("Error cleaning test partner profile:", cleanPartnerErr.message);

    console.log("🧹 Test database records cleaned up. Teardown complete.\n");
  }
}

runE2ETests();
