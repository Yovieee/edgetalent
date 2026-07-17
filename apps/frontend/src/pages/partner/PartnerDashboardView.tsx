import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useSupabase } from "../../context/SupabaseContext";

export default function PartnerDashboardView(): React.ReactElement {
  const { supabase, profile } = useSupabase();
  const navigate = useNavigate();

  const [projects, setProjects] = useState<any[]>([]);
  const [totalApplications, setTotalApplications] = useState<number>(0);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [loadingOverview, setLoadingOverview] = useState<boolean>(true);

  const profileId = profile?.id;

  const loadOverview = useCallback(async () => {
    if (!profileId) return;
    setLoadingOverview(true);
    try {
      const { data: projs, error: projErr } = await supabase
        .from("projects")
        .select("*")
        .eq("partner_id", profileId);

      if (!projErr && projs) {
        setProjects(projs);
        if (projs.length > 0) {
          const projIds = projs.map((p) => p.id);
          const { count, error: appErr } = await supabase
            .from("applications")
            .select("*", { count: "exact", head: true })
            .in("project_id", projIds);

          if (!appErr) setTotalApplications(count || 0);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingOverview(false);
    }
  }, [profileId, supabase]);

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

  useEffect(() => {
    loadOverview();
    loadEnrollments();
  }, [loadOverview, loadEnrollments]);

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      {/* Welcome banner */}
      <div className="glass-panel" style={{ padding: "2rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1.5rem", background: "linear-gradient(135deg, rgba(6, 182, 212, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%)" }}>
        <div>
          <h2 style={{ fontSize: "1.8rem", marginBottom: "0.5rem" }}>
            Welcome back, <span style={{ color: "var(--color-cyan)" }}>{profile?.full_name || "Enterprise Partner"}</span>!
          </h2>
          <p style={{ color: "var(--text-secondary)", margin: 0 }}>
            Here is what's happening with your workspace and learning metrics today.
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <span className="badge badge-cyan">Partner Account</span>
          <span className="badge badge-purple">AI Vector Search Active</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.5rem" }}>
        <div className="glass-panel" style={{ padding: "1.5rem" }}>
          <h4 style={{ color: "var(--text-secondary)", marginBottom: "0.5rem", fontSize: "0.85rem", textTransform: "uppercase" }}>Active Projects</h4>
          <p style={{ fontSize: "2rem", fontWeight: "bold", color: "var(--color-cyan)", margin: "0.5rem 0 0.25rem 0" }}>
            {projects.length}
          </p>
          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Industrial scopes published</span>
        </div>

        <div className="glass-panel" style={{ padding: "1.5rem" }}>
          <h4 style={{ color: "var(--text-secondary)", marginBottom: "0.5rem", fontSize: "0.85rem", textTransform: "uppercase" }}>Total Applicants</h4>
          <p style={{ fontSize: "2rem", fontWeight: "bold", color: "var(--color-purple)", margin: "0.5rem 0 0.25rem 0" }}>
            {totalApplications}
          </p>
          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Submitted talent applications</span>
        </div>

        <div className="glass-panel" style={{ padding: "1.5rem" }}>
          <h4 style={{ color: "var(--text-secondary)", marginBottom: "0.5rem", fontSize: "0.85rem", textTransform: "uppercase" }}>Academy Training</h4>
          <p style={{ fontSize: "2rem", fontWeight: "bold", color: "var(--color-amber)", margin: "0.5rem 0 0.25rem 0" }}>
            {enrollments.length}
          </p>
          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Enrolled business courses</span>
        </div>
      </div>

      {/* Main Split Layout */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "2rem", alignItems: "start" }}>
        
        {/* Left Column: Quick Actions */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <h3 style={{ fontSize: "1.3rem", margin: "0 0 0.5rem 0" }}>Quick Actions</h3>
          
          <div className="glass-panel" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
              <span style={{ fontSize: "1.5rem" }}>📁</span>
              <div>
                <h4 style={{ fontSize: "1.05rem", margin: "0 0 0.25rem 0" }}>Manage Project Postings</h4>
                <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", margin: 0 }}>
                  View applicants, run AI talent matches, and publish new industrial project scopes.
                </p>
              </div>
            </div>
            <button className="btn btn-primary" onClick={() => navigate("/partner/projects")} style={{ width: "100%" }}>
              Go to Projects Workspace
            </button>
          </div>

          <div className="glass-panel" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
              <span style={{ fontSize: "1.5rem" }}>💼</span>
              <div>
                <h4 style={{ fontSize: "1.05rem", margin: "0 0 0.25rem 0" }}>Hiring Desk</h4>
                <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", margin: 0 }}>
                  Review candidate submissions, track shortlist progress, and manage talent pipelines.
                </p>
              </div>
            </div>
            <button className="btn btn-success" onClick={() => navigate("/partner/hiring")} style={{ width: "100%" }}>
              Open Hiring Desk
            </button>
          </div>

          <div className="glass-panel" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
              <span style={{ fontSize: "1.5rem" }}>🎓</span>
              <div>
                <h4 style={{ fontSize: "1.05rem", margin: "0 0 0.25rem 0" }}>Entrepreneurship Academy</h4>
                <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", margin: 0 }}>
                  Access training materials, startup guides, and venture scaling courses.
                </p>
              </div>
            </div>
            <button className="btn btn-secondary" onClick={() => navigate("/partner/academy")} style={{ width: "100%" }}>
              Browse Academy Courses
            </button>
          </div>
        </div>

        {/* Right Column: Recent Postings */}
        <div className="glass-panel" style={{ padding: "1.5rem" }}>
          <h3 style={{ fontSize: "1.3rem", marginBottom: "1.5rem" }}>Recent Project Postings</h3>
          {loadingOverview ? (
            <p style={{ color: "var(--text-secondary)" }}>Loading recent projects...</p>
          ) : projects.length === 0 ? (
            <div style={{ textAlign: "center", padding: "2rem 0" }}>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: "1.25rem" }}>
                You haven't posted any projects yet.
              </p>
              <button className="btn btn-primary" onClick={() => navigate("/partner/projects", { state: { openPostModal: true } })}>
                + Post Your First Project
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {projects.slice(0, 3).map((proj) => (
                <div key={proj.id} style={{ padding: "1rem", border: "1px solid var(--glass-border)", borderRadius: "var(--radius-sm)", background: "rgba(0, 0, 0, 0.01)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.25rem" }}>
                    <h4 style={{ fontSize: "1rem", margin: 0 }}>{proj.title}</h4>
                    <span className="badge badge-cyan" style={{ fontSize: "0.65rem" }}>{proj.scope}</span>
                  </div>
                  <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: "0.25rem 0" }}>
                    Budget: <b>${proj.budget}</b>
                  </p>
                  <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", marginTop: "0.5rem" }}>
                    {proj.description}
                  </p>
                </div>
              ))}
              {projects.length > 3 && (
                <button className="btn btn-secondary" onClick={() => navigate("/partner/projects")} style={{ marginTop: "0.5rem", width: "100%" }}>
                  View All {projects.length} Projects
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
