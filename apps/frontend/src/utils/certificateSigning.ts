import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Signs a certificate using the server-side HMAC-SHA256 signing Edge Function.
 * Requires authenticated user (JWT is forwarded to the edge function).
 * The server stores the HMAC signature in the database alongside the certificate record.
 */
export async function signCertificate(
  supabase: SupabaseClient,
  params: {
    credential_id: string;
    recipient_name: string;
    course_title: string;
    issuing_organization: string;
    issue_date: string;
    cert_table: "course_enrollments" | "talent_certificates";
  }
): Promise<{ signature: string; credential_id: string } | null> {
  try {
    const { data, error } = await supabase.functions.invoke("sign-certificate", {
      body: params,
    });

    if (error) {
      console.error("Failed to sign certificate:", error);
      return null;
    }

    return data as { signature: string; credential_id: string };
  } catch (err) {
    console.error("Certificate signing error:", err);
    return null;
  }
}

/**
 * Verifies a certificate's HMAC-SHA256 digital signature via the server-side
 * verification Edge Function. This is a public endpoint — no auth required.
 */
export async function verifyCertificateSignature(
  supabase: SupabaseClient,
  credentialId: string
): Promise<{
  verified: boolean;
  signature_status: "valid" | "invalid" | "unsigned";
  certificate?: Record<string, unknown>;
  error?: string;
}> {
  try {
    const { data, error } = await supabase.functions.invoke("verify-certificate-signature", {
      body: { credential_id: credentialId },
    });

    if (error) {
      console.error("Signature verification error:", error);
      return { verified: false, signature_status: "unsigned", error: error.message };
    }

    return data as {
      verified: boolean;
      signature_status: "valid" | "invalid" | "unsigned";
      certificate?: Record<string, unknown>;
      error?: string;
    };
  } catch (err) {
    console.error("Certificate signature verification error:", err);
    return { verified: false, signature_status: "unsigned", error: "Verification service unavailable" };
  }
}
