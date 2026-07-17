import React, { useState, useEffect, useCallback } from "react";
import { useSupabase } from "../../context/SupabaseContext";

export default function AdminOverview(): React.ReactElement {
  const { supabase } = useSupabase();

  const [stats, setStats] = useState({
    usersCount: 0,
    talentCount: 0,
    partnerCount: 0,
    adminCount: 0,
    coursesCount: 0,
    projectsCount: 0,
    questionsCount: 0,
  });
  const [loadingStats, setLoadingStats] = useState<boolean>(true);

  const fetchStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const { data: profiles, error: pErr } = await supabase.from("profiles").select("role");
      const { count: cCount, error: cErr } = await supabase.from("courses").select("*", { count: "exact", head: true });
      const { count: prCount, error: prErr } = await supabase.from("projects").select("*", { count: "exact", head: true });
      const { count: qCount, error: qErr } = await supabase.from("quiz_questions").select("*", { count: "exact", head: true });

      if (pErr || cErr || prErr || qErr) {
        console.error("Error loading dashboard statistics:", { pErr, cErr, prErr, qErr });
        return;
      }

      if (profiles) {
        const talent = profiles.filter((p) => p.role === "talent").length;
        const partner = profiles.filter((p) => p.role === "partner").length;
        const admin = profiles.filter((p) => p.role === "admin").length;

        setStats({
          usersCount: profiles.length,
          talentCount: talent,
          partnerCount: partner,
          adminCount: admin,
          coursesCount: cCount || 0,
          projectsCount: prCount || 0,
          questionsCount: qCount || 0,
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingStats(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
      {loadingStats ? (
        <div style={{ textAlign: "center", padding: "4rem" }}>Loading stats...</div>
      ) : (
        <>
          {/* Stats Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.5rem" }}>
            {[
              { title: "Total Users", count: stats.usersCount, icon: "👥", color: "var(--color-purple)" },
              { title: "Registered Talents", count: stats.talentCount, icon: "💻", color: "var(--color-cyan)" },
              { title: "Partner Organizations", count: stats.partnerCount, icon: "🏢", color: "var(--color-emerald)" },
              { title: "Upskilling Courses", count: stats.coursesCount, icon: "🎓", color: "var(--color-amber)" },
              { title: "Active Projects", count: stats.projectsCount, icon: "💼", color: "var(--color-rose)" },
              { title: "Quiz Questions", count: stats.questionsCount, icon: "📝", color: "var(--color-purple)" },
            ].map((stat, idx) => (
              <div
                key={idx}
                className="glass-panel"
                style={{
                  padding: "1.5rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  borderLeft: `4px solid ${stat.color}`,
                }}
              >
                <div>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.5rem" }}>
                    {stat.title}
                  </p>
                  <h3 style={{ fontSize: "2rem", margin: 0 }}>{stat.count}</h3>
                </div>
                <span style={{ fontSize: "2.5rem", opacity: 0.8 }}>{stat.icon}</span>
              </div>
            ))}
          </div>

          {/* Developer / Admin Welcome Panel */}
          <div className="glass-panel" style={{ padding: "2.5rem", background: "var(--grad-dark)" }}>
            <h3 style={{ marginBottom: "1rem" }}>Welcome to the EdgeTalent Admin Console</h3>
            <p style={{ color: "var(--text-secondary)", lineHeight: "1.6", maxWidth: "800px" }}>
              As an administrator, you have complete read and write access to all databases. You can oversee
              assessment quizzes, introduce new upskilling hub resources, manage the corporate projects/job postings
              marketplace, and control user roles. Use the sidebar tabs to access specific tables and control options.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
