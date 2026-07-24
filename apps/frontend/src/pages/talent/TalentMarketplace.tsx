import React, { useState, useEffect, useCallback } from "react";
import { useSupabase } from "../../context/SupabaseContext";

export default function TalentMarketplace(): React.ReactElement {
  const { supabase, profile } = useSupabase();
  const [matchedProjects, setMatchedProjects] = useState<any[]>([]);
  const [loadingProjects, setLoadingProjects] = useState<boolean>(true);
  const [applyStates, setApplyStates] = useState<Record<string, "idle" | "applying" | "applied">>({});

  const profileId = profile?.id;
  const skillsEmbedding = profile?.skills_embedding;

  const loadProjects = useCallback(async () => {
    if (!profileId) return;
    setLoadingProjects(true);
    try {
      if (skillsEmbedding) {
        const { data, error } = await supabase.rpc("match_projects_for_talent", {
          p_talent_id: profileId,
          p_match_limit: 10
        });
        if (!error && data) {
          setMatchedProjects(data);
        } else {
          console.error("RPC Error:", error);
        }
      } else {
        const { data, error } = await supabase
          .from("projects")
          .select("*");
        if (!error && data) {
          const formatted = data.map((p: any) => ({
            project_id: p.id,
            title: p.title,
            description: p.description,
            budget: p.budget,
            scope: p.scope,
            required_skills: p.required_skills,
            similarity: null
          }));
          setMatchedProjects(formatted);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingProjects(false);
    }
  }, [profileId, skillsEmbedding, supabase]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    const fetchAppliedProjects = async () => {
      if (!profileId) return;
      try {
        const { data, error } = await supabase
          .from("applications")
          .select("project_id")
          .eq("talent_id", profileId);
        if (!error && data) {
          const states: Record<string, "idle" | "applying" | "applied"> = {};
          data.forEach((app: any) => {
            states[app.project_id] = "applied";
          });
          setApplyStates(states);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchAppliedProjects();
  }, [profileId, supabase]);

  const applyForProject = async (projectId: string, similarity: number | null) => {
    if (!profileId) return;
    setApplyStates((prev) => ({ ...prev, [projectId]: "applying" }));

    try {
      const matchPercentage = similarity !== null ? Math.max(0, Math.min(100, Math.round(similarity * 100))) : null;
      const matchBreakdown = {
        applied_at: new Date().toISOString(),
        score_method: similarity !== null ? "pgvector cosine similarity" : "manual search"
      };

      const { error } = await supabase
        .from("applications")
        .insert({
          project_id: projectId,
          talent_id: profileId,
          match_percentage: matchPercentage,
          match_breakdown: matchBreakdown
        });

      if (error) throw error;

      setApplyStates((prev) => ({ ...prev, [projectId]: "applied" }));
    } catch (err: any) {
      console.error(err);
      alert("Failed to submit application: " + err.message);
      setApplyStates((prev) => ({ ...prev, [projectId]: "idle" }));
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="glass-panel" style={{ padding: "2rem", marginBottom: "2rem" }}>
        <h3>Industrial Projects & Placement</h3>
        <p style={{ color: "var(--text-secondary)" }}>
          {profile?.skills_embedding 
            ? "Showing matching projects ranked by AI semantic vector similarity to your skills." 
            : "Complete the AI Skill-Gap Analyzer to unlock vector similarity match scoring!"}
        </p>
      </div>

      {loadingProjects ? (
        <p style={{ color: "var(--text-secondary)" }}>Matching portfolios with job demands...</p>
      ) : matchedProjects.length === 0 ? (
        <p style={{ color: "var(--text-secondary)" }}>No projects available in Job Match currently.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {matchedProjects.map((project) => (
            <div key={project.project_id} className="glass-panel" style={{ padding: "2rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ flex: 1, marginRight: "2rem" }}>
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.5rem" }}>
                  <h4 style={{ fontSize: "1.3rem" }}>{project.title}</h4>
                  {project.similarity !== null && (
                    <span className="badge badge-cyan">{Math.round(project.similarity * 100)}% Match</span>
                  )}
                </div>
                <p style={{ fontSize: "0.95rem", color: "var(--text-secondary)", marginBottom: "1rem" }}>{project.description}</p>
                <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
                  <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Scope: <b>{project.scope}</b></span>
                  <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Budget: <b>{project.budget !== null && project.budget !== undefined ? `$${project.budget}` : "Negotiable"}</b></span>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem" }}>
                  {project.required_skills.map((skill: string, idx: number) => (
                    <span key={idx} className="badge badge-purple" style={{ fontSize: "0.7rem" }}>{skill}</span>
                  ))}
                </div>
              </div>
              <div>
                <button
                  className={`btn ${applyStates[project.project_id] === "applied" ? "btn-secondary" : "btn-primary"}`}
                  disabled={applyStates[project.project_id] === "applying" || applyStates[project.project_id] === "applied"}
                  onClick={() => applyForProject(project.project_id, project.similarity)}
                >
                  {applyStates[project.project_id] === "applying" ? "Applying..." : 
                   applyStates[project.project_id] === "applied" ? "Applied" : "Apply"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
