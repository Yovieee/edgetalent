import React, { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { useSupabase } from "../../context/SupabaseContext";
import { ProjectSchema } from "@edgetalent/shared";
import { X } from "lucide-react";

export default function PartnerProjects(): React.ReactElement {
  const { supabase, profile } = useSupabase();
  const location = useLocation();

  const [projects, setProjects] = useState<any[]>([]);
  const [totalApplications, setTotalApplications] = useState<number>(0);
  const [loadingOverview, setLoadingOverview] = useState<boolean>(true);

  const [expandedProjectId, setExpandedProjectId] = useState<string>("");
  const [matchedTalents, setMatchedTalents] = useState<any[]>([]);
  const [loadingTalents, setLoadingTalents] = useState<boolean>(false);
  const [retryingProjectId, setRetryingProjectId] = useState<string>("");

  // Post Modal states
  const [showPostModal, setShowPostModal] = useState<boolean>(false);
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [requiredSkills, setRequiredSkills] = useState<string>(" ");
  const [budget, setBudget] = useState<string>("");
  const [scope, setScope] = useState<"short-term" | "medium-term" | "long-term">("short-term");
  const [posting, setPosting] = useState<boolean>(false);
  const [portalMsg, setPortalMsg] = useState<string>("");

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

  const loadMatches = useCallback(async (projId: string) => {
    if (!projId) return;
    setLoadingTalents(true);
    setMatchedTalents([]);
    try {
      const { data, error } = await supabase.rpc("match_talents_for_project", {
        p_project_id: projId,
        p_match_limit: 10
      });
      if (!error && data) {
        setMatchedTalents(data);
      } else {
        console.error(error);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingTalents(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  useEffect(() => {
    if (expandedProjectId) {
      loadMatches(expandedProjectId);
    }
  }, [expandedProjectId, loadMatches]);

  useEffect(() => {
    if (location.state?.openPostModal) {
      setShowPostModal(true);
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const handlePostProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileId) return;
    setPosting(true);
    setPortalMsg("");

    try {
      const skillsArray = requiredSkills
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      const budgetNum = budget ? parseFloat(budget) : null;

      const projectPayload = {
        partner_id: profileId,
        title,
        description,
        required_skills: skillsArray,
        budget: budgetNum,
        scope
      };

      const validation = ProjectSchema.safeParse(projectPayload);
      if (!validation.success) {
        throw new Error(validation.error.errors[0].message);
      }

      const { error: insertErr } = await supabase
        .from("projects")
        .insert(validation.data)
        .select()
        .single();

      if (insertErr) throw insertErr;

      setPortalMsg("Project posted successfully with vector embeddings!");
      setTitle("");
      setDescription("");
      setRequiredSkills("");
      setBudget("");
      
      await loadOverview();

      setTimeout(() => {
        setShowPostModal(false);
        setPortalMsg("");
      }, 1500);
    } catch (err: any) {
      setPortalMsg("Error: " + err.message);
    } finally {
      setPosting(false);
    }
  };

  const handleGenerateEmbedding = async (projectId: string) => {
    setRetryingProjectId(projectId);
    try {
      const { error: invokeErr } = await supabase.functions.invoke(
        "generate-project-embeddings",
        {
          body: { projectId }
        }
      );

      if (invokeErr) {
        throw new Error(invokeErr.message || "Failed to generate embedding vector.");
      }

      alert("Vector embedding generated successfully!");
      await loadOverview();
    } catch (err: any) {
      console.error(err);
      alert("Embedding generation failed: " + err.message);
    } finally {
      setRetryingProjectId("");
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem" }}>
        <div className="glass-panel" style={{ padding: "1.5rem" }}>
          <h4 style={{ color: "var(--text-secondary)", marginBottom: "0.5rem", fontSize: "0.85rem", textTransform: "uppercase" }}>Active Projects</h4>
          <p style={{ fontSize: "2rem", fontWeight: "bold", color: "var(--color-cyan)", margin: 0 }}>
            {projects.length} Posted
          </p>
        </div>
        <div className="glass-panel" style={{ padding: "1.5rem" }}>
          <h4 style={{ color: "var(--text-secondary)", marginBottom: "0.5rem", fontSize: "0.85rem", textTransform: "uppercase" }}>Total Applicants</h4>
          <p style={{ fontSize: "2rem", fontWeight: "bold", color: "var(--color-purple)", margin: 0 }}>
            {totalApplications} Submissions
          </p>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: "2rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
          <h3 style={{ margin: 0 }}>My Project Postings</h3>
          <button
            className="btn btn-primary"
            onClick={() => {
              setPortalMsg("");
              setShowPostModal(true);
            }}
          >
            + Post New Project
          </button>
        </div>
        {loadingOverview ? (
          <p style={{ color: "var(--text-secondary)" }}>Loading overview...</p>
        ) : projects.length === 0 ? (
          <p style={{ color: "var(--text-secondary)" }}>No projects posted. Click "+ Post New Project" above to publish a deliverables scope.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {projects.map((proj) => {
              const isExpanded = expandedProjectId === proj.id;
              return (
                <div key={proj.id} className="glass-panel" style={{ padding: "1.5rem", marginBottom: "1rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                        <h4 style={{ fontSize: "1.2rem", margin: 0 }}>{proj.title}</h4>
                        {!proj.embedding && (
                          <span className="badge badge-rose" style={{ fontSize: "0.65rem", padding: "0.15rem 0.5rem" }}>AI Inactive</span>
                        )}
                      </div>
                      <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", margin: "0.25rem 0" }}>
                        Scope: <b>{proj.scope}</b> | Budget: <b>${proj.budget}</b>
                      </p>
                      <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>
                        {proj.description}
                      </p>
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                      {!proj.embedding ? (
                        <button 
                          className="btn btn-warning" 
                          disabled={retryingProjectId === proj.id}
                          onClick={() => handleGenerateEmbedding(proj.id)}
                          style={{ fontSize: "0.85rem", padding: "0.5rem 1rem" }}
                        >
                          {retryingProjectId === proj.id ? "Activating AI..." : "Activate AI Matching"}
                        </button>
                      ) : (
                        <button 
                          className={`btn ${isExpanded ? "btn-secondary" : "btn-primary"}`}
                          onClick={() => setExpandedProjectId(isExpanded ? "" : proj.id)}
                        >
                          {isExpanded ? "Hide Talent Matches" : "Find Talent Matches"}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Inline Talent Matches */}
                  {isExpanded && (
                    <div className="expandable-section" style={{ marginTop: "1.5rem", borderTop: "1px solid var(--glass-border)", paddingTop: "1.5rem" }}>
                      <h5 style={{ fontSize: "1rem", color: "var(--color-cyan)", marginBottom: "1rem", fontWeight: "600" }}>
                        AI Talent Recommendations
                      </h5>
                      
                      {loadingTalents ? (
                        <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                          Running semantic vector matches against talent profiles...
                        </p>
                      ) : matchedTalents.length === 0 ? (
                        <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                          No profiles matched with high similarity. Ensure talent members have analyzed their profiles!
                        </p>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "0.5rem" }}>
                          {matchedTalents.map((talent) => (
                            <div key={talent.talent_id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255, 255, 255, 0.02)", border: "1px solid var(--glass-border)", borderRadius: "var(--radius-sm)", padding: "1rem" }}>
                              <div style={{ flex: 1, marginRight: "1.5rem" }}>
                                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.25rem" }}>
                                  <h6 style={{ fontSize: "1rem", margin: 0, fontWeight: "600" }}>{talent.full_name}</h6>
                                  {talent.similarity !== null && (
                                    <span className="badge badge-cyan" style={{ fontSize: "0.65rem" }}>{Math.round(talent.similarity * 100)}% Match</span>
                                  )}
                                </div>
                                <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>{talent.bio}</p>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem" }}>
                                  {talent.skills.map((skill: string, idx: number) => (
                                    <span key={idx} className="badge badge-emerald" style={{ fontSize: "0.65rem" }}>{skill}</span>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <a href={`mailto:${talent.email}`} className="btn btn-primary" style={{ padding: "0.5rem 1rem", fontSize: "0.85rem", textDecoration: "none" }}>
                                  Contact
                                </a>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Post Project Modal */}
      {showPostModal && (
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
            zIndex: 999,
          }}
        >
          <div className="glass-panel animate-fade-in" style={{ width: "90%", maxWidth: "600px", padding: "2.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h3 style={{ margin: 0 }}>Publish Industrial Project</h3>
              <button
                className="hamburger-btn"
                onClick={() => {
                  setShowPostModal(false);
                  setPortalMsg("");
                }}
                style={{ padding: "0.25rem", cursor: "pointer", border: "none", background: "transparent", color: "var(--text-primary)" }}
              >
                <X size={20} />
              </button>
            </div>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
              Add technical deliverables, required skills, and scope. This triggers our embeddings Deno agent.
            </p>

            {portalMsg && (
              <div className={`badge ${portalMsg.startsWith("Error") ? "badge-rose" : "badge-emerald"}`} style={{ display: "block", padding: "0.8rem", textAlign: "center", marginBottom: "1.5rem" }}>
                {portalMsg}
              </div>
            )}

            <form onSubmit={handlePostProject}>
              <div className="form-group" style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600" }}>Project Title *</label>
                <input type="text" className="form-input" placeholder="e.g. EdgeTalent Upgrades" value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>

              <div className="form-group" style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600" }}>Description & Scope *</label>
                <textarea className="form-input" style={{ height: "100px" }} placeholder="Describe deliverables and parameters..." value={description} onChange={(e) => setDescription(e.target.value)} required />
              </div>

              <div className="form-group" style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600" }}>Required Skills (comma-separated) *</label>
                <input type="text" className="form-input" placeholder="React, TypeScript, Supabase, Deno" value={requiredSkills} onChange={(e) => setRequiredSkills(e.target.value)} required />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
                <div className="form-group">
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600" }}>Budget ($)</label>
                  <input type="number" className="form-input" placeholder="5000" value={budget} onChange={(e) => setBudget(e.target.value)} />
                </div>

                <div className="form-group">
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600" }}>Scope</label>
                  <select className="form-select" value={scope} onChange={(e) => setScope(e.target.value as any)}>
                    <option value="short-term">Short-term</option>
                    <option value="medium-term">Medium-term</option>
                    <option value="long-term">Long-term</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem" }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                  onClick={() => {
                    setShowPostModal(false);
                    setPortalMsg("");
                  }}
                  disabled={posting}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={posting}>
                  {posting ? "Publishing Project..." : "Post Project Scope"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
