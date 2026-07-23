import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";
import { z } from "https://deno.land/x/zod@v3.21.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RequestSchema = z.object({
  credential_id: z.string(),
});

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  const encoder = new TextEncoder();
  const bufA = encoder.encode(a);
  const bufB = encoder.encode(b);
  let result = 0;
  for (let i = 0; i < bufA.length; i++) {
    result |= bufA[i] ^ bufB[i];
  }
  return result === 0;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const signingKey = Deno.env.get("CERTIFICATE_SIGNING_KEY");

    if (!supabaseUrl || !supabaseServiceKey || !signingKey) {
      throw new Error("Missing environment variables.");
    }

    const body = await req.json().catch(() => ({}));
    const validation = RequestSchema.safeParse(body);
    if (!validation.success) {
      return new Response(JSON.stringify({ error: validation.error.errors[0].message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { credential_id } = validation.data;

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const { data: certData, error: rpcError } = await supabaseAdmin.rpc("verify_certificate", {
      p_credential_id: credential_id
    });

    if (rpcError) {
      throw new Error(`Database error: ${rpcError.message}`);
    }

    if (!certData || certData.length === 0) {
      return new Response(JSON.stringify({ verified: false, error: "Certificate not found" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const cert = certData[0];

    if (!cert.digital_signature) {
      return new Response(JSON.stringify({ 
        verified: false, 
        error: "No digital signature on record", 
        certificate: cert,
        signature_status: "unsigned" 
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = `EDGETALENT_CERT::v1::${cert.credential_id}::${cert.recipient_name}::${cert.title}::${cert.issuing_organization}::${cert.issue_date}`;

    const encoder = new TextEncoder();
    const keyData = encoder.encode(signingKey);
    const key = await crypto.subtle.importKey(
      "raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
    );
    const signatureBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
    const expectedSignatureHex = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, "0")).join("");

    const isValid = timingSafeEqual(cert.digital_signature, expectedSignatureHex);

    return new Response(JSON.stringify({ 
      verified: isValid, 
      certificate: cert, 
      signature_status: isValid ? "valid" : "invalid" 
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
