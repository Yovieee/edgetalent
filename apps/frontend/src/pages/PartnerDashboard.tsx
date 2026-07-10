import React, { useState, useEffect, useCallback } from "react";
import { useSupabase } from "../context/SupabaseContext";
import { ProjectSchema } from "@edgetalent/shared";

export default function PartnerDashboard(): React.ReactElement {
  const { supabase, profile, signOut } = useSupabase();
  const [activeTab, setActiveTab] = useState<string>("overview");

  // Overview states
  const [projects, setProjects] = useState<any[]>([]);
  const [loadingOverview, setLoadingOverview] = useState<boolean>(true);
  const [totalApplications, setTotalApplications] = useState<number>(0);

  // Portal states
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [requiredSkills, setRequiredSkills] = useState<string>("");
  const [budget, setBudget] = useState<string>("");
  const [scope, setScope] = useState<"short-term" | "medium-term" | "long-term">("medium-term");
  const [posting, setPosting] = useState<boolean>(false);
  const [portalMsg, setPortalMsg] = useState<string>("");
  const [retryingProjectId, setRetryingProjectId] = useState<string>("");

  // AI Matcher states
  const [expandedProjectId, setExpandedProjectId] = useState<string>("");
  const [matchedTalents, setMatchedTalents] = useState<any[]>([]);
  const [loadingTalents, setLoadingTalents] = useState<boolean>(false);

  // Load overview details
  const loadOverview = useCallback(async () => {
    if (!profile) return;
    setLoadingOverview(true);
    try {
      const { data: projs, error: projErr } = await supabase
        .from("projects")
        .select("*")
        .eq("partner_id", profile.id);

      if (!projErr && projs) {
        setProjects(projs);
        if (projs.length > 0) {
          // Get application counts for partner's projects
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
  }, [profile, supabase]);

  // Run AI Talent Matching via RPC
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
    } else {
      setMatchedTalents([]);
    }
  }, [expandedProjectId, loadMatches]);

  // Post project
  const handlePostProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setPosting(true);
    setPortalMsg("");

    try {
      const skillsArray = requiredSkills
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      const budgetNum = budget ? parseFloat(budget) : null;

      // Zod Validation for Project Submission
      const projectPayload = {
        partner_id: profile.id,
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

      // Insert project
      const { data: project, error: insertErr } = await supabase
        .from("projects")
        .insert(validation.data)
        .select()
        .single();

      if (insertErr) throw insertErr;

      setPortalMsg("Project saved! Initiating vector embedding generation...");

      // Call Edge Function to generate embeddings using standard supabase functions invoke
      const { error: invokeErr } = await supabase.functions.invoke(
        "generate-project-embeddings",
        {
          body: { projectId: project.id }
        }
      );

      if (invokeErr) {
        throw new Error(invokeErr.message || "Failed to generate embedding vector.");
      }

      setPortalMsg("Project posted successfully with vector embeddings!");
      setTitle("");
      setDescription("");
      setRequiredSkills("");
      setBudget("");
      
      // Reload overview
      await loadOverview();
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
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "1rem 2rem 2rem 2rem" }}>
      {/* Navigation Bar */}
      <nav className="navbar animate-fade-in">
        <div className="navbar-brand">
          <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontSize: "1.75rem" }}>⚡</span> EdgeTalent
          </span>
        </div>
        
        <div className="navbar-tabs">
          {[
            { id: "overview", label: "Projects Dashboard" },
            { id: "portal", label: "Post New Project" }
          ].map((tab) => (
            <button
              key={tab.id}
              className={`nav-tab ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => {
                setActiveTab(tab.id);
                setExpandedProjectId("");
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="user-profile-menu">
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "0.9rem", fontWeight: "600" }}>{profile?.full_name || "Enterprise Partner"}</div>
            <span className="badge badge-cyan" style={{ fontSize: "0.65rem", padding: "0.15rem 0.5rem", marginTop: "0.2rem" }}>Partner</span>
          </div>
          <div className="avatar-badge">
            {(profile?.full_name || "P")[0].toUpperCase()}
          </div>
          <button className="btn btn-secondary" style={{ padding: "0.5rem 1rem", fontSize: "0.85rem" }} onClick={signOut}>
            Sign Out
          </button>
        </div>
      </nav>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem" }}>
            <div className="glass-panel" style={{ padding: "1.5rem" }}>
              <h4 style={{ color: "var(--text-secondary)", marginBottom: "0.5rem", fontSize: "0.85rem", textTransform: "uppercase" }}>Active Projects</h4>
              <p style={{ fontSize: "2rem", fontWeight: "bold", color: "var(--color-cyan)" }}>
                {projects.length} Posted
              </p>
            </div>
            <div className="glass-panel" style={{ padding: "1.5rem" }}>
              <h4 style={{ color: "var(--text-secondary)", marginBottom: "0.5rem", fontSize: "0.85rem", textTransform: "uppercase" }}>Total Applicants</h4>
              <p style={{ fontSize: "2rem", fontWeight: "bold", color: "var(--color-purple)" }}>
                {totalApplications} Submissions
              </p>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: "2rem" }}>
            <h3 style={{ marginBottom: "1.5rem" }}>My Project Postings</h3>
            {loadingOverview ? (
              <p style={{ color: "var(--text-secondary)" }}>Loading overview...</p>
            ) : projects.length === 0 ? (
              <p style={{ color: "var(--text-secondary)" }}>No projects posted. Head to the Project Portal to publish a deliverables scope.</p>
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
                        <div className="expandable-section">
                          <h5 style={{ fontSize: "1rem", color: "var(--color-cyan)", marginBottom: "1rem" }}>
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
                                      <h6 style={{ fontSize: "1rem", margin: 0 }}>{talent.full_name}</h6>
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
                                    <a href={`mailto:${talent.email}`} className="btn btn-primary" style={{ padding: "0.5rem 1rem", fontSize: "0.85rem" }}>
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
        </div>
      )}

      {/* Project Manager Portal */}
      {activeTab === "portal" && (
        <div className="animate-fade-in glass-panel" style={{ padding: "2rem", maxWidth: "600px", margin: "0 auto" }}>
          <h3>Publish Industrial Project</h3>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
            Add technical deliverables, required skills, and scope. This triggers our embeddings Deno agent.
          </p>

          {portalMsg && (
            <div className={`badge ${portalMsg.startsWith("Error") ? "badge-rose" : "badge-emerald"}`} style={{ display: "block", padding: "0.8rem", textAlign: "center", marginBottom: "1.5rem" }}>
              {portalMsg}
            </div>
          )}

          <form onSubmit={handlePostProject}>
            <div className="form-group">
              <label>Project Title</label>
              <input type="text" className="form-input" placeholder="e.g. EdgeTalent Upgrades" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>

            <div className="form-group">
              <label>Description & Scope</label>
              <textarea className="form-input" style={{ height: "100px" }} placeholder="Describe deliverables and parameters..." value={description} onChange={(e) => setDescription(e.target.value)} required />
            </div>

            <div className="form-group">
              <label>Required Skills (comma-separated)</label>
              <input type="text" className="form-input" placeholder="React, TypeScript, Supabase, Deno" value={requiredSkills} onChange={(e) => setRequiredSkills(e.target.value)} required />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div className="form-group">
                <label>Budget ($)</label>
                <input type="number" className="form-input" placeholder="5000" value={budget} onChange={(e) => setBudget(e.target.value)} />
              </div>

              <div className="form-group">
                <label>Scope</label>
                <select className="form-select" value={scope} onChange={(e) => setScope(e.target.value as any)}>
                  <option value="short-term">Short-term</option>
                  <option value="medium-term">Medium-term</option>
                  <option value="long-term">Long-term</option>
                </select>
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: "1rem" }} disabled={posting}>
              {posting ? "Publishing Project..." : "Post Project Scope"}
            </button>
          </form>
        </div>
      )}



    </div>
  );
}
