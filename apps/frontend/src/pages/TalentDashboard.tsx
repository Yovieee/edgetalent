import React, { useState, useEffect, useCallback } from "react";
import { useSupabase } from "../context/SupabaseContext";
import { PortfolioLinksSchema } from "@edgetalent/shared";

export default function TalentDashboard(): React.ReactElement {
  const { supabase, profile, signOut, fetchProfile } = useSupabase();
  const [activeTab, setActiveTab] = useState<string>("overview");

  // Overview states
  const [applications, setApplications] = useState<any[]>([]);
  const [loadingOverview, setLoadingOverview] = useState<boolean>(true);

  // AI Analyzer states
  const [cvText, setCvText] = useState<string>("");
  const [targetRole, setTargetRole] = useState<string>("Fullstack Developer");
  const [quizAnswers, setQuizAnswers] = useState<string>("");
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [analyzerError, setAnalyzerError] = useState<string>("");

  // Clean profile values safely
  const skillGaps = profile?.skill_gaps;
  const skillsEmbedding = profile?.skills_embedding;
  const profileId = profile?.id;

  // Upskilling Hub states
  const [courses, setCourses] = useState<any[]>([]);
  const [loadingCourses, setLoadingCourses] = useState<boolean>(true);

  // Marketplace states
  const [matchedProjects, setMatchedProjects] = useState<any[]>([]);
  const [loadingProjects, setLoadingProjects] = useState<boolean>(true);
  const [applyStates, setApplyStates] = useState<Record<string, "idle" | "applying" | "applied">>({});

  // Profile Builder states
  const [fullName, setFullName] = useState<string>(profile?.full_name || "");
  const [bio, setBio] = useState<string>(profile?.bio || "");
  const [portfolioLinks, setPortfolioLinks] = useState<string>(
    JSON.stringify(profile?.portfolio_links || { github: "", linkedin: "", website: "" }, null, 2)
  );
  const [savingProfile, setSavingProfile] = useState<boolean>(false);
  const [profileMsg, setProfileMsg] = useState<string>("");

  // Sync form inputs with profile updates (e.g. after AI analysis updates context)
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setBio(profile.bio || "");
      setPortfolioLinks(
        JSON.stringify(profile.portfolio_links || { github: "", linkedin: "", website: "" }, null, 2)
      );
    }
  }, [profile]);

  // Fetch overview/applications
  const loadOverview = useCallback(async () => {
    if (!profileId) return;
    setLoadingOverview(true);
    try {
      const { data, error } = await supabase
        .from("applications")
        .select("*, projects(*)")
        .eq("talent_id", profileId);
      if (!error && data) setApplications(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingOverview(false);
    }
  }, [profileId, supabase]);

  // Fetch courses matching skill gaps
  const loadCourses = useCallback(async () => {
    setLoadingCourses(true);
    try {
      let query = supabase.from("courses").select("*");
      // If user has skill gaps, query courses that teach those skills
      if (skillGaps && skillGaps.length > 0) {
        query = query.overlaps("skills_taught", skillGaps);
      }
      
      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        setCourses(data);
      } else {
        // Fallback: load all courses if none matched or if error occurred
        const { data: all } = await supabase.from("courses").select("*").limit(6);
        setCourses(all || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingCourses(false);
    }
  }, [skillGaps, supabase]);

  // Fetch matched projects using RPC vector search
  const loadProjects = useCallback(async () => {
    if (!profileId) return;
    setLoadingProjects(true);
    try {
      // Check if user has generated embeddings
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
        // If no embedding, fetch standard recent projects
        const { data, error } = await supabase
          .from("projects")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(10);
        if (!error && data) {
          // Normalize structure
          setMatchedProjects(
            data.map((p: any) => ({
              project_id: p.id,
              title: p.title,
              description: p.description,
              budget: p.budget,
              scope: p.scope,
              required_skills: p.required_skills,
              similarity: null
            }))
          );
        }
      }

      // Check existing applications to disable Apply buttons
      const { data: apps } = await supabase
        .from("applications")
        .select("project_id")
        .eq("talent_id", profileId);
      
      if (apps) {
        const states: Record<string, "applied"> = {};
        apps.forEach((a: any) => {
          states[a.project_id] = "applied";
        });
        setApplyStates(states);
      }

    } catch (e) {
      console.error(e);
    } finally {
      setLoadingProjects(false);
    }
  }, [profileId, skillsEmbedding, supabase]);

  useEffect(() => {
    if (activeTab === "overview") loadOverview();
    if (activeTab === "upskilling") loadCourses();
    if (activeTab === "marketplace") loadProjects();
  }, [activeTab, loadOverview, loadCourses, loadProjects]);

  // AI Gap Analyzer Request
  const runAIAnalysis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileId) return;
    setAnalyzing(true);
    setAnalyzerError("");
    setAnalysisResult(null);

    try {
      // Call Supabase Edge Function using standard supabase functions invoke
      const { data: result, error: invokeErr } = await supabase.functions.invoke(
        "analyze-skill-gap",
        {
          body: { cvText, targetRole, quizAnswers }
        }
      );

      if (invokeErr) {
        throw new Error(invokeErr.message || "Failed to analyze skills.");
      }

      setAnalysisResult(result);
      // Refresh local profile context
      await fetchProfile(profileId);
    } catch (err: any) {
      setAnalyzerError(err.message || "An error occurred during analysis.");
    } finally {
      setAnalyzing(false);
    }
  };

  // Submit project application
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

  // Save manual profile edits
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileId) return;
    setSavingProfile(true);
    setProfileMsg("");

    try {
      let parsedLinks = {};
      try {
        parsedLinks = JSON.parse(portfolioLinks);
      } catch {
        throw new Error("Portfolio links must be valid JSON.");
      }

      // Validate portfolio links structure with Zod
      const validation = PortfolioLinksSchema.safeParse(parsedLinks);
      if (!validation.success) {
        throw new Error("Invalid portfolio URLs. Ensure links begin with http:// or https://");
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName,
          bio,
          portfolio_links: validation.data,
          updated_at: new Date().toISOString()
        })
        .eq("id", profileId);

      if (error) throw error;
      setProfileMsg("Profile updated successfully!");
      await fetchProfile(profileId);
    } catch (err: any) {
      setProfileMsg("Error: " + err.message);
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem" }}>
      {/* Dashboard Header */}
      <header className="glass-panel animate-fade-in" style={{ padding: "1.5rem 2rem", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div>
          <h2 style={{ fontSize: "1.5rem", marginBottom: "0.25rem" }}>
            Hello, {profile?.full_name || "Talent Member"}
          </h2>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <span className="badge badge-emerald">Talent Partner</span>
            <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>{profile?.email}</span>
          </div>
        </div>
        <button className="btn btn-secondary" onClick={signOut}>
          Sign Out
        </button>
      </header>

      {/* Tabs Menu */}
      <div style={{ display: "flex", gap: "1rem", marginBottom: "2rem", overflowX: "auto" }}>
        {[
          { id: "overview", label: "Overview" },
          { id: "analyzer", label: "AI Skill-Gap Analyzer" },
          { id: "upskilling", label: "Upskilling Hub" },
          { id: "marketplace", label: "Marketplace" },
          { id: "profile", label: "Profile Builder" }
        ].map((tab) => (
          <button
            key={tab.id}
            className={`btn ${activeTab === tab.id ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setActiveTab(tab.id)}
            style={{ whiteSpace: "nowrap" }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Content */}
      {activeTab === "overview" && (
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
            {loadingOverview ? (
              <p style={{ color: "var(--text-secondary)" }}>Loading applications...</p>
            ) : applications.length === 0 ? (
              <p style={{ color: "var(--text-secondary)" }}>No applications submitted yet. Browse jobs in the Marketplace!</p>
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
      )}

      {/* AI Skill-Gap Analyzer */}
      {activeTab === "analyzer" && (
        <div className="animate-fade-in" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
          <div className="glass-panel" style={{ padding: "2rem" }}>
            <h3>AI Skill Gap Profiler</h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
              Upload your CV and specify your target technical role. Our OpenRouter-powered agent will compare your skills against industrial demands.
            </p>

            <form onSubmit={runAIAnalysis}>
              <div className="form-group">
                <label>Target Role</label>
                <select className="form-select" value={targetRole} onChange={(e) => setTargetRole(e.target.value)}>
                  <option value="Fullstack Developer">Fullstack Developer</option>
                  <option value="AI Engineer">AI Engineer</option>
                  <option value="Cloud Architect">Cloud Architect</option>
                  <option value="DevOps Specialist">DevOps Specialist</option>
                </select>
              </div>

              <div className="form-group">
                <label>CV / Resume Text</label>
                <textarea
                  className="form-input"
                  style={{ height: "150px", resize: "none" }}
                  placeholder="Paste your CV text here..."
                  value={cvText}
                  onChange={(e) => setCvText(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Technical Quiz/Assessment Answers (Optional)</label>
                <textarea
                  className="form-input"
                  style={{ height: "80px", resize: "none" }}
                  placeholder="Describe your answers to any quiz, coding tasks, or assessments..."
                  value={quizAnswers}
                  onChange={(e) => setQuizAnswers(e.target.value)}
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={analyzing}>
                {analyzing ? "Analyzing Profiles..." : "Start Analysis"}
              </button>
            </form>
          </div>

          <div className="glass-panel" style={{ padding: "2rem" }}>
            <h3>Analyzer Results</h3>
            {analyzing ? (
              <div style={{ padding: "3rem 0", textAlign: "center" }}>
                <p style={{ color: "var(--text-secondary)", marginBottom: "1rem" }}>OpenRouter is parsing details and generating vector embeddings...</p>
                <div className="badge badge-cyan">Connecting...</div>
              </div>
            ) : analyzerError ? (
              <div className="badge badge-rose" style={{ display: "block", padding: "1rem" }}>
                {analyzerError}
              </div>
            ) : analysisResult || profile?.skills_embedding ? (
              <div>
                <h4 style={{ color: "var(--color-cyan)", marginBottom: "0.5rem" }}>Analyzed Profile Bio</h4>
                <p style={{ fontSize: "0.95rem", lineHeight: "1.5", color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
                  {analysisResult?.bio || profile?.bio || "No bio summary generated."}
                </p>

                <h4 style={{ color: "var(--color-emerald)", marginBottom: "0.5rem" }}>Verified Skills</h4>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1.5rem" }}>
                  {(analysisResult?.skills || profile?.skills || []).map((skill: string, i: number) => (
                    <span key={i} className="badge badge-emerald">{skill}</span>
                  ))}
                </div>

                <h4 style={{ color: "var(--color-rose)", marginBottom: "0.5rem" }}>Skill Gaps Identified</h4>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                  {(analysisResult?.skill_gaps || profile?.skill_gaps || []).map((gap: string, i: number) => (
                    <span key={i} className="badge badge-rose">{gap}</span>
                  ))}
                </div>
              </div>
            ) : (
              <p style={{ color: "var(--text-secondary)" }}>Submit the form to generate your AI skill gap profile.</p>
            )}
          </div>
        </div>
      )}

      {/* Upskilling Hub */}
      {activeTab === "upskilling" && (
        <div className="animate-fade-in">
          <div className="glass-panel" style={{ padding: "2rem", marginBottom: "2rem" }}>
            <h3>Recommended Upskilling Paths</h3>
            <p style={{ color: "var(--text-secondary)" }}>
              Based on the AI Analyzer gaps in your profile, we recommend the following bootcamps and training courses.
            </p>
          </div>

          {loadingCourses ? (
            <p style={{ color: "var(--text-secondary)" }}>Matching courses with gaps...</p>
          ) : courses.length === 0 ? (
            <p style={{ color: "var(--text-secondary)" }}>No matching courses found. Check back later!</p>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "2rem" }}>
              {courses.map((course) => (
                <div key={course.id} className="glass-panel" style={{ padding: "2rem", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div>
                    <span className="badge badge-emerald" style={{ marginBottom: "1rem" }}>{course.provider}</span>
                    <h4 style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>{course.title}</h4>
                    <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "1.5rem" }}>{course.description}</p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem", marginBottom: "1.5rem" }}>
                      {course.skills_taught.map((skill: string, idx: number) => (
                        <span key={idx} className="badge badge-cyan" style={{ fontSize: "0.7rem" }}>{skill}</span>
                      ))}
                    </div>
                  </div>
                  {course.link && (
                    <a href={course.link} target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ width: "100%" }}>
                      Enroll / Visit Course
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Project & Job Marketplace */}
      {activeTab === "marketplace" && (
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
            <p style={{ color: "var(--text-secondary)" }}>No projects available in the marketplace currently.</p>
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
                      <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Budget: <b>${project.budget}</b></span>
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
      )}

      {/* Profile / CV Builder */}
      {activeTab === "profile" && (
        <div className="animate-fade-in glass-panel" style={{ padding: "2rem", maxWidth: "600px", margin: "0 auto" }}>
          <h3>Profile Builder</h3>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
            Manually update your name, biography, or portfolio link details.
          </p>

          {profileMsg && (
            <div className={`badge ${profileMsg.startsWith("Error") ? "badge-rose" : "badge-emerald"}`} style={{ display: "block", padding: "0.8rem", textAlign: "center", marginBottom: "1.5rem" }}>
              {profileMsg}
            </div>
          )}

          <form onSubmit={handleSaveProfile}>
            <div className="form-group">
              <label>Full Name</label>
              <input type="text" className="form-input" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            </div>

            <div className="form-group">
              <label>Biography Summary</label>
              <textarea className="form-input" style={{ height: "100px" }} value={bio} onChange={(e) => setBio(e.target.value)} />
            </div>

            <div className="form-group">
              <label>Portfolio Links (JSON Format)</label>
              <textarea className="form-input" style={{ height: "120px", fontFamily: "monospace" }} value={portfolioLinks} onChange={(e) => setPortfolioLinks(e.target.value)} />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={savingProfile}>
              {savingProfile ? "Saving Details..." : "Update Profile"}
            </button>
          </form>
        </div>
      )}

    </div>
  );
}
