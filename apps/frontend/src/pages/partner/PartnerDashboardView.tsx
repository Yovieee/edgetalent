import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useSupabase } from "../../context/SupabaseContext";
import { formatRupiah } from "../../utils/currency";
import {
  Building2,
  Users,
  Briefcase,
  GraduationCap,
  PlusCircle,
  Sparkles,
  DollarSign,
  ChevronRight
} from "lucide-react";

export default function PartnerDashboardView(): React.ReactElement {
  const { supabase, profile } = useSupabase();
  const navigate = useNavigate();

  const [projects, setProjects] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [enrollments] = useState<any[]>([]);
  const [topTalent, setTopTalent] = useState<any[]>([]);
  const [fundingOppCount, setFundingOppCount] = useState<number>(0);
  const [loadingOverview, setLoadingOverview] = useState<boolean>(true);

  const profileId = profile?.id;

  const loadPartnerOverview = useCallback(async () => {
    if (!profileId) return;
    setLoadingOverview(true);
    try {
      // 1. Load Partner's published projects
      const { data: projs, error: projErr } = await supabase
        .from("projects")
        .select("*")
        .eq("partner_id", profileId)
        .order("created_at", { ascending: false });

      if (!projErr && projs) {
        setProjects(projs);

        // 2. Load applications received for partner's projects
        if (projs.length > 0) {
          const projIds = projs.map((p) => p.id);
          const { data: apps, error: appErr } = await supabase
            .from("applications")
            .select("*, projects(title), profiles:talent_id(full_name, email, skills, bio, avatar_url)")
            .in("project_id", projIds)
            .order("applied_at", { ascending: false });

          if (!appErr && apps) {
            setApplications(apps);
          }
        }
      }

      // 3. Enterprise course enrollments query removed (unscoped)

      // 4. Load top AI talent candidates for spotlight
      const { data: talentProfiles } = await supabase
        .from("profiles")
        .select("id, full_name, email, skills, bio, avatar_url, role")
        .eq("role", "talent")
        .limit(4);
      if (talentProfiles) setTopTalent(talentProfiles);

      // 5. Load funding opportunities count
      const { count: fCount } = await supabase
        .from("funding_opportunities")
        .select("*", { count: "exact", head: true });
      if (fCount !== null) setFundingOppCount(fCount);

    } catch (e) {
      console.error("Error loading partner overview:", e);
    } finally {
      setLoadingOverview(false);
    }
  }, [profileId, supabase]);

  useEffect(() => {
    loadPartnerOverview();
  }, [loadPartnerOverview]);

  // Derived metrics
  const totalApplicationsCount = applications.length;
  const shortlistedCount = useMemo(() => {
    return applications.filter((a) => a.status === "shortlisted" || a.status === "accepted").length;
  }, [applications]);

  const activeProjectsCount = projects.length;

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      
      {/* Executive Welcome Banner */}
      <div 
        className="glass-panel" 
        style={{ 
          padding: "2.25rem", 
          borderRadius: "var(--radius-lg)",
          background: "linear-gradient(135deg, rgba(37, 99, 235, 0.08) 0%, rgba(79, 70, 229, 0.06) 50%, rgba(16, 185, 129, 0.04) 100%)",
          border: "1px solid rgba(37, 99, 235, 0.15)",
          position: "relative",
          overflow: "hidden"
        }}
      >
        <div style={{ position: "relative", zIndex: 1, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1.5rem" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
              <span className="badge badge-cyan" style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
                <Building2 size={12} /> Enterprise Partner Workspace
              </span>
              <span className="badge badge-purple" style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
                <Sparkles size={12} /> Vector Match Engine Active
              </span>
            </div>
            <h2 style={{ fontSize: "2rem", fontWeight: "700", letterSpacing: "-0.03em", marginBottom: "0.5rem" }}>
              Welcome back, <span style={{ color: "var(--color-cyan)" }}>{profile?.full_name || "Enterprise Partner"}</span> 🏢
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", lineHeight: "1.5", margin: 0, maxWidth: "650px" }}>
              Manage industrial project postings, evaluate top AI-matched talent applications, monitor enterprise academy progress, and explore venture funding options.
            </p>

            {/* Quick CTAs */}
            <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.25rem", flexWrap: "wrap" }}>
              <button 
                className="btn btn-primary" 
                onClick={() => navigate("/partner/projects", { state: { openPostModal: true } })}
                style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}
              >
                <PlusCircle size={16} /> Post New Project Scope
              </button>
              <button 
                className="btn btn-success" 
                onClick={() => navigate("/partner/hiring")}
                style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}
              >
                <Users size={16} /> Open Hiring Desk ({totalApplicationsCount})
              </button>
            </div>
          </div>

          {/* Quick Metrics Badge */}
          <div 
            style={{ 
              background: "var(--bg-secondary)", 
              padding: "1.25rem 1.5rem", 
              borderRadius: "var(--radius-md)", 
              border: "1px solid var(--glass-border)",
              boxShadow: "var(--shadow-card)",
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
              minWidth: "220px"
            }}
          >
            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: "600" }}>
              Partner Status
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "var(--color-emerald)" }} />
              <span style={{ fontWeight: "700", fontSize: "1.05rem" }}>Enterprise Verified</span>
            </div>
            <span style={{ fontSize: "0.775rem", color: "var(--text-secondary)" }}>
              Shortlist Rate: <b>{totalApplicationsCount > 0 ? Math.round((shortlistedCount / totalApplicationsCount) * 100) : 0}%</b>
            </span>
          </div>
        </div>
      </div>

      {/* 4 Executive Stat Cards Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: "1.25rem" }}>
        
        {/* Stat 1: Active Projects */}
        <div className="glass-panel" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
              <span style={{ color: "var(--text-secondary)", fontSize: "0.8rem", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                Active Projects
              </span>
              <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "rgba(37, 99, 235, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-cyan)" }}>
                <Briefcase size={18} />
              </div>
            </div>
            <div style={{ fontSize: "2.2rem", fontWeight: "800", color: "var(--text-primary)" }}>
              {activeProjectsCount} <span style={{ fontSize: "0.9rem", color: "var(--color-cyan)", fontWeight: "600" }}>Posted</span>
            </div>
          </div>
          <div style={{ marginTop: "1rem" }}>
            <button 
              onClick={() => navigate("/partner/projects")}
              style={{ background: "transparent", border: "none", color: "var(--color-cyan)", fontSize: "0.825rem", fontWeight: "600", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "0.25rem", padding: 0 }}
            >
              Manage Projects <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* Stat 2: Total Applicants */}
        <div className="glass-panel" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
              <span style={{ color: "var(--text-secondary)", fontSize: "0.8rem", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                Talent Applicants
              </span>
              <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "rgba(79, 70, 229, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-purple)" }}>
                <Users size={18} />
              </div>
            </div>
            <div style={{ fontSize: "2.2rem", fontWeight: "800", color: "var(--text-primary)" }}>
              {totalApplicationsCount} <span style={{ fontSize: "0.9rem", color: "var(--color-purple)", fontWeight: "600" }}>Submissions</span>
            </div>
          </div>
          <div style={{ marginTop: "1rem", display: "flex", gap: "0.5rem" }}>
            <span className="badge badge-emerald" style={{ fontSize: "0.65rem" }}>{shortlistedCount} Shortlisted</span>
          </div>
        </div>

        {/* Stat 3: Academy Training */}
        <div className="glass-panel" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
              <span style={{ color: "var(--text-secondary)", fontSize: "0.8rem", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                Academy Training
              </span>
              <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "rgba(245, 158, 11, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-amber)" }}>
                <GraduationCap size={18} />
              </div>
            </div>
            <div style={{ fontSize: "2.2rem", fontWeight: "800", color: "var(--text-primary)" }}>
              {enrollments.length} <span style={{ fontSize: "0.9rem", color: "var(--color-amber)", fontWeight: "600" }}>Enrolled</span>
            </div>
          </div>
          <div style={{ marginTop: "1rem" }}>
            <button 
              onClick={() => navigate("/partner/academy")}
              style={{ background: "transparent", border: "none", color: "var(--color-amber)", fontSize: "0.825rem", fontWeight: "600", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "0.25rem", padding: 0 }}
            >
              Browse Academy <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* Stat 4: Venture Funding */}
        <div className="glass-panel" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
              <span style={{ color: "var(--text-secondary)", fontSize: "0.8rem", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                Funding & Grants
              </span>
              <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "rgba(16, 185, 129, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-emerald)" }}>
                <DollarSign size={18} />
              </div>
            </div>
            <div style={{ fontSize: "2.2rem", fontWeight: "800", color: "var(--text-primary)" }}>
              {fundingOppCount} <span style={{ fontSize: "0.9rem", color: "var(--color-emerald)", fontWeight: "600" }}>Active Pools</span>
            </div>
          </div>
          <div style={{ marginTop: "1rem" }}>
            <button 
              onClick={() => navigate("/partner/funding")}
              style={{ background: "transparent", border: "none", color: "var(--color-emerald)", fontSize: "0.825rem", fontWeight: "600", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "0.25rem", padding: 0 }}
            >
              Explore Grants <ChevronRight size={14} />
            </button>
          </div>
        </div>

      </div>

      {/* AI Talent Spotlight Feed */}
      <div className="glass-panel" style={{ padding: "1.75rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
          <div>
            <h3 style={{ fontSize: "1.25rem", fontWeight: "700", margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Sparkles size={18} style={{ color: "var(--color-purple)" }} /> AI Talent Spotlight
            </h3>
            <p style={{ fontSize: "0.825rem", color: "var(--text-secondary)", margin: "0.25rem 0 0 0" }}>
              High-ranking candidates in the EdgeTalent vector database
            </p>
          </div>
          <button 
            className="btn btn-secondary" 
            onClick={() => navigate("/partner/hiring")}
            style={{ fontSize: "0.8rem", padding: "0.4rem 0.75rem" }}
          >
            Search Talent Pool
          </button>
        </div>

        {loadingOverview ? (
          <p style={{ color: "var(--text-secondary)" }}>Loading candidate pool...</p>
        ) : topTalent.length === 0 ? (
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>No talent profiles available currently.</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1rem" }}>
            {topTalent.map((t) => (
              <div 
                key={t.id}
                style={{
                  padding: "1.25rem",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--glass-border)",
                  background: "var(--bg-primary)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: "0.75rem"
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
                    <div className="avatar-badge" style={{ width: "36px", height: "36px", fontSize: "0.9rem", margin: 0 }}>
                      {(t.full_name || "T")[0].toUpperCase()}
                    </div>
                    <div>
                      <h4 style={{ fontSize: "0.95rem", fontWeight: "600", margin: 0 }}>{t.full_name || "Talent Member"}</h4>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{t.email}</span>
                    </div>
                  </div>

                  <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", margin: "0.5rem 0", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {t.bio || "Verified talent member on EdgeTalent ecosystem."}
                  </p>

                  <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap", marginTop: "0.5rem" }}>
                    {(t.skills || ["React", "AI/ML"]).slice(0, 3).map((sk: string, idx: number) => (
                      <span key={idx} className="badge badge-purple" style={{ fontSize: "0.65rem", padding: "0.15rem 0.4rem" }}>
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>

                <button 
                  className="btn btn-secondary" 
                  onClick={() => navigate("/partner/hiring")}
                  style={{ width: "100%", padding: "0.4rem", fontSize: "0.8rem", marginTop: "0.5rem" }}
                >
                  Invite to Apply
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Main Split: Projects Pipeline & Recent Applications Feed */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem" }}>
        
        {/* Left: Active Projects Pipeline */}
        <div className="glass-panel" style={{ padding: "1.75rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h3 style={{ fontSize: "1.2rem", fontWeight: "700", margin: 0 }}>Active Project Scopes</h3>
              <p style={{ fontSize: "0.825rem", color: "var(--text-secondary)", margin: "0.25rem 0 0 0" }}>
                Industrial projects currently open for application
              </p>
            </div>
            <button 
              className="btn btn-secondary" 
              onClick={() => navigate("/partner/projects")}
              style={{ fontSize: "0.8rem", padding: "0.4rem 0.75rem" }}
            >
              View All
            </button>
          </div>

          {loadingOverview ? (
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Loading projects...</p>
          ) : projects.length === 0 ? (
            <div style={{ textAlign: "center", padding: "2rem 0", color: "var(--text-secondary)" }}>
              <p style={{ fontSize: "0.875rem", marginBottom: "1rem" }}>You haven't created any industrial project scopes yet.</p>
              <button 
                className="btn btn-primary"
                onClick={() => navigate("/partner/projects", { state: { openPostModal: true } })}
              >
                + Create Project Scope
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
              {projects.slice(0, 4).map((proj) => (
                <div 
                  key={proj.id}
                  style={{
                    padding: "1rem 1.25rem",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--glass-border)",
                    background: "var(--bg-primary)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}
                >
                  <div>
                    <h4 style={{ fontSize: "0.95rem", fontWeight: "600", margin: "0 0 0.25rem 0" }}>{proj.title}</h4>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", display: "flex", gap: "0.5rem" }}>
                      <span>Budget: <b>{formatRupiah(proj.budget)}</b></span>
                      <span>•</span>
                      <span>Scope: <b style={{ textTransform: "capitalize" }}>{proj.scope}</b></span>
                    </div>
                  </div>

                  <button 
                    className="btn btn-secondary" 
                    onClick={() => navigate("/partner/hiring")}
                    style={{ fontSize: "0.775rem", padding: "0.35rem 0.75rem" }}
                  >
                    View Applicants
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Recent Talent Submissions Stream */}
        <div className="glass-panel" style={{ padding: "1.75rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h3 style={{ fontSize: "1.2rem", fontWeight: "700", margin: 0 }}>Recent Applications Stream</h3>
              <p style={{ fontSize: "0.825rem", color: "var(--text-secondary)", margin: "0.25rem 0 0 0" }}>
                Live candidates applying to your posted scopes
              </p>
            </div>
            <button 
              className="btn btn-secondary" 
              onClick={() => navigate("/partner/hiring")}
              style={{ fontSize: "0.8rem", padding: "0.4rem 0.75rem" }}
            >
              Hiring Desk
            </button>
          </div>

          {loadingOverview ? (
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Loading submissions...</p>
          ) : applications.length === 0 ? (
            <div style={{ textAlign: "center", padding: "2rem 0", color: "var(--text-secondary)" }}>
              <p style={{ fontSize: "0.875rem" }}>No candidates have applied to your scopes yet.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
              {applications.slice(0, 4).map((app) => (
                <div 
                  key={app.id}
                  style={{
                    padding: "1rem 1.25rem",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--glass-border)",
                    background: "var(--bg-primary)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <div className="avatar-badge" style={{ width: "32px", height: "32px", fontSize: "0.8rem", margin: 0 }}>
                      {(app.profiles?.full_name || "T")[0].toUpperCase()}
                    </div>
                    <div>
                      <h4 style={{ fontSize: "0.9rem", fontWeight: "600", margin: 0 }}>{app.profiles?.full_name || "Applicant"}</h4>
                      <span style={{ fontSize: "0.775rem", color: "var(--text-secondary)" }}>
                        Applied for {app.projects?.title}
                      </span>
                    </div>
                  </div>

                  <span className={`badge ${
                    app.status === "accepted" ? "badge-emerald" : 
                    app.status === "rejected" ? "badge-rose" : 
                    app.status === "shortlisted" ? "badge-amber" : "badge-purple"
                  }`} style={{ fontSize: "0.75rem", textTransform: "capitalize" }}>
                    {app.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
