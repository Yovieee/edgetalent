import React, { useState, useEffect } from "react";
import { useSupabase } from "../../context/SupabaseContext";

export default function TalentOverview(): React.ReactElement {
  const { supabase, profile } = useSupabase();
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadOverview = async () => {
      if (!profile?.id) return;
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("applications")
          .select("*, projects(*, profiles(full_name, email))")
          .eq("talent_id", profile.id);
        if (!error && data) setApplications(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadOverview();
  }, [profile?.id, supabase]);

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1.5rem" }}>
        <div className="glass-panel" style={{ padding: "1.5rem" }}>
          <h4 style={{ color: "var(--text-secondary)", marginBottom: "0.5rem", fontSize: "0.85rem", textTransform: "uppercase" }}>Current Skills</h4>
          <p style={{ fontSize: "1.5rem", fontWeight: "bold", color: "var(--color-cyan)" }}>
            {profile?.skills?.length || 0} Verified
          </p>
        </div>
        <div className="glass-panel" style={{ padding: "1.5rem" }}>
          <h4 style={{ color: "var(--text-secondary)", marginBottom: "0.5rem", fontSize: "0.85rem", textTransform: "uppercase" }}>Identified Skill Gaps</h4>
          <p style={{ fontSize: "1.5rem", fontWeight: "bold", color: "var(--color-rose)" }}>
            {profile?.skill_gaps?.length || 0} Gaps
          </p>
        </div>
        <div className="glass-panel" style={{ padding: "1.5rem" }}>
          <h4 style={{ color: "var(--text-secondary)", marginBottom: "0.5rem", fontSize: "0.85rem", textTransform: "uppercase" }}>Applications Submitted</h4>
          <p style={{ fontSize: "1.5rem", fontWeight: "bold", color: "var(--color-purple)" }}>
            {applications.length} Active
          </p>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: "2rem" }}>
        <h3 style={{ marginBottom: "1.5rem" }}>My Applications</h3>
        {loading ? (
          <p style={{ color: "var(--text-secondary)" }}>Loading applications...</p>
        ) : applications.length === 0 ? (
          <p style={{ color: "var(--text-secondary)" }}>No applications submitted yet. Browse jobs in Job Match!</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {applications.map((app) => (
              <div key={app.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--glass-border)", paddingBottom: "1rem" }}>
                <div>
                  <h4 style={{ fontSize: "1.1rem" }}>{app.projects?.title}</h4>
                  <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                    Applied on {new Date(app.applied_at).toLocaleDateString()}
                  </p>
                </div>
                <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                  {app.match_percentage && (
                    <span className="badge badge-cyan">{app.match_percentage}% AI Match</span>
                  )}
                  <span className={`badge ${
                    app.status === "accepted" ? "badge-emerald" : 
                    app.status === "rejected" ? "badge-rose" : 
                    app.status === "shortlisted" ? "badge-amber" : "badge-purple"
                  }`}>{app.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
