import React, { useState, useEffect, useCallback } from "react";
import { useSupabase } from "../../context/SupabaseContext";
import { Search, X } from "lucide-react";

export default function TalentGigs(): React.ReactElement {
  const { supabase, profile } = useSupabase();
  const [applications, setApplications] = useState<any[]>([]);
  const [loadingOverview, setLoadingOverview] = useState<boolean>(true);

  // Search & Filter state
  const [gigSearchQuery, setGigSearchQuery] = useState<string>("");
  const [gigFilterStatus, setGigFilterStatus] = useState<string>("all");
  const [selectedGig, setSelectedGig] = useState<any | null>(null);

  const profileId = profile?.id;

  const loadOverview = useCallback(async () => {
    if (!profileId) return;
    setLoadingOverview(true);
    try {
      const { data, error } = await supabase
        .from("applications")
        .select("*, projects(*, profiles(full_name, email))")
        .eq("talent_id", profileId);
      if (!error && data) setApplications(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingOverview(false);
    }
  }, [profileId, supabase]);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  const renderStepper = (status: string) => {
    const steps = [
      { label: "Applied", active: true },
      { label: "Under Review", active: ["reviewing", "shortlisted", "accepted"].includes(status) },
      { label: "Shortlisted", active: ["shortlisted", "accepted"].includes(status) },
      { label: "Hired", active: status === "accepted" }
    ];

    if (status === "rejected") {
      return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "1rem", padding: "0 0.5rem" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
            <div style={{ width: "22px", height: "22px", borderRadius: "50%", background: "var(--color-purple)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "0.7rem", fontWeight: "bold" }}>✓</div>
            <span style={{ fontSize: "0.65rem", marginTop: "0.25rem", color: "var(--text-secondary)", fontWeight: "600" }}>Applied</span>
          </div>
          <div style={{ flex: 1, height: "2px", background: "var(--color-rose)", margin: "0 0.25rem 10px 0.25rem" }}></div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
            <div style={{ width: "22px", height: "22px", borderRadius: "50%", background: "var(--color-rose)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "0.7rem", fontWeight: "bold" }}>✕</div>
            <span style={{ fontSize: "0.65rem", marginTop: "0.25rem", color: "var(--color-rose)", fontWeight: "600" }}>Declined</span>
          </div>
        </div>
      );
    }

    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "1rem", padding: "0 0.5rem" }}>
        {steps.map((step, idx) => (
          <React.Fragment key={idx}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", zIndex: 1 }}>
              <div style={{
                width: "22px",
                height: "22px",
                borderRadius: "50%",
                background: step.active ? (idx === 3 ? "var(--color-emerald)" : "var(--color-purple)") : "var(--bg-tertiary)",
                border: `2px solid ${step.active ? (idx === 3 ? "var(--color-emerald)" : "var(--color-purple)") : "var(--glass-border)"}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: step.active ? "white" : "var(--text-muted)",
                fontSize: "0.7rem",
                fontWeight: "bold",
                boxShadow: step.active ? (idx === 3 ? "var(--glow-emerald)" : "var(--glow-purple)") : "none"
              }}>
                {step.active ? "✓" : idx + 1}
              </div>
              <span style={{
                fontSize: "0.65rem",
                marginTop: "0.25rem",
                color: step.active ? "var(--text-primary)" : "var(--text-muted)",
                fontWeight: step.active ? "600" : "400"
              }}>
                {step.label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div style={{
                flex: 1,
                height: "2px",
                background: steps[idx + 1].active ? "var(--color-purple)" : "var(--glass-border)",
                margin: "0 -8px 10px -8px"
              }}></div>
            )}
          </React.Fragment>
        ))}
      </div>
    );
  };

  const filtered = applications.filter((app) => {
    const project = app.projects || {};
    const titleMatch = (project.title || "").toLowerCase().includes(gigSearchQuery.toLowerCase());
    const descMatch = (project.description || "").toLowerCase().includes(gigSearchQuery.toLowerCase());
    
    const partner = project.profiles || {};
    const partnerMatch = (partner.full_name || "").toLowerCase().includes(gigSearchQuery.toLowerCase());
    
    const matchesSearch = titleMatch || descMatch || partnerMatch;

    if (!matchesSearch) return false;

    if (gigFilterStatus === "all") return true;
    if (gigFilterStatus === "active") return app.status === "accepted";
    if (gigFilterStatus === "reviewing") return app.status === "reviewing";
    return app.status === gigFilterStatus;
  });

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      {/* Stats Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.5rem" }}>
        <div className="glass-panel" style={{ padding: "1.5rem" }}>
          <h4 style={{ color: "var(--text-secondary)", marginBottom: "0.5rem", fontSize: "0.85rem", textTransform: "uppercase" }}>Total Applications</h4>
          <p style={{ fontSize: "2rem", fontWeight: "bold", color: "var(--color-purple)", margin: 0 }}>
            {applications.length}
          </p>
        </div>
        <div className="glass-panel" style={{ padding: "1.5rem" }}>
          <h4 style={{ color: "var(--text-secondary)", marginBottom: "0.5rem", fontSize: "0.85rem", textTransform: "uppercase" }}>Active Gigs</h4>
          <p style={{ fontSize: "2rem", fontWeight: "bold", color: "var(--color-emerald)", margin: 0 }}>
            {applications.filter(a => a.status === "accepted").length}
          </p>
        </div>
        <div className="glass-panel" style={{ padding: "1.5rem" }}>
          <h4 style={{ color: "var(--text-secondary)", marginBottom: "0.5rem", fontSize: "0.85rem", textTransform: "uppercase" }}>Shortlisted</h4>
          <p style={{ fontSize: "2rem", fontWeight: "bold", color: "var(--color-amber)", margin: 0 }}>
            {applications.filter(a => a.status === "shortlisted").length}
          </p>
        </div>
        <div className="glass-panel" style={{ padding: "1.5rem" }}>
          <h4 style={{ color: "var(--text-secondary)", marginBottom: "0.5rem", fontSize: "0.85rem", textTransform: "uppercase" }}>Under Review</h4>
          <p style={{ fontSize: "2rem", fontWeight: "bold", color: "var(--color-cyan)", margin: 0 }}>
            {applications.filter(a => a.status === "reviewing").length}
          </p>
        </div>
      </div>

      {/* Filters & Search Control Bar */}
      <div className="glass-panel" style={{ padding: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1.5rem" }}>
        {/* Search */}
        <div style={{ position: "relative", flex: 1, minWidth: "280px" }}>
          <span style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", display: "flex", alignItems: "center" }}>
            <Search size={18} />
          </span>
          <input
            type="text"
            placeholder="Search by gig title, description, or client..."
            value={gigSearchQuery}
            onChange={(e) => setGigSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "0.75rem 1rem 0.75rem 2.8rem",
              background: "rgba(255, 255, 255, 0.4)",
              border: "1px solid var(--glass-border)",
              borderRadius: "var(--radius-sm)",
              color: "var(--text-primary)",
              fontSize: "0.95rem",
              outline: "none",
              transition: "border-color 0.2s"
            }}
            onFocus={(e) => e.target.style.borderColor = "var(--color-cyan)"}
            onBlur={(e) => e.target.style.borderColor = "var(--glass-border)"}
          />
        </div>

        {/* Filters */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
          {[
            { id: "all", label: "All" },
            { id: "active", label: "Active" },
            { id: "shortlisted", label: "Shortlisted" },
            { id: "reviewing", label: "In Review" },
            { id: "applied", label: "Applied" },
            { id: "rejected", label: "Declined" }
          ].map((filter) => {
            let count = 0;
            if (filter.id === "all") count = applications.length;
            else if (filter.id === "active") count = applications.filter(a => a.status === "accepted").length;
            else if (filter.id === "reviewing") count = applications.filter(a => a.status === "reviewing").length;
            else count = applications.filter(a => a.status === filter.id).length;

            const isActive = gigFilterStatus === filter.id;
            return (
              <button
                key={filter.id}
                onClick={() => setGigFilterStatus(filter.id)}
                style={{
                  padding: "0.5rem 1rem",
                  borderRadius: "9999px",
                  border: "1px solid",
                  borderColor: isActive ? "var(--color-cyan)" : "var(--glass-border)",
                  background: isActive ? "rgba(8, 145, 178, 0.1)" : "transparent",
                  color: isActive ? "var(--color-cyan)" : "var(--text-secondary)",
                  fontWeight: "600",
                  fontSize: "0.85rem",
                  cursor: "pointer",
                  transition: "all 0.2s ease"
                }}
              >
                {filter.label} <span style={{ opacity: 0.6, fontSize: "0.75rem", marginLeft: "0.25rem" }}>({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      {loadingOverview ? (
        <div className="glass-panel" style={{ padding: "3rem", textAlign: "center" }}>
          <p style={{ color: "var(--text-secondary)" }}>Loading your gigs portfolio...</p>
        </div>
      ) : applications.length === 0 ? (
        <div className="glass-panel" style={{ padding: "4rem 2rem", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "1.5rem" }}>
          <div style={{ fontSize: "4rem" }}>💼</div>
          <div>
            <h3 style={{ marginBottom: "0.5rem" }}>Start your industrial gig journey!</h3>
            <p style={{ color: "var(--text-secondary)", maxWidth: "500px", margin: "0 auto" }}>
              You haven't applied to any projects yet. Check out the project marketplace to find high-match industrial projects.
            </p>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-panel" style={{ padding: "3rem", textAlign: "center", color: "var(--text-secondary)" }}>
          No gigs match your search or filter criteria.
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem" }}>
          {filtered.map((app) => {
            const project = app.projects || {};
            const partnerName = project.profiles?.full_name || "EdgeTalent Partner";
            const showContact = ["accepted", "shortlisted"].includes(app.status);
            
            return (
              <div
                key={app.id}
                className="glass-panel gig-card-hover"
                style={{
                  padding: "2rem",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: "1.5rem",
                  position: "relative",
                  overflow: "hidden"
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                    <span className={`badge ${
                      app.status === "accepted" ? "badge-emerald" : 
                      app.status === "rejected" ? "badge-rose" : 
                      app.status === "shortlisted" ? "badge-amber" : 
                      app.status === "reviewing" ? "badge-cyan" : "badge-purple"
                    }`}>
                      {app.status === "accepted" ? "Hired" : app.status}
                    </span>

                    {app.match_percentage && (
                      <span className="badge badge-cyan" style={{ fontSize: "0.7rem" }}>
                        {app.match_percentage}% AI Match
                      </span>
                    )}
                  </div>

                  <h3 style={{ fontSize: "1.25rem", marginBottom: "0.5rem", color: "var(--text-primary)" }}>{project.title}</h3>
                  
                  <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "1rem" }}>
                    <b>Partner:</b> {showContact ? partnerName : "EdgeTalent Client (Hidden)"}
                  </p>

                  <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden", textOverflow: "ellipsis", marginBottom: "1rem", lineHeight: "1.5" }}>
                    {project.description}
                  </p>

                  <div style={{ display: "flex", gap: "1rem", fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                    <span>⏱️ <b>{project.scope}</b></span>
                    <span>💰 <b>${project.budget}</b></span>
                  </div>
                </div>

                <div>
                  {renderStepper(app.status)}

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1.5rem", paddingTop: "1rem", borderTop: "1px solid var(--glass-border)" }}>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      Applied {new Date(app.applied_at).toLocaleDateString()}
                    </span>
                    <button
                      className="btn btn-secondary"
                      onClick={() => setSelectedGig(app)}
                      style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem" }}
                    >
                      Details
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Gig Details Modal */}
      {selectedGig && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1001,
          }}
        >
          <div className="glass-panel animate-fade-in" style={{ width: "90%", maxWidth: "700px", padding: "2.5rem", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
              <div>
                <span className={`badge ${
                  selectedGig.status === "accepted" ? "badge-emerald" : 
                  selectedGig.status === "rejected" ? "badge-rose" : 
                  selectedGig.status === "shortlisted" ? "badge-amber" : 
                  selectedGig.status === "reviewing" ? "badge-cyan" : "badge-purple"
                }`} style={{ marginBottom: "0.5rem" }}>
                  {selectedGig.status === "accepted" ? "Hired" : selectedGig.status}
                </span>
                <h3 style={{ margin: 0, fontSize: "1.75rem", color: "var(--text-primary)" }}>{selectedGig.projects?.title}</h3>
              </div>
              <button
                className="hamburger-btn"
                onClick={() => setSelectedGig(null)}
                style={{ padding: "0.25rem", cursor: "pointer", border: "none", background: "transparent", color: "var(--text-primary)" }}
              >
                <X size={24} />
              </button>
            </div>

            <div style={{ background: "rgba(255, 255, 255, 0.3)", padding: "1.5rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--glass-border)", marginBottom: "2rem" }}>
              <h4 style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "0.5rem", textTransform: "uppercase" }}>Application Stage</h4>
              {renderStepper(selectedGig.status)}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                <div className="glass-panel" style={{ padding: "1rem", background: "rgba(255, 255, 255, 0.4)" }}>
                  <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>⏱ Scope</span>
                  <p style={{ fontSize: "1.1rem", fontWeight: "bold", margin: "0.25rem 0 0 0" }}>{selectedGig.projects?.scope}</p>
                </div>
                <div className="glass-panel" style={{ padding: "1rem", background: "rgba(255, 255, 255, 0.4)" }}>
                  <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>💰 Budget</span>
                  <p style={{ fontSize: "1.1rem", fontWeight: "bold", margin: "0.25rem 0 0 0" }}>${selectedGig.projects?.budget}</p>
                </div>
              </div>

              <div>
                <h4 style={{ fontSize: "1rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>Description</h4>
                <p style={{ fontSize: "0.95rem", color: "var(--text-primary)", lineHeight: "1.6", whiteSpace: "pre-wrap" }}>
                  {selectedGig.projects?.description}
                </p>
              </div>

              <div>
                <h4 style={{ fontSize: "1rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>Required Skills</h4>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                  {selectedGig.projects?.required_skills?.map((skill: string, idx: number) => (
                    <span key={idx} className="badge badge-purple" style={{ fontSize: "0.75rem" }}>
                      {skill}
                    </span>
                  )) || <span style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>None specified</span>}
                </div>
              </div>

              {selectedGig.match_percentage && (
                <div className="glass-panel" style={{ padding: "1.5rem", background: "rgba(8, 145, 178, 0.04)" }}>
                  <h4 style={{ fontSize: "1rem", color: "var(--color-cyan)", marginBottom: "0.5rem" }}>AI Fit Assessment</h4>
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "0.5rem" }}>
                    <span style={{ fontSize: "1.5rem", fontWeight: "bold", color: "var(--color-cyan)" }}>{selectedGig.match_percentage}%</span>
                    <div style={{ flex: 1, height: "8px", background: "rgba(8, 145, 178, 0.1)", borderRadius: "4px", overflow: "hidden" }}>
                      <div style={{ width: `${selectedGig.match_percentage}%`, height: "100%", background: "var(--color-cyan)" }}></div>
                    </div>
                  </div>
                  <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", margin: 0 }}>
                    Our AI has matched your profile skills, experience, and interests against the client requirements.
                  </p>
                </div>
              )}

              <div style={{ borderTop: "1px solid var(--glass-border)", paddingTop: "1.5rem", marginTop: "1rem" }}>
                {["accepted", "shortlisted"].includes(selectedGig.status) ? (
                  <div className="glass-panel" style={{ padding: "1.5rem", background: "rgba(5, 150, 105, 0.04)", border: "1px solid rgba(5, 150, 105, 0.2)" }}>
                    <h4 style={{ fontSize: "1.1rem", color: "var(--color-emerald)", marginBottom: "0.75rem" }}>🎉 Client Contact Details Unlocked!</h4>
                    <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "1rem" }}>
                      Congratulations! The partner client has shortlisted or accepted your application. You can reach out directly to coordinate deliverables:
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1rem" }}>
                      <span style={{ fontSize: "0.9rem" }}>👤 <b>Name:</b> {selectedGig.projects?.profiles?.full_name || "EdgeTalent Partner"}</span>
                      <span style={{ fontSize: "0.9rem" }}>✉️ <b>Email:</b> <a href={`mailto:${selectedGig.projects?.profiles?.email}`} style={{ color: "var(--color-cyan)", textDecoration: "underline" }}>{selectedGig.projects?.profiles?.email}</a></span>
                    </div>
                    <a
                      href={`mailto:${selectedGig.projects?.profiles?.email}?subject=Regarding Project: ${encodeURIComponent(selectedGig.projects?.title || "")}`}
                      className="btn btn-success"
                      style={{ width: "100%" }}
                    >
                      Email Client
                    </a>
                  </div>
                ) : (
                  <div className="glass-panel" style={{ padding: "1.5rem", background: "rgba(0, 0, 0, 0.02)", textAlign: "center" }}>
                    <h4 style={{ fontSize: "1rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>🔒 Contact Info Locked</h4>
                    <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: 0 }}>
                      Client details and direct contact details will unlock automatically once your application is shortlisted or accepted.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
