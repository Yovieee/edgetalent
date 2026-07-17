import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useSupabase } from "../../context/SupabaseContext";
import { Search, Mail } from "lucide-react";

export default function PartnerHiring(): React.ReactElement {
  const { supabase, profile } = useSupabase();
  const navigate = useNavigate();

  const [applications, setApplications] = useState<any[]>([]);
  const [loadingApplications, setLoadingApplications] = useState<boolean>(true);
  const [applicationsError, setApplicationsError] = useState<string>("");

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("All");

  const profileId = profile?.id;

  const loadApplications = useCallback(async () => {
    if (!profileId) return;
    setLoadingApplications(true);
    setApplicationsError("");
    try {
      const { data: projs, error: projErr } = await supabase
        .from("projects")
        .select("id")
        .eq("partner_id", profileId);

      if (projErr) throw projErr;
      if (!projs || projs.length === 0) {
        setApplications([]);
        return;
      }

      const projIds = projs.map((p) => p.id);
      const { data, error } = await supabase
        .from("applications")
        .select("*, projects(*), profiles:talent_id(*)")
        .in("project_id", projIds);

      if (error) throw error;

      if (data) {
        const sorted = [...data].sort((a, b) => new Date(b.applied_at).getTime() - new Date(a.applied_at).getTime());
        setApplications(sorted);
      }
    } catch (e: any) {
      console.error("Error loading applications:", e);
      setApplicationsError(e.message || "Failed to load applications.");
    } finally {
      setLoadingApplications(false);
    }
  }, [profileId, supabase]);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  const handleUpdateStatus = async (applicationId: string, newStatus: "applied" | "reviewing" | "shortlisted" | "accepted" | "rejected") => {
    try {
      const { error } = await supabase
        .from("applications")
        .update({ status: newStatus })
        .eq("id", applicationId);

      if (error) throw error;

      setApplications(prev =>
        prev.map(app => (app.id === applicationId ? { ...app, status: newStatus } : app))
      );
    } catch (err: any) {
      console.error("Error updating application status:", err);
      alert(err.message || "Failed to update application status.");
    }
  };

  const filteredApplications = applications.filter((app) => {
    const matchSearch =
      (app.profiles?.full_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (app.projects?.title || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus =
      statusFilter === "All" || app.status.toLowerCase() === statusFilter.toLowerCase();
    return matchSearch && matchStatus;
  });

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      {/* Hero Header */}
      <div className="glass-panel" style={{ padding: "2.5rem 2rem", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <div style={{ position: "absolute", top: "0", left: "0", width: "100%", height: "4px", background: "var(--grad-emerald-cyan)" }} />
        <h3 style={{ fontSize: "1.75rem", margin: 0, fontWeight: "700" }}>Hiring Desk</h3>
        <p style={{ color: "var(--text-secondary)", fontSize: "1rem", margin: 0, maxWidth: "700px" }}>
          Manage and review applications submitted by talents for your posted projects. Track candidates, view AI vector matches, and transition application statuses.
        </p>
      </div>

      {/* Stats Overview */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1.5rem" }}>
        <div className="glass-panel" style={{ padding: "1.25rem", textAlign: "center" }}>
          <h4 style={{ color: "var(--text-secondary)", marginBottom: "0.25rem", fontSize: "0.8rem", textTransform: "uppercase" }}>Total Applicants</h4>
          <p style={{ fontSize: "1.8rem", fontWeight: "bold", color: "var(--text-primary)", margin: "0.25rem 0 0 0" }}>{applications.length}</p>
        </div>
        <div className="glass-panel" style={{ padding: "1.25rem", textAlign: "center" }}>
          <h4 style={{ color: "var(--text-secondary)", marginBottom: "0.25rem", fontSize: "0.8rem", textTransform: "uppercase" }}>Reviewing</h4>
          <p style={{ fontSize: "1.8rem", fontWeight: "bold", color: "var(--color-cyan)", margin: "0.25rem 0 0 0" }}>
            {applications.filter(a => a.status === "reviewing").length}
          </p>
        </div>
        <div className="glass-panel" style={{ padding: "1.25rem", textAlign: "center" }}>
          <h4 style={{ color: "var(--text-secondary)", marginBottom: "0.25rem", fontSize: "0.8rem", textTransform: "uppercase" }}>Shortlisted</h4>
          <p style={{ fontSize: "1.8rem", fontWeight: "bold", color: "var(--color-purple)", margin: "0.25rem 0 0 0" }}>
            {applications.filter(a => a.status === "shortlisted").length}
          </p>
        </div>
        <div className="glass-panel" style={{ padding: "1.25rem", textAlign: "center" }}>
          <h4 style={{ color: "var(--text-secondary)", marginBottom: "0.25rem", fontSize: "0.8rem", textTransform: "uppercase" }}>Accepted</h4>
          <p style={{ fontSize: "1.8rem", fontWeight: "bold", color: "var(--color-emerald)", margin: "0.25rem 0 0 0" }}>
            {applications.filter(a => a.status === "accepted").length}
          </p>
        </div>
        <div className="glass-panel" style={{ padding: "1.25rem", textAlign: "center" }}>
          <h4 style={{ color: "var(--text-secondary)", marginBottom: "0.25rem", fontSize: "0.8rem", textTransform: "uppercase" }}>Rejected</h4>
          <p style={{ fontSize: "1.8rem", fontWeight: "bold", color: "var(--color-rose)", margin: "0.25rem 0 0 0" }}>
            {applications.filter(a => a.status === "rejected").length}
          </p>
        </div>
      </div>

      {/* Filters & Search Control Panel */}
      <div className="glass-panel" style={{ padding: "1.5rem", display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap", justifyContent: "space-between" }}>
        {/* Search */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "rgba(255, 255, 255, 0.5)", border: "1px solid var(--glass-border)", borderRadius: "var(--radius-sm)", padding: "0.5rem 1rem", minWidth: "280px", flex: "1" }}>
          <Search size={18} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Search applicants or projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ border: "none", background: "transparent", outline: "none", color: "var(--text-primary)", fontSize: "0.9rem", width: "100%" }}
          />
        </div>

        {/* Status Filter Buttons */}
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {["All", "Applied", "Reviewing", "Shortlisted", "Accepted", "Rejected"].map((status) => {
            const count = status === "All" ? applications.length : applications.filter(a => a.status.toLowerCase() === status.toLowerCase()).length;
            const isActive = statusFilter === status;
            return (
              <button
                key={status}
                className={`badge ${isActive ? "badge-cyan" : "badge-neutral"}`}
                style={{ cursor: "pointer", border: "none", padding: "0.5rem 1rem", fontSize: "0.85rem", borderRadius: "100px", transition: "all 0.2s" }}
                onClick={() => setStatusFilter(status)}
              >
                {status} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Applications Area */}
      {loadingApplications ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "3rem" }}>
          <p style={{ color: "var(--text-secondary)" }}>Loading candidate applications...</p>
        </div>
      ) : applicationsError ? (
        <div className="badge badge-rose" style={{ padding: "1rem", borderRadius: "var(--radius-sm)" }}>
          {applicationsError}
        </div>
      ) : filteredApplications.length === 0 ? (
        <div className="glass-panel" style={{ padding: "4rem 2rem", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
          <span style={{ fontSize: "3rem" }}>💼</span>
          <h4 style={{ fontSize: "1.25rem", margin: 0 }}>No applications found</h4>
          <p style={{ color: "var(--text-secondary)", maxWidth: "500px", margin: 0 }}>
            {statusFilter !== "All" || searchQuery
              ? "Try adjusting your search criteria or filters to see more results."
              : "No candidates have applied to your active project scopes yet. Post more deliverables scopes in the Projects workspace to attract elite talents."}
          </p>
          {statusFilter === "All" && !searchQuery && (
            <button className="btn btn-primary" onClick={() => navigate("/partner/projects")}>
              Go to Projects Workspace
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "1.5rem" }}>
          {filteredApplications.map((app) => {
            const talent = app.profiles || {};
            const project = app.projects || {};
            const initials = (talent.full_name || "T")[0].toUpperCase();
            const matchPct = app.match_percentage || 0;
            
            let matchBadgeClass = "badge-rose";
            let matchColor = "var(--color-rose)";
            if (matchPct >= 80) {
              matchBadgeClass = "badge-emerald";
              matchColor = "var(--color-emerald)";
            } else if (matchPct >= 50) {
              matchBadgeClass = "badge-cyan";
              matchColor = "var(--color-cyan)";
            } else if (matchPct > 0) {
              matchBadgeClass = "badge-amber";
              matchColor = "var(--color-amber)";
            }

            let statusBadgeClass = "badge-neutral";
            if (app.status === "reviewing") statusBadgeClass = "badge-cyan";
            else if (app.status === "shortlisted") statusBadgeClass = "badge-purple";
            else if (app.status === "accepted") statusBadgeClass = "badge-emerald";
            else if (app.status === "rejected") statusBadgeClass = "badge-rose";

            return (
              <div key={app.id} className="glass-panel" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", justifyContent: "space-between", gap: "1.25rem", transition: "all 0.3s" }}>
                
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem", marginBottom: "1rem" }}>
                    <span className="badge badge-neutral" style={{ fontSize: "0.7rem", maxWidth: "200px", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }} title={project.title}>
                      Project: {project.title}
                    </span>
                    <span className={`badge ${statusBadgeClass}`} style={{ fontSize: "0.7rem", textTransform: "capitalize" }}>
                      {app.status}
                    </span>
                  </div>

                  <div style={{ display: "flex", gap: "1rem", alignItems: "center", marginBottom: "1rem" }}>
                    <div style={{
                      width: "42px",
                      height: "42px",
                      borderRadius: "50%",
                      background: "var(--grad-cyan-purple)",
                      color: "white",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: "700",
                      fontSize: "1.1rem"
                    }}>
                      {initials}
                    </div>
                    <div style={{ overflow: "hidden" }}>
                      <h4 style={{ fontSize: "1.1rem", margin: 0, whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>{talent.full_name || "EdgeTalent Member"}</h4>
                      <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{talent.email}</span>
                    </div>
                  </div>

                  {matchPct > 0 && (
                    <div style={{ marginBottom: "1rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.25rem" }}>
                        <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: "500" }}>AI Match Accuracy</span>
                        <span className={`badge ${matchBadgeClass}`} style={{ fontSize: "0.7rem" }}>{matchPct}% Match</span>
                      </div>
                      <div style={{ width: "100%", height: "6px", background: "var(--bg-tertiary)", borderRadius: "10px", overflow: "hidden" }}>
                        <div style={{ width: `${matchPct}%`, height: "100%", background: matchColor, borderRadius: "10px" }} />
                      </div>
                    </div>
                  )}

                  <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: "1.5", margin: "0 0 1rem 0", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }} title={talent.bio}>
                    {talent.bio || "No biography provided by candidate."}
                  </p>

                  {talent.skills && talent.skills.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem", marginBottom: "1rem" }}>
                      {talent.skills.slice(0, 6).map((skill: string, idx: number) => (
                        <span key={idx} className="badge badge-emerald" style={{ fontSize: "0.65rem", padding: "0.15rem 0.4rem" }}>{skill}</span>
                      ))}
                      {talent.skills.length > 6 && (
                        <span className="badge badge-neutral" style={{ fontSize: "0.65rem", padding: "0.15rem 0.4rem" }}>+{talent.skills.length - 6} more</span>
                      )}
                    </div>
                  )}
                </div>

                <div style={{ borderTop: "1px solid var(--glass-border)", paddingTop: "1rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    <span>Applied: {new Date(app.applied_at).toLocaleDateString()}</span>
                  </div>

                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                    <button
                      className="btn btn-secondary btn-review"
                      style={{ flex: "1", padding: "0.4rem 0.8rem", fontSize: "0.8rem", background: app.status === "reviewing" ? "rgba(8, 145, 178, 0.1)" : "", borderColor: app.status === "reviewing" ? "var(--color-cyan)" : "" }}
                      onClick={() => handleUpdateStatus(app.id, "reviewing")}
                    >
                      Review
                    </button>
                    <button
                      className="btn btn-secondary btn-shortlist"
                      style={{ flex: "1", padding: "0.4rem 0.8rem", fontSize: "0.8rem", background: app.status === "shortlisted" ? "rgba(124, 58, 237, 0.1)" : "", borderColor: app.status === "shortlisted" ? "var(--color-purple)" : "" }}
                      onClick={() => handleUpdateStatus(app.id, "shortlisted")}
                    >
                      Shortlist
                    </button>
                    <button
                      className="btn btn-success btn-accept"
                      style={{ flex: "1", padding: "0.4rem 0.8rem", fontSize: "0.8rem", minWidth: "70px" }}
                      disabled={app.status === "accepted"}
                      onClick={() => handleUpdateStatus(app.id, "accepted")}
                    >
                      Accept
                    </button>
                    <button
                      className="btn btn-warning btn-reject"
                      style={{ flex: "1", padding: "0.4rem 0.8rem", fontSize: "0.8rem", minWidth: "70px" }}
                      disabled={app.status === "rejected"}
                      onClick={() => handleUpdateStatus(app.id, "rejected")}
                    >
                      Reject
                    </button>
                  </div>

                  {talent.email && (
                    <a
                      href={`mailto:${talent.email}?subject=Application for ${project.title}`}
                      className="btn btn-primary"
                      style={{ width: "100%", padding: "0.5rem 1rem", fontSize: "0.85rem", textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center" }}
                    >
                      <Mail size={14} style={{ marginRight: "0.5rem" }} />
                      Contact Candidate
                    </a>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
