import React, { useState, useEffect, useCallback, useRef } from "react";
import { useSupabase } from "../../context/SupabaseContext";
import { Plus, X, Download, Check, Copy, ShieldCheck, Award, Share2 } from "lucide-react";
import { generateNanoId } from "../../utils/nanoid";
import { downloadCertificateAsPdf } from "../../utils/pdf";
import signatureImg from "../../assets/signature.png";
import Modal from "../../components/Modal";

export default function TalentCertificates(): React.ReactElement {
  const { supabase, profile } = useSupabase();

  const [externalCertificates, setExternalCertificates] = useState<any[]>([]);
  const [loadingExternalCertificates, setLoadingExternalCertificates] = useState<boolean>(true);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  
  // Modals & form state
  const [selectedEnrollmentCert, setSelectedEnrollmentCert] = useState<any | null>(null);
  const [showAddCertModal, setShowAddCertModal] = useState<boolean>(false);
  const [showEditCertModal, setShowEditCertModal] = useState<boolean>(false);
  const [selectedExternalCert, setSelectedExternalCert] = useState<any | null>(null);
  const [copiedCertId, setCopiedCertId] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [downloadingPdf, setDownloadingPdf] = useState<boolean>(false);
  const certRef = useRef<HTMLDivElement>(null);

  const [certName, setCertName] = useState<string>("");
  const [certIssuer, setCertIssuer] = useState<string>("");
  const [certIssueDate, setCertIssueDate] = useState<string>("");
  const [certExpiryDate, setCertExpiryDate] = useState<string>("");
  const [certCredId, setCertCredId] = useState<string>("");
  const [certCredUrl, setCertCredUrl] = useState<string>("");
  const [savingCert, setSavingCert] = useState<boolean>(false);

  const profileId = profile?.id;

  const loadEnrollments = useCallback(async () => {
    if (!profileId) return;
    try {
      const { data, error } = await supabase
        .from("course_enrollments")
        .select("*, courses(*)")
        .eq("user_id", profileId);
      if (!error && data) {
        setEnrollments(data);
      }
    } catch (e) {
      console.error(e);
    }
  }, [profileId, supabase]);

  const loadExternalCertificates = useCallback(async () => {
    if (!profileId) return;
    setLoadingExternalCertificates(true);
    try {
      const { data, error } = await supabase
        .from("talent_certificates")
        .select("*")
        .eq("user_id", profileId)
        .order("issue_date", { ascending: false });
      if (!error && data) {
        // Auto-assign 8-character NanoID for external certs if missing
        const updated = await Promise.all(data.map(async (c: any) => {
          if (!c.credential_id) {
            const newCredId = generateNanoId(8);
            await supabase
              .from("talent_certificates")
              .update({ credential_id: newCredId })
              .eq("id", c.id);
            return { ...c, credential_id: newCredId };
          }
          return c;
        }));
        setExternalCertificates(updated);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingExternalCertificates(false);
    }
  }, [profileId, supabase]);

  useEffect(() => {
    loadEnrollments();
    loadExternalCertificates();
  }, [loadEnrollments, loadExternalCertificates]);

  const resetCertForm = () => {
    setCertName("");
    setCertIssuer("");
    setCertIssueDate("");
    setCertExpiryDate("");
    setCertCredId("");
    setCertCredUrl("");
    setSelectedExternalCert(null);
  };

  const openEditModal = (cert: any) => {
    setSelectedExternalCert(cert);
    setCertName(cert.name || "");
    setCertIssuer(cert.issuing_organization || "");
    setCertIssueDate(cert.issue_date || "");
    setCertExpiryDate(cert.expiration_date || "");
    setCertCredId(cert.credential_id || "");
    setCertCredUrl(cert.credential_url || "");
    setShowEditCertModal(true);
  };

  const handleAddExternalCert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileId) return;
    if (!certName.trim() || !certIssuer.trim() || !certIssueDate) {
      alert("Please fill in Name, Organization, and Issue Date.");
      return;
    }
    setSavingCert(true);
    try {
      const finalCredId = certCredId.trim() ? certCredId.trim().toUpperCase() : generateNanoId(8);
      const { error } = await supabase
        .from("talent_certificates")
        .insert({
          user_id: profileId,
          name: certName,
          issuing_organization: certIssuer,
          issue_date: certIssueDate,
          expiration_date: certExpiryDate || null,
          credential_id: finalCredId,
          credential_url: certCredUrl || null
        });
      if (error) {
        alert("Failed to add certificate: " + error.message);
      } else {
        setShowAddCertModal(false);
        resetCertForm();
        loadExternalCertificates();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingCert(false);
    }
  };

  const handleEditExternalCert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileId || !selectedExternalCert) return;
    if (!certName.trim() || !certIssuer.trim() || !certIssueDate) {
      alert("Please fill in Name, Organization, and Issue Date.");
      return;
    }
    setSavingCert(true);
    try {
      const { error } = await supabase
        .from("talent_certificates")
        .update({
          name: certName,
          issuing_organization: certIssuer,
          issue_date: certIssueDate,
          expiration_date: certExpiryDate || null,
          credential_id: certCredId || null,
          credential_url: certCredUrl || null
        })
        .eq("id", selectedExternalCert.id);
      if (error) {
        alert("Failed to update certificate: " + error.message);
      } else {
        setShowEditCertModal(false);
        resetCertForm();
        loadExternalCertificates();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingCert(false);
    }
  };

  const handleDeleteExternalCert = async (id: string) => {
    if (!confirm("Are you sure you want to delete this certificate?")) return;
    try {
      const { error } = await supabase
        .from("talent_certificates")
        .delete()
        .eq("id", id);
      if (error) {
        alert("Failed to delete certificate: " + error.message);
      } else {
        loadExternalCertificates();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      {/* Header */}
      <div className="glass-panel" style={{ padding: "2rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1.5rem" }}>
        <div>
          <h3 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>My Credentials & Certificates</h3>
          <p style={{ color: "var(--text-secondary)" }}>
            Verify your expertise with official platform credentials and external industry certifications.
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            resetCertForm();
            setShowAddCertModal(true);
          }}
        >
          <Plus size={18} style={{ marginRight: "0.25rem" }} />
          Add Certification
        </button>
      </div>

      {/* Stats Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.5rem" }}>
        {(() => {
          const completedCount = enrollments.filter(e => e.completed_at).length;
          const externalCount = externalCertificates.length;
          
          const platformSkillsSet = new Set<string>();
          enrollments.forEach(e => {
            if (e.completed_at && e.courses?.skills_taught) {
              e.courses.skills_taught.forEach((s: string) => platformSkillsSet.add(s));
            }
          });
          const verifiedSkillsCount = platformSkillsSet.size;

          return (
            <>
              <div className="glass-panel" style={{ padding: "1.5rem", display: "flex", alignItems: "center", gap: "1rem" }}>
                <div style={{ background: "rgba(124, 58, 237, 0.1)", color: "var(--color-purple)", width: "48px", height: "48px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem" }}>
                  🎓
                </div>
                <div>
                  <div style={{ fontSize: "1.5rem", fontWeight: "bold" }}>{completedCount}</div>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Platform Certificates</div>
                </div>
              </div>

              <div className="glass-panel" style={{ padding: "1.5rem", display: "flex", alignItems: "center", gap: "1rem" }}>
                <div style={{ background: "rgba(8, 145, 178, 0.1)", color: "var(--color-cyan)", width: "48px", height: "48px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem" }}>
                  🏆
                </div>
                <div>
                  <div style={{ fontSize: "1.5rem", fontWeight: "bold" }}>{externalCount}</div>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>External Certifications</div>
                </div>
              </div>

              <div className="glass-panel" style={{ padding: "1.5rem", display: "flex", alignItems: "center", gap: "1rem" }}>
                <div style={{ background: "rgba(5, 150, 105, 0.1)", color: "var(--color-emerald)", width: "48px", height: "48px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem" }}>
                  ✓
                </div>
                <div>
                  <div style={{ fontSize: "1.5rem", fontWeight: "bold" }}>{verifiedSkillsCount}</div>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Verified Platform Skills</div>
                </div>
              </div>
            </>
          );
        })()}
      </div>

      {/* Platform Certificates Section */}
      <div>
        <h4 style={{ fontSize: "1.2rem", marginBottom: "1rem", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span>🎓</span> Platform Certificates of Completion
        </h4>
        {(() => {
          const completedEnrollments = enrollments.filter(e => e.completed_at);
          if (completedEnrollments.length === 0) {
            return (
              <div className="glass-panel" style={{ padding: "3rem", textAlign: "center" }}>
                <p style={{ color: "var(--text-secondary)" }}>
                  You haven't completed any academy courses yet. Keep learning to earn certificates!
                </p>
              </div>
            );
          }

          return (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem" }}>
              {completedEnrollments.map((enrollment) => {
                const course = enrollment.courses || {};
                const credId = enrollment.credential_id || enrollment.id.slice(0, 8).toUpperCase();
                return (
                  <div key={enrollment.id} className="glass-panel" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: "220px" }}>
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                        <span className="badge badge-emerald" style={{ fontSize: "0.7rem" }}>{course.provider || "EdgeTalent Academy"}</span>
                        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                          {new Date(enrollment.completed_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      <h5 style={{ fontSize: "1.1rem", marginBottom: "0.5rem", color: "var(--text-primary)" }}>{course.title || "Academy Course"}</h5>
                      <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "1rem" }}>
                        Credential ID: <span style={{ fontFamily: "monospace", fontSize: "0.85rem", fontWeight: 700, color: "var(--color-cyan)" }}>{credId}</span>
                      </p>
                      
                      {course.skills_taught && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem", marginBottom: "1rem" }}>
                          {course.skills_taught.map((skill: string, idx: number) => (
                            <span key={idx} className="badge badge-cyan" style={{ fontSize: "0.65rem" }}>{skill}</span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button
                        className="btn btn-primary"
                        style={{ flex: 1, fontSize: "0.85rem", padding: "0.5rem" }}
                        onClick={() => setSelectedEnrollmentCert(enrollment)}
                      >
                        📜 View Certificate
                      </button>
                      <a
                        href={`/verify/${credId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-secondary"
                        style={{ fontSize: "0.85rem", padding: "0.5rem", display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}
                        title="Public Verification Page"
                      >
                        <Share2 size={16} />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>

      {/* External Certificates Section */}
      <div>
        <h4 style={{ fontSize: "1.2rem", marginBottom: "1rem", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span>🏆</span> External Certifications
        </h4>
        {loadingExternalCertificates ? (
          <p style={{ color: "var(--text-secondary)" }}>Loading external certifications...</p>
        ) : externalCertificates.length === 0 ? (
          <div className="glass-panel" style={{ padding: "3rem", textAlign: "center" }}>
            <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
              No external certifications added yet. Show off your industry credentials!
            </p>
            <button
              className="btn btn-secondary"
              onClick={() => {
                resetCertForm();
                setShowAddCertModal(true);
              }}
            >
              Add Industry Credential
            </button>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem" }}>
            {externalCertificates.map((cert) => (
              <div key={cert.id} className="glass-panel" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: "200px" }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                    <h5 style={{ fontSize: "1.1rem", color: "var(--text-primary)", margin: 0 }}>{cert.name}</h5>
                    <div style={{ display: "flex", gap: "0.25rem" }} className="no-print">
                      <button
                        onClick={() => openEditModal(cert)}
                        style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-secondary)", padding: "0.2rem" }}
                        title="Edit Certification"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDeleteExternalCert(cert.id)}
                        style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--color-rose)", padding: "0.2rem" }}
                        title="Delete Certification"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                  <p style={{ fontSize: "0.9rem", fontWeight: "600", color: "var(--color-cyan)", marginBottom: "0.5rem" }}>
                    {cert.issuing_organization}
                  </p>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>
                    Issued: <b>{new Date(cert.issue_date).toLocaleDateString(undefined, { year: 'numeric', month: 'short' })}</b>
                    {cert.expiration_date && (
                      <> | Expires: <b>{new Date(cert.expiration_date).toLocaleDateString(undefined, { year: 'numeric', month: 'short' })}</b></>
                    )}
                  </div>
                  {cert.credential_id && (
                    <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>
                      Credential ID: <span style={{ fontFamily: "monospace" }}>{cert.credential_id}</span>
                    </p>
                  )}
                </div>

                {cert.credential_url && (
                  <a
                    href={cert.credential_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary"
                    style={{ width: "100%", fontSize: "0.85rem", padding: "0.5rem", textDecoration: "none" }}
                  >
                    🔗 Verify Credential
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Platform Certificate PDF/Print Viewer Modal */}
      {selectedEnrollmentCert && (() => {
        const modalCredId = selectedEnrollmentCert.credential_id || selectedEnrollmentCert.id.slice(0, 8).toUpperCase();
        const verificationUrl = `${window.location.origin}/verify/${modalCredId}`;
        const qrCodeImg = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(verificationUrl)}`;

        return (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(15, 23, 42, 0.85)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1001,
            }}
            className="no-print-backdrop"
          >
            <div
              className="glass-panel animate-fade-in"
              style={{
                width: "95%",
                maxWidth: "880px",
                padding: "1.75rem 2rem",
                maxHeight: "95vh",
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                alignItems: "center"
              }}
            >
              {/* Modal Controls */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", marginBottom: "1.25rem" }} className="no-print">
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <ShieldCheck className="text-emerald" size={20} />
                  <span style={{ fontWeight: 600, fontSize: "0.95rem" }}>Official Digital Credential</span>
                </div>

                <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                  <button
                    className="btn btn-secondary"
                    style={{ fontSize: "0.85rem", padding: "0.5rem 0.85rem" }}
                    onClick={() => {
                      navigator.clipboard.writeText(modalCredId);
                      setCopiedCertId(true);
                      setTimeout(() => setCopiedCertId(false), 2000);
                    }}
                  >
                    {copiedCertId ? (
                      <>
                        <Check size={16} style={{ color: "#10b981" }} /> Copied ID!
                      </>
                    ) : (
                      <>
                        <Copy size={16} /> Copy Credential ID
                      </>
                    )}
                  </button>

                  <button
                    className="btn btn-secondary"
                    style={{ fontSize: "0.85rem", padding: "0.5rem 0.85rem" }}
                    onClick={() => {
                      navigator.clipboard.writeText(verificationUrl);
                      setCopiedLink(true);
                      setTimeout(() => setCopiedLink(false), 2000);
                    }}
                  >
                    {copiedLink ? (
                      <>
                        <Check size={16} style={{ color: "#10b981" }} /> Copied Link!
                      </>
                    ) : (
                      <>
                        <Share2 size={16} /> Share Link
                      </>
                    )}
                  </button>
                  
                  <button
                    className="btn btn-primary"
                    style={{ fontSize: "0.85rem", padding: "0.5rem 1rem", gap: "0.4rem" }}
                    disabled={downloadingPdf}
                    onClick={async () => {
                      if (!certRef.current || !selectedEnrollmentCert) return;
                      setDownloadingPdf(true);
                      try {
                        const recipientName = profile?.full_name || profile?.email || "Talent";
                        const courseTitle = selectedEnrollmentCert.courses?.title || "Course";
                        const fileName = `${recipientName}_${courseTitle}_Certificate.pdf`.replace(/[^a-zA-Z0-9._-]/g, "_");
                        await downloadCertificateAsPdf(certRef.current, fileName);
                      } finally {
                        setDownloadingPdf(false);
                      }
                    }}
                  >
                    <Download size={16} /> {downloadingPdf ? "Saving PDF..." : "Save PDF"}
                  </button>

                  <button
                    className="btn btn-secondary"
                    style={{ padding: "0.5rem 0.6rem", display: "flex", alignItems: "center", justifyContent: "center" }}
                    onClick={() => setSelectedEnrollmentCert(null)}
                    title="Close viewer"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Certificate Print Layout */}
              <div
                ref={certRef}
                className="print-certificate-container"
                style={{
                  width: "100%",
                  aspectRatio: "1.414", // Standard A4 Landscape ratio
                  background: "#ffffff",
                  color: "#0f172a",
                  position: "relative",
                  borderRadius: "12px",
                  padding: "1.75rem 2.25rem",
                  boxShadow: "0 20px 50px -10px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.06)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  alignItems: "center",
                  overflow: "hidden"
                }}
              >
                {/* Geometric Gold & Blue Frame Lines */}
                <div style={{
                  position: "absolute",
                  inset: "12px",
                  border: "2px solid #d97706",
                  borderRadius: "8px",
                  pointerEvents: "none",
                  zIndex: 2
                }} />
                <div style={{
                  position: "absolute",
                  inset: "18px",
                  border: "1px dashed #2563eb",
                  borderRadius: "6px",
                  pointerEvents: "none",
                  zIndex: 2
                }} />

                {/* Corner Ornamental SVG Filigrees */}
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

                {/* Background Guilloche Watermark Pattern */}
                <svg
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    opacity: 0.06,
                    pointerEvents: "none",
                    zIndex: 1,
                    width: "380px",
                    height: "380px"
                  }}
                  viewBox="0 0 200 200"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle cx="100" cy="100" r="90" stroke="#b45309" strokeWidth="1" strokeDasharray="2 2" />
                  <circle cx="100" cy="100" r="75" stroke="#0284c7" strokeWidth="1" />
                  <circle cx="100" cy="100" r="60" stroke="#b45309" strokeWidth="0.8" strokeDasharray="3 3" />
                  <polygon points="100,10 125,50 170,30 150,75 190,100 150,125 170,170 125,150 100,190 75,150 30,170 50,125 10,100 50,75 30,30 75,50" stroke="#0284c7" strokeWidth="1" fill="none" />
                  <polygon points="100,25 120,60 155,45 140,80 175,100 140,120 155,155 120,140 100,175 80,140 45,155 60,120 25,100 60,80 45,45 80,60" stroke="#d97706" strokeWidth="0.8" fill="none" />
                </svg>

                {/* Top Header Badge */}
                <div style={{ zIndex: 4, textAlign: "center", width: "100%" }}>
                  <div style={{ display: "inline-block", background: "#eff6ff", border: "1px solid #bfdbfe", padding: "0.25rem 1rem", borderRadius: "20px", marginBottom: "0.4rem", textAlign: "center" }}>
                    <Award size={14} style={{ color: "#1d4ed8", verticalAlign: "middle", marginRight: "0.35rem", display: "inline-block" }} />
                    <span style={{ fontSize: "0.7rem", letterSpacing: "0.15em", color: "#1e40af", fontWeight: 700, textTransform: "uppercase", verticalAlign: "middle", display: "inline-block", lineHeight: "1.2" }}>
                      EdgeTalent Academy
                    </span>
                  </div>
                  <div style={{ height: "1px", width: "120px", background: "linear-gradient(90deg, transparent, #d97706, transparent)", margin: "0 auto 0.4rem auto" }} />
                  <h1 style={{ fontSize: "1.65rem", fontWeight: 800, color: "#0f172a", letterSpacing: "0.08em", textTransform: "uppercase", margin: 0 }}>
                    Certificate of Completion
                  </h1>
                </div>

                {/* Certificate Main Body */}
                <div style={{ zIndex: 4, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.35rem", width: "100%", maxWidth: "600px" }}>
                  <p style={{ color: "#64748b", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.18em", margin: 0, fontWeight: 600 }}>
                    THIS OFFICIAL CREDENTIAL IS PROUDLY PRESENTED TO
                  </p>

                  <div style={{ width: "100%", margin: "0.1rem 0" }}>
                    <h2 style={{ fontSize: "1.85rem", fontWeight: 700, color: "#1d4ed8", fontFamily: "Georgia, 'Times New Roman', serif", margin: "0 0 0.15rem 0", letterSpacing: "0.02em" }}>
                      {profile?.full_name || "Talent Member"}
                    </h2>
                    <div style={{ height: "2px", width: "60%", background: "linear-gradient(90deg, transparent, #d97706, transparent)", margin: "0 auto" }} />
                  </div>

                  <p style={{ color: "#334155", fontSize: "0.82rem", lineHeight: 1.4, margin: "0.1rem 0 0 0" }}>
                    for successfully completing all prescribed requirements, practical evaluations, and mastery standards for the accredited program:
                  </p>

                  <h3 style={{ fontSize: "1.15rem", color: "#0f172a", fontWeight: 700, margin: "0.15rem 0", letterSpacing: "-0.01em" }}>
                    {selectedEnrollmentCert.courses?.title || "Advanced Industry Training Program"}
                  </h3>

                  {selectedEnrollmentCert.courses?.skills_taught && selectedEnrollmentCert.courses.skills_taught.length > 0 && (
                    <div style={{ marginTop: "0.15rem" }}>
                      <p style={{ color: "#64748b", fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.2rem" }}>
                        Verified Technical Mastery
                      </p>
                      <div style={{ display: "flex", justifyContent: "center", gap: "0.35rem", flexWrap: "wrap" }}>
                        {selectedEnrollmentCert.courses.skills_taught.map((skill: string, idx: number) => (
                          <span key={idx} style={{ background: "#f0f9ff", border: "1px solid #bae6fd", color: "#0369a1", padding: "0.12rem 0.45rem", borderRadius: "4px", fontSize: "0.65rem", fontWeight: 600 }}>
                            ✓ {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Certificate Bottom Section */}
                <div style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: "0.5rem", zIndex: 4, padding: "0 0.5rem" }}>
                  {/* Real Scannable QR Code */}
                  <div style={{ textAlign: "left", display: "flex", gap: "0.75rem", alignItems: "center" }}>
                    <div style={{ padding: "0.2rem", background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}>
                      <img 
                        src={qrCodeImg} 
                        alt="Scannable Certificate Verification QR Code" 
                        style={{ width: "65px", height: "65px", display: "block" }} 
                      />
                    </div>
                    <div>
                      <div style={{ fontSize: "0.6rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", display: "flex", alignItems: "center", gap: "0.3rem", marginBottom: "0.15rem" }}>
                        <span>Credential ID:</span>
                        <span style={{ fontFamily: "monospace", color: "#0f172a", background: "#f1f5f9", padding: "0.05rem 0.3rem", borderRadius: "3px", border: "1px solid #cbd5e1", fontWeight: 700 }}>
                          {modalCredId}
                        </span>
                      </div>
                      <div style={{ fontSize: "0.65rem", marginTop: "0.1rem", display: "flex", flexDirection: "column", gap: "0.08rem" }}>
                        <div>
                          <span style={{ color: "#64748b", textTransform: "uppercase", fontSize: "0.58rem", letterSpacing: "0.05em", marginRight: "0.3rem" }}>Issue Date:</span>
                          <span style={{ fontWeight: 700, color: "#0f172a" }}>
                            {new Date(selectedEnrollmentCert.completed_at || Date.now()).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                          </span>
                        </div>
                        <div>
                          <span style={{ color: "#dc2626", textTransform: "uppercase", fontSize: "0.58rem", letterSpacing: "0.05em", marginRight: "0.3rem" }}>Expiration Date:</span>
                          <span style={{ fontWeight: 700, color: "#991b1b" }}>
                            {new Date(
                              new Date(selectedEnrollmentCert.completed_at || Date.now()).setFullYear(
                                new Date(selectedEnrollmentCert.completed_at || Date.now()).getFullYear() + 2
                              )
                            ).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Signatures */}
                  <div style={{ textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                    <img 
                      src={signatureImg} 
                      alt="Blasius Yonas Vikariandi Signature" 
                      style={{ height: "54px", width: "auto", objectFit: "contain", transform: "translateY(-14px)", marginBottom: "-18px" }} 
                    />
                    <div style={{ height: "1px", width: "130px", background: "#cbd5e1", margin: "0.15rem 0 0.15rem 0" }} />
                    <div style={{ fontSize: "0.68rem", color: "#0f172a", fontWeight: 700 }}>Blasius Yonas Vikariandi</div>
                    <div style={{ fontSize: "0.6rem", color: "#64748b", textTransform: "uppercase" }}>EdgeTalent CEO</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Add External Certificate Modal */}
      <Modal
        isOpen={showAddCertModal}
        onClose={() => {
          setShowAddCertModal(false);
          resetCertForm();
        }}
        title="Add External Certification"
        size="md"
      >
        <form onSubmit={handleAddExternalCert} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div className="form-group">
            <label>Certification Name *</label>
            <input
              type="text"
              placeholder="e.g. AWS Certified Solutions Architect"
              value={certName}
              onChange={(e) => setCertName(e.target.value)}
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label>Issuing Organization *</label>
            <input
              type="text"
              placeholder="e.g. Amazon Web Services"
              value={certIssuer}
              onChange={(e) => setCertIssuer(e.target.value)}
              className="form-input"
              required
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div className="form-group">
              <label>Issue Date *</label>
              <input
                type="date"
                value={certIssueDate}
                onChange={(e) => setCertIssueDate(e.target.value)}
                className="form-input"
                required
              />
            </div>
            <div className="form-group">
              <label>Expiration Date</label>
              <input
                type="date"
                value={certExpiryDate}
                onChange={(e) => setCertExpiryDate(e.target.value)}
                className="form-input"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Credential ID</label>
            <input
              type="text"
              placeholder="Credential ID or number"
              value={certCredId}
              onChange={(e) => setCertCredId(e.target.value)}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>Credential URL</label>
            <input
              type="url"
              placeholder="https://verify.org/credential/123"
              value={certCredUrl}
              onChange={(e) => setCertCredUrl(e.target.value)}
              className="form-input"
            />
          </div>

          <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
            <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => { setShowAddCertModal(false); resetCertForm(); }}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={savingCert}>
              {savingCert ? "Saving..." : "Add Certificate"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit External Certificate Modal */}
      <Modal
        isOpen={showEditCertModal && !!selectedExternalCert}
        onClose={() => {
          setShowEditCertModal(false);
          resetCertForm();
        }}
        title="Edit Certification"
        size="md"
      >
        <form onSubmit={handleEditExternalCert} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div className="form-group">
            <label>Certification Name *</label>
            <input
              type="text"
              placeholder="e.g. AWS Certified Solutions Architect"
              value={certName}
              onChange={(e) => setCertName(e.target.value)}
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label>Issuing Organization *</label>
            <input
              type="text"
              placeholder="e.g. Amazon Web Services"
              value={certIssuer}
              onChange={(e) => setCertIssuer(e.target.value)}
              className="form-input"
              required
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div className="form-group">
              <label>Issue Date *</label>
              <input
                type="date"
                value={certIssueDate}
                onChange={(e) => setCertIssueDate(e.target.value)}
                className="form-input"
                required
              />
            </div>
            <div className="form-group">
              <label>Expiration Date</label>
              <input
                type="date"
                value={certExpiryDate}
                onChange={(e) => setCertExpiryDate(e.target.value)}
                className="form-input"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Credential ID</label>
            <input
              type="text"
              placeholder="Credential ID or number"
              value={certCredId}
              onChange={(e) => setCertCredId(e.target.value)}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>Credential URL</label>
            <input
              type="url"
              placeholder="https://verify.org/credential/123"
              value={certCredUrl}
              onChange={(e) => setCertCredUrl(e.target.value)}
              className="form-input"
            />
          </div>

          <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
            <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => { setShowEditCertModal(false); resetCertForm(); }}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={savingCert}>
              {savingCert ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
