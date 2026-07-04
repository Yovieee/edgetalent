import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";
import { z } from "https://deno.land/x/zod@v3.21.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Enforce request schema using Zod
const RequestSchema = z.object({
  projectId: z.string().uuid("Invalid projectId UUID format")
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const openrouterApiKey = Deno.env.get("OPENROUTER_API_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase env variables.");
    }
    if (!openrouterApiKey) {
      throw new Error("Missing OPENROUTER_API_KEY environment variable.");
    }

    // Authenticate the user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace(/^bearer\s+/i, "");
    const supabaseAnonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY") || "", {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabaseAnonClient.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized user token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse request body
    const body = await req.json().catch(() => ({}));
    const validation = RequestSchema.safeParse(body);
    if (!validation.success) {
      return new Response(JSON.stringify({ error: validation.error.errors[0].message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { projectId } = validation.data;

    // Initialize admin client to fetch and update the project
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch the project and verify ownership
    const { data: project, error: fetchError } = await supabaseAdmin
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .single();

    if (fetchError || !project) {
      return new Response(JSON.stringify({ error: "Project not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify that the user calling the function is the project owner
    if (project.partner_id !== user.id) {
      return new Response(JSON.stringify({ error: "Forbidden: You do not own this project" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Construct text representation for embedding
    const title = project.title || "";
    const description = project.description || "";
    const requiredSkills = Array.isArray(project.required_skills) ? project.required_skills.join(", ") : "";
    const inputContent = `Project Title: ${title}. Required Skills: ${requiredSkills}. Description: ${description}.`;

    // Call OpenRouter Embeddings API
    const embedResponse = await fetch("https://openrouter.ai/api/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openrouterApiKey}`
      },
      body: JSON.stringify({
        model: "openai/text-embedding-3-small",
        input: inputContent
      })
    });

    if (!embedResponse.ok) {
      const errorText = await embedResponse.text();
      throw new Error(`OpenRouter Embeddings API failed: ${embedResponse.statusText}. Details: ${errorText}`);
    }

    const embedData = await embedResponse.json();
    const embedding = embedData.data?.[0]?.embedding;
    if (!embedding) {
      throw new Error("No embedding returned from OpenRouter Embeddings API.");
    }

    // Update project with vector embedding
    const { error: updateError } = await supabaseAdmin
      .from("projects")
      .update({ embedding })
      .eq("id", projectId);

    if (updateError) {
      throw new Error(`Failed to update project embedding: ${updateError.message}`);
    }

    return new Response(JSON.stringify({ success: true, projectId }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
