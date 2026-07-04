import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";
import { z } from "https://deno.land/x/zod@v3.21.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Enforce incoming request schema using Zod
const RequestSchema = z.object({
  cvText: z.string().optional().default(""),
  targetRole: z.string().optional().default("Fullstack Developer"),
  quizAnswers: z.string().optional().default("")
}).refine(data => data.cvText.trim() !== "" || data.quizAnswers.trim() !== "", {
  message: "Provide either cvText or quizAnswers to analyze."
});

serve(async (req) => {
  // Handle CORS preflight
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

    // Authenticate the user calling the function
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

    const { cvText, targetRole, quizAnswers } = validation.data;

    // 1. Call OpenRouter to analyze skill gaps
    const promptSystem = `You are an expert AI Career Coach and Technical Recruiter.
Analyze the user's technical profile (CV/Resume and/or Quiz Answers) against industry standards for the target role: "${targetRole}".
Identify verified skills, clear skill gaps, and write a summary bio for semantic search mapping.
You MUST output your response strictly as a JSON object with this exact structure:
{
  "skills": ["Skill1", "Skill2", "Skill3"],
  "skill_gaps": ["Gap1", "Gap2"],
  "bio": "A comprehensive summary bio describing their current skill set, target goals, and main upskilling areas."
}
Return ONLY valid JSON. No markdown wrappers.`;

    const promptUser = `User Technical Details:
CV/Resume Text:
${cvText}

Quiz Answers/Performance:
${quizAnswers}`;

    const chatResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openrouterApiKey}`,
        "HTTP-Referer": "https://edgetalent.github.io",
        "X-Title": "EdgeTalent"
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: promptSystem },
          { role: "user", content: promptUser }
        ],
        response_format: { type: "json_object" }
      })
    });

    if (!chatResponse.ok) {
      const errorText = await chatResponse.text();
      throw new Error(`OpenRouter Chat API failed: ${chatResponse.statusText}. Details: ${errorText}`);
    }

    const chatData = await chatResponse.json();
    const resultText = chatData.choices[0].message.content.trim();
    const analysis = JSON.parse(resultText);

    // Validate structure
    const skills = Array.isArray(analysis.skills) ? analysis.skills : [];
    const skill_gaps = Array.isArray(analysis.skill_gaps) ? analysis.skill_gaps : [];
    const bio = typeof analysis.bio === "string" ? analysis.bio : "";

    // 2. Generate Embedding vector using openai/text-embedding-3-small via OpenRouter
    const embedResponse = await fetch("https://openrouter.ai/api/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openrouterApiKey}`
      },
      body: JSON.stringify({
        model: "openai/text-embedding-3-small",
        input: `Profile Bio: ${bio}. Skills: ${skills.join(", ")}.`
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

    // 3. Update database using the admin service client (RLS bypass)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const { error: dbError } = await supabaseAdmin
      .from("profiles")
      .update({
        skills,
        skill_gaps,
        bio,
        skills_embedding: embedding,
        updated_at: new Date().toISOString()
      })
      .eq("id", user.id);

    if (dbError) {
      throw new Error(`Database update failed: ${dbError.message}`);
    }

    return new Response(JSON.stringify({ success: true, skills, skill_gaps, bio }), {
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
