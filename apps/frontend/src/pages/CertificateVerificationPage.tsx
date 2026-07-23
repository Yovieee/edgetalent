import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSupabase } from "../context/SupabaseContext";
import { 
  ShieldCheck, Search, Award, Check, Copy, Download, ArrowLeft, ExternalLink, AlertTriangle
} from "lucide-react";
import logo from "../assets/logo.png";
import signatureImg from "../assets/signature.png";
import { downloadCertificateAsPdf } from "../utils/pdf";

interface CertificateResult {
  cert_type: "platform" | "external";
  id: string;
  credential_id: string;
  title: string;
  recipient_name: string;
  issuing_organization: string;
  issue_date: string;
  expiration_date: string | null;
  skills: string[];
  credential_url: string | null;
}

export default function CertificateVerificationPage(): React.ReactElement {
  const { credentialId: urlCredId } = useParams<{ credentialId?: string }>();
  const navigate = useNavigate();
  const { supabase } = useSupabase();

  const [inputCredId, setInputCredId] = useState<string>(urlCredId?.toUpperCase() || "");
  const [searching, setSearching] = useState<boolean>(false);
  const [certificate, setCertificate] = useState<CertificateResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [downloadingPdf, setDownloadingPdf] = useState<boolean>(false);
  const certRef = useRef<HTMLDivElement>(null);

  const verifyCertificateId = useCallback(async (searchId: string) => {
    const cleanId = searchId.trim().toUpperCase();
    if (!cleanId) return;

    setSearching(true);
    setCertificate(null);
    setErrorMsg(null);

    try {
      // 1. First try the verify_certificate RPC function
      const { data: rpcData, error: rpcError } = await supabase.rpc("verify_certificate", {
        p_credential_id: cleanId
      });

      if (!rpcError && rpcData && rpcData.length > 0) {
        setCertificate(rpcData[0]);
        setSearching(false);
        return;
      }

      // 2. Fallback direct table query if RPC is not deployed yet in DB
      // Search course_enrollments
      const { data: enrollments } = await supabase
        .from("course_enrollments")
        .select("*, courses(*), profiles(full_name)")
        .eq("credential_id", cleanId)
        .not("completed_at", "is", null)
        .limit(1);

      if (enrollments && enrollments.length > 0) {
        const match = enrollments[0];
        setCertificate({
          cert_type: "platform",
          id: match.id,
          credential_id: match.credential_id || match.id.slice(0, 8).toUpperCase(),
          title: match.courses?.title || "Academy Course",
          recipient_name: match.profiles?.full_name || "Talent Member",
          issuing_organization: match.courses?.provider || "EdgeTalent Academy",
          issue_date: match.completed_at,
          expiration_date: null,
          skills: match.courses?.skills_taught || [],
          credential_url: null
        });
        setSearching(false);
        return;
      }

      // Search talent_certificates
      const { data: extCerts } = await supabase
        .from("talent_certificates")
        .select("*, profiles(full_name)")
        .eq("credential_id", cleanId)
        .limit(1);

      if (extCerts && extCerts.length > 0) {
        const match = extCerts[0];
        setCertificate({
          cert_type: "external",
          id: match.id,
          credential_id: match.credential_id || match.id.slice(0, 8).toUpperCase(),
          title: match.name,
          recipient_name: match.profiles?.full_name || "Talent Member",
          issuing_organization: match.issuing_organization,
          issue_date: match.issue_date,
          expiration_date: match.expiration_date,
          skills: [],
          credential_url: match.credential_url
        });
        setSearching(false);
        return;
      }

      // If no match found
      setErrorMsg(`No certificate found matching Credential ID "${cleanId}". Please check the 8-character Credential ID and try again.`);
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Error connecting to verification service. Please try again.");
    } finally {
      setSearching(false);
    }
  }, [supabase]);

  useEffect(() => {
    if (urlCredId) {
      const cleanUrlId = urlCredId.toUpperCase();
      setInputCredId(cleanUrlId);
      verifyCertificateId(cleanUrlId);
    }
  }, [urlCredId, verifyCertificateId]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCredId.trim()) return;
    const targetId = inputCredId.trim().toUpperCase();
    if (urlCredId === targetId) {
      verifyCertificateId(targetId);
    } else {
      navigate(`/verify/${targetId}`, { replace: true });
    }
  };

  const activeCredId = certificate?.credential_id || urlCredId || inputCredId.trim().toUpperCase();
  const currentVerificationUrl = `${window.location.origin}/verify/${activeCredId}`;
  const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(currentVerificationUrl)}`;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)", color: "var(--text-primary)", display: "flex", flexDirection: "column" }}>
      {/* Top Navbar */}
      <nav className="navbar no-print" style={{ background: "var(--bg-secondary)", borderBottom: "1px solid var(--glass-border)", padding: "1rem 2rem" }}>
        <div className="navbar-brand" onClick={() => navigate("/")} style={{ cursor: "pointer", display: "flex", alignItems: "center" }}>
          <img src={logo} alt="EdgeTalent Logo" style={{ width: "30px", height: "30px", marginRight: "0.5rem", objectFit: "contain" }} />
          EdgeTalent
        </div>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <button className="btn btn-secondary" onClick={() => navigate("/")} style={{ fontSize: "0.85rem", padding: "0.4rem 0.9rem" }}>
            <ArrowLeft size={16} style={{ marginRight: "0.3rem" }} /> Back to Home
          </button>
        </div>
      </nav>

      {/* Main Verification Body */}
      <main style={{ flex: 1, maxWidth: "1000px", width: "100%", margin: "0 auto", padding: "2.5rem 1.5rem" }}>
        {/* Header Title */}
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }} className="no-print">
          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", background: "rgba(16, 185, 129, 0.1)", color: "var(--color-emerald)", border: "1px solid rgba(16, 185, 129, 0.2)", padding: "0.4rem 1rem", borderRadius: "9999px", marginBottom: "1rem", fontSize: "0.85rem", fontWeight: 600 }}>
            <ShieldCheck size={18} /> Official Credential Verification System
          </div>
          <h1 style={{ fontSize: "2.25rem", fontWeight: 800, marginBottom: "0.5rem" }}>
            Verify Certificate Authenticity
          </h1>
          <p style={{ color: "var(--text-secondary)", maxWidth: "580px", margin: "0 auto", fontSize: "0.95rem" }}>
            Enter an 8-character Credential ID to instantly verify completion, issuer identity, and verified skills on the EdgeTalent platform.
          </p>
        </div>

        {/* Search Bar */}
        <div className="glass-panel no-print" style={{ padding: "1.75rem", marginBottom: "2.5rem", maxWidth: "680px", margin: "0 auto 2.5rem auto" }}>
          <form onSubmit={handleSearchSubmit} style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: "240px", position: "relative" }}>
              <input
                type="text"
                placeholder="Enter 8-character Credential ID (e.g. 8X92K4M1)"
                value={inputCredId}
                onChange={(e) => setInputCredId(e.target.value.toUpperCase())}
                maxLength={8}
                style={{
                  width: "100%",
                  padding: "0.8rem 1rem 0.8rem 2.5rem",
                  fontSize: "1rem",
                  fontFamily: "monospace",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--glass-border)",
                  background: "var(--bg-secondary)",
                  color: "var(--text-primary)"
                }}
                required
              />
              <Search size={18} style={{ position: "absolute", left: "0.85rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={searching}
              style={{ padding: "0.8rem 1.5rem", fontSize: "0.95rem" }}
            >
              {searching ? "Verifying..." : "Verify ID"}
            </button>
          </form>
        </div>

        {/* Loading Spinner */}
        {searching && (
          <div className="glass-panel" style={{ padding: "3rem", textAlign: "center" }}>
            <div style={{
              width: "48px",
              height: "48px",
              border: "4px solid var(--glass-border)",
              borderTopColor: "var(--color-cyan)",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              margin: "0 auto 1rem auto"
            }} />
            <p style={{ color: "var(--text-secondary)" }}>Searching credential registry...</p>
          </div>
        )}

        {/* Error State */}
        {!searching && errorMsg && (
          <div className="glass-panel animate-fade-in" style={{ padding: "2.5rem", textAlign: "center", borderColor: "var(--color-rose)" }}>
            <AlertTriangle size={48} style={{ color: "var(--color-rose)", margin: "0 auto 1rem auto" }} />
            <h3 style={{ fontSize: "1.35rem", marginBottom: "0.5rem" }}>Verification Failed</h3>
            <p style={{ color: "var(--text-secondary)", maxWidth: "500px", margin: "0 auto 1.5rem auto", fontSize: "0.95rem" }}>
              {errorMsg}
            </p>
            <button 
              className="btn btn-secondary" 
              onClick={() => {
                setInputCredId("");
                setCertificate(null);
                setErrorMsg(null);
                navigate("/verify", { replace: true });
              }}
            >
              Try Another Credential ID
            </button>
          </div>
        )}

        {/* Verified Certificate Result */}
        {!searching && certificate && (
          <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            {/* Status Banner */}
            <div className="glass-panel no-print" style={{ padding: "1.5rem 2rem", background: "rgba(16, 185, 129, 0.08)", border: "1px solid rgba(16, 185, 129, 0.3)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "#10b981", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <ShieldCheck size={28} />
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ fontSize: "1.15rem", fontWeight: 700, color: "#10b981" }}>OFFICIAL VERIFIED CREDENTIAL</span>
                    <span className="badge badge-emerald" style={{ fontSize: "0.7rem" }}>ACTIVE</span>
                  </div>
                  <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", margin: "0.2rem 0 0 0" }}>
                    Verified on EdgeTalent Registry • Credential ID: <span style={{ fontFamily: "monospace", fontWeight: 700 }}>{certificate.credential_id}</span>
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                <button
                  className="btn btn-secondary"
                  style={{ fontSize: "0.85rem", padding: "0.5rem 0.85rem" }}
                  onClick={() => {
                    navigator.clipboard.writeText(currentVerificationUrl);
                    setCopiedLink(true);
                    setTimeout(() => setCopiedLink(false), 2000);
                  }}
                >
                  {copiedLink ? <Check size={16} style={{ color: "#10b981" }} /> : <Copy size={16} />}
                  {copiedLink ? "Link Copied!" : "Copy Verification URL"}
                </button>

                <button
                  className="btn btn-primary"
                  style={{ fontSize: "0.85rem", padding: "0.5rem 1rem", gap: "0.4rem" }}
                  disabled={downloadingPdf}
                  onClick={async () => {
                    if (!certRef.current || !certificate) return;
                    setDownloadingPdf(true);
                    try {
                      const fileName = `${certificate.recipient_name}_${certificate.title}_Certificate.pdf`.replace(/[^a-zA-Z0-9._-]/g, "_");
                      await downloadCertificateAsPdf(certRef.current, fileName);
                    } finally {
                      setDownloadingPdf(false);
                    }
                  }}
                >
                  <Download size={16} /> {downloadingPdf ? "Saving PDF..." : "Save PDF"}
                </button>
              </div>
            </div>

            {/* Print Certificate Layout */}
            <div
              ref={certRef}
              className="print-certificate-container"
              style={{
                width: "100%",
                aspectRatio: "1.414",
                background: "#ffffff",
                color: "#0f172a",
                position: "relative",
                borderRadius: "12px",
                padding: "2.5rem 3rem",
                boxShadow: "0 20px 50px -10px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.06)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                alignItems: "center",
                overflow: "hidden"
              }}
            >
              {/* Outer Frame */}
              <div style={{ position: "absolute", inset: "12px", border: "2px solid #d97706", borderRadius: "8px", pointerEvents: "none", zIndex: 2 }} />
              <div style={{ position: "absolute", inset: "18px", border: "1px dashed #2563eb", borderRadius: "6px", pointerEvents: "none", zIndex: 2 }} />

              {/* Ornamental Corners */}
              <svg style={{ position: "absolute", top: "16px", left: "16px", zIndex: 3 }} width="36" height="36" viewBox="0 0 36 36" fill="none">
                <path d="M2 34V10C2 5.58172 5.58172 2 10 2H34" stroke="#d97706" strokeWidth="2.5" strokeLinecap="round" />
                <circle cx="10" cy="10" r="3" fill="#2563eb" />
              </svg>
              <svg style={{ position: "absolute", top: "16px", right: "16px", zIndex: 3 }} width="36" height="36" viewBox="0 0 36 36" fill="none">
                <path d="M34 34V10C34 5.58172 30.4183 2 26 2H2" stroke="#d97706" strokeWidth="2.5" strokeLinecap="round" />
                <circle cx="26" cy="10" r="3" fill="#2563eb" />
              </svg>
              <svg style={{ position: "absolute", bottom: "16px", left: "16px", zIndex: 3 }} width="36" height="36" viewBox="0 0 36 36" fill="none">
                <path d="M2 2V26C2 30.4183 5.58172 34 10 34H34" stroke="#d97706" strokeWidth="2.5" strokeLinecap="round" />
                <circle cx="10" cy="26" r="3" fill="#2563eb" />
              </svg>
              <svg style={{ position: "absolute", bottom: "16px", right: "16px", zIndex: 3 }} width="36" height="36" viewBox="0 0 36 36" fill="none">
                <path d="M34 2V26C34 30.4183 30.4183 34 26 34H2" stroke="#d97706" strokeWidth="2.5" strokeLinecap="round" />
                <circle cx="26" cy="26" r="3" fill="#2563eb" />
              </svg>

              {/* Watermark Pattern */}
              <svg
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  opacity: 0.05,
                  pointerEvents: "none",
                  zIndex: 1,
                  width: "480px",
                  height: "480px"
                }}
                viewBox="0 0 200 200"
                fill="none"
              >
                <circle cx="100" cy="100" r="90" stroke="#b45309" strokeWidth="1" strokeDasharray="2 2" />
                <circle cx="100" cy="100" r="75" stroke="#0284c7" strokeWidth="1" />
                <polygon points="100,10 125,50 170,30 150,75 190,100 150,125 170,170 125,150 100,190 75,150 30,170 50,125 10,100 50,75 30,30 75,50" stroke="#0284c7" strokeWidth="1" fill="none" />
              </svg>

              {/* Top Header */}
              <div style={{ zIndex: 4, textAlign: "center", width: "100%" }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", background: "#eff6ff", border: "1px solid #bfdbfe", padding: "0.3rem 1.2rem", borderRadius: "9999px", marginBottom: "0.6rem" }}>
                  <Award size={16} style={{ color: "#1d4ed8" }} />
                  <span style={{ fontSize: "0.75rem", letterSpacing: "0.22em", color: "#1e40af", fontWeight: 700, textTransform: "uppercase" }}>
                    {certificate.issuing_organization || "EdgeTalent Global Academy"}
                  </span>
                </div>
                <div style={{ height: "1px", width: "130px", background: "linear-gradient(90deg, transparent, #d97706, transparent)", margin: "0 auto 0.6rem auto" }} />
                <h1 style={{ fontSize: "2rem", fontWeight: 800, color: "#0f172a", letterSpacing: "0.08em", textTransform: "uppercase", margin: 0 }}>
                  Certificate of Completion
                </h1>
              </div>

              {/* Main Body */}
              <div style={{ zIndex: 4, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem", width: "100%", maxWidth: "620px" }}>
                <p style={{ color: "#64748b", fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.18em", margin: 0, fontWeight: 600 }}>
                  THIS OFFICIAL CREDENTIAL IS PROUDLY PRESENTED TO
                </p>

                <div style={{ width: "100%", margin: "0.2rem 0" }}>
                  <h2 style={{ fontSize: "2.3rem", fontWeight: 700, color: "#1d4ed8", fontFamily: "Georgia, 'Times New Roman', serif", margin: "0 0 0.2rem 0", letterSpacing: "0.02em" }}>
                    {certificate.recipient_name}
                  </h2>
                  <div style={{ height: "2px", width: "65%", background: "linear-gradient(90deg, transparent, #d97706, transparent)", margin: "0 auto" }} />
                </div>

                <p style={{ color: "#334155", fontSize: "0.88rem", lineHeight: 1.45, margin: "0.2rem 0 0 0" }}>
                  for successfully completing all prescribed requirements, practical evaluations, and mastery standards for:
                </p>

                <h3 style={{ fontSize: "1.35rem", color: "#0f172a", fontWeight: 700, margin: "0.2rem 0", letterSpacing: "-0.01em" }}>
                  {certificate.title}
                </h3>

                {certificate.skills && certificate.skills.length > 0 && (
                  <div style={{ marginTop: "0.2rem" }}>
                    <p style={{ color: "#64748b", fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.25rem" }}>
                      Verified Technical Mastery
                    </p>
                    <div style={{ display: "flex", justifyContent: "center", gap: "0.4rem", flexWrap: "wrap" }}>
                      {certificate.skills.map((skill: string, idx: number) => (
                        <span key={idx} style={{ background: "#f0f9ff", border: "1px solid #bae6fd", color: "#0369a1", padding: "0.15rem 0.55rem", borderRadius: "4px", fontSize: "0.7rem", fontWeight: 600 }}>
                          ✓ {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Section */}
              <div style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: "0.75rem", zIndex: 4, padding: "0 0.5rem" }}>
                {/* Real Scannable QR Code */}
                <div style={{ textAlign: "left", display: "flex", gap: "0.85rem", alignItems: "center" }}>
                  <div style={{ padding: "0.25rem", background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}>
                    <img 
                      src={qrCodeImageUrl} 
                      alt="Scannable Certificate Verification QR Code" 
                      style={{ width: "54px", height: "54px", display: "block" }} 
                    />
                  </div>
                  <div>
                    <div style={{ fontSize: "0.68rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em" }}>Issue Date</div>
                    <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#0f172a", marginTop: "0.1rem" }}>
                      {new Date(certificate.issue_date || Date.now()).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                    {certificate.expiration_date && (
                      <div style={{ fontSize: "0.68rem", color: "#dc2626", marginTop: "0.1rem" }}>
                        Expires: {new Date(certificate.expiration_date).toLocaleDateString(undefined, { year: 'numeric', month: 'short' })}
                      </div>
                    )}
                    <div style={{ fontSize: "0.65rem", color: "#059669", marginTop: "0.15rem", display: "flex", alignItems: "center", gap: "0.2rem", fontWeight: 600 }}>
                      <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#059669", display: "inline-block" }} /> Scan to Verify Online
                    </div>
                  </div>
                </div>

                {/* Center Seal */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div style={{ position: "relative", width: "64px", height: "64px" }}>
                    <svg width="64" height="64" viewBox="0 0 100 100" fill="none">
                      <path d="M50 0L58.5 7.5L70 4L74.5 15.5L86 17.5L86.5 29.5L96.5 35.5L92.5 47L100 56.5L92.5 66L96.5 77.5L86.5 83.5L86 95.5L74.5 97.5L70 109L58.5 105.5L50 113L41.5 105.5L30 109L25.5 97.5L14 95.5L13.5 83.5L3.5 77.5L7.5 66L0 56.5L7.5 47L3.5 35.5L13.5 29.5L14 17.5L25.5 15.5L30 4L41.5 7.5L50 0Z" fill="url(#sealGradLight)" transform="scale(0.82) translate(9, 9)" />
                      <defs>
                        <linearGradient id="sealGradLight" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#fbbf24" />
                          <stop offset="50%" stopColor="#d97706" />
                          <stop offset="100%" stopColor="#2563eb" />
                        </linearGradient>
                      </defs>
                      <circle cx="50" cy="50" r="34" fill="#ffffff" stroke="#d97706" strokeWidth="2" />
                      <circle cx="50" cy="50" r="28" stroke="#2563eb" strokeWidth="1" strokeDasharray="3 2" />
                      <path d="M50 28L54.5 37.5H65L56.5 43.5L60 54L50 47.5L40 54L43.5 43.5L35 37.5H45.5L50 28Z" fill="#d97706" />
                    </svg>
                  </div>
                  <span style={{ fontSize: "0.58rem", color: "#b45309", textTransform: "uppercase", letterSpacing: "0.15em", fontWeight: 800, marginTop: "0.15rem" }}>
                    OFFICIAL SEAL
                  </span>
                </div>

                {/* Right Signatures */}
                <div style={{ textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                  <img 
                    src={signatureImg} 
                    alt="Blasius Yonas Vikariandi Signature" 
                    style={{ height: "48px", width: "auto", objectFit: "contain" }} 
                  />
                  <div style={{ height: "1px", width: "130px", background: "#cbd5e1", margin: "0.2rem 0 0.2rem 0" }} />
                  <div style={{ fontSize: "0.7rem", color: "#0f172a", fontWeight: 700 }}>Blasius Yonas Vikariandi</div>
                  <div style={{ fontSize: "0.62rem", color: "#64748b", textTransform: "uppercase" }}>EdgeTalent CEO</div>
                </div>
              </div>

              {/* Cryptographic Credential Bar Footer */}
              <div style={{ position: "absolute", bottom: "6px", left: 0, right: 0, display: "flex", justifyContent: "center", alignItems: "center", gap: "0.4rem", fontSize: "0.62rem", color: "#64748b", zIndex: 4 }}>
                <span>CREDENTIAL ID:</span>
                <span style={{ fontFamily: "monospace", color: "#475569", background: "#f1f5f9", padding: "0.08rem 0.35rem", borderRadius: "3px", border: "1px solid #e2e8f0", fontWeight: 700 }}>
                  {certificate.credential_id}
                </span>
                <span style={{ margin: "0 0.2rem" }}>•</span>
                <span>VERIFICATION LINK:</span>
                <span style={{ fontFamily: "monospace", color: "#0284c7" }}>
                  {currentVerificationUrl}
                </span>
              </div>
            </div>

            {certificate.credential_url && (
              <div className="glass-panel no-print" style={{ padding: "1.25rem 1.75rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: "1rem" }}>External Issuer Link</h4>
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", margin: "0.2rem 0 0 0" }}>
                    This credential was originally issued by {certificate.issuing_organization}.
                  </p>
                </div>
                <a
                  href={certificate.credential_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary"
                  style={{ textDecoration: "none", fontSize: "0.85rem" }}
                >
                  View External Provider <ExternalLink size={14} style={{ marginLeft: "0.25rem" }} />
                </a>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
