import React, { useState, useEffect, useCallback } from "react";
import { useSupabase } from "../context/SupabaseContext";
import { PortfolioLinksSchema } from "@edgetalent/shared";

export default function TalentDashboard(): React.ReactElement {
  const { supabase, profile, signOut, fetchProfile } = useSupabase();
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false);

  const toggleSidebar = () => {
    if (window.innerWidth <= 768) {
      setIsMobileOpen(!isMobileOpen);
    } else {
      setIsSidebarCollapsed(!isSidebarCollapsed);
    }
  };

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
  const [githubUrl, setGithubUrl] = useState<string>("");
  const [linkedinUrl, setLinkedinUrl] = useState<string>("");
  const [websiteUrl, setWebsiteUrl] = useState<string>("");
  const [savingProfile, setSavingProfile] = useState<boolean>(false);
  const [profileMsg, setProfileMsg] = useState<string>("");

  // Sync form inputs with profile updates (e.g. after AI analysis updates context)
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setBio(profile.bio || "");
      const links = profile.portfolio_links || {};
      setGithubUrl(links.github || "");
      setLinkedinUrl(links.linkedin || "");
      setWebsiteUrl(links.website || "");
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
      const payloadLinks = {
        github: githubUrl.trim(),
        linkedin: linkedinUrl.trim(),
        website: websiteUrl.trim()
      };

      // Validate portfolio links structure with Zod
      const validation = PortfolioLinksSchema.safeParse(payloadLinks);
      if (!validation.success) {
        throw new Error("Invalid URL format. Links must start with http:// or https://");
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
    <div className="dashboard-layout">
      {/* Backdrop for mobile drawer */}
      <div className={`sidebar-overlay ${isMobileOpen ? "active" : ""}`} onClick={() => setIsMobileOpen(false)} />

      {/* Sidebar Navigation */}
      <aside className={`sidebar ${isSidebarCollapsed ? "collapsed" : ""} ${isMobileOpen ? "open" : ""}`}>
        <div className="sidebar-brand">
          <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontSize: "1.5rem" }}>⚡</span>
            <span className="sidebar-brand-text">EdgeTalent</span>
          </span>
          {isMobileOpen && (
            <button className="hamburger-btn" onClick={() => setIsMobileOpen(false)} style={{ padding: "0.25rem" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          )}
        </div>

        <div className="sidebar-menu">
          {[
            { id: "overview", label: "Overview", icon: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="9" />
                <rect x="14" y="3" width="7" height="5" />
                <rect x="14" y="12" width="7" height="9" />
                <rect x="3" y="16" width="7" height="5" />
              </svg>
            )},
            { id: "analyzer", label: "AI Skill-Gap", icon: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            )},
            { id: "upskilling", label: "Upskilling", icon: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                <path d="M6 12.5V16a6 6 0 0 0 12 0v-3.5" />
              </svg>
            )},
            { id: "marketplace", label: "Marketplace", icon: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
              </svg>
            )},
            { id: "profile", label: "My Profile", icon: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            )}
          ].map((tab) => (
            <button
              key={tab.id}
              className={`sidebar-menu-btn ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => {
                setActiveTab(tab.id);
                setIsMobileOpen(false);
              }}
              title={tab.label}
            >
              {tab.icon}
              <span className="sidebar-menu-label">{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="sidebar-footer">
          <div className="sidebar-user-card">
            <div className="sidebar-user-avatar">
              {(profile?.full_name || "T")[0].toUpperCase()}
            </div>
            <div className="sidebar-user-info">
              <span className="sidebar-user-name">{profile?.full_name || "Talent Member"}</span>
              <span className="sidebar-user-role">Talent</span>
            </div>
          </div>
          <button className="btn btn-secondary sidebar-signout-btn" onClick={signOut} title="Sign Out">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="dashboard-main">
        <header className="dashboard-header">
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <button className="hamburger-btn" onClick={toggleSidebar}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
            <h2 className="dashboard-header-title">
              {activeTab === "overview" && "Overview"}
              {activeTab === "analyzer" && "AI Skill-Gap"}
              {activeTab === "upskilling" && "Upskilling Hub"}
              {activeTab === "marketplace" && "Project Marketplace"}
              {activeTab === "profile" && "My Profile"}
            </h2>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
            <div style={{ textAlign: "right" }} className="header-user-info">
              <div style={{ fontSize: "0.85rem", fontWeight: "600" }}>{profile?.full_name || "Talent Member"}</div>
              <span className="badge badge-emerald" style={{ fontSize: "0.6rem", padding: "0.1rem 0.4rem" }}>Talent</span>
            </div>
            <div className="avatar-badge" style={{ width: "32px", height: "32px", fontSize: "0.85rem", margin: 0 }}>
              {(profile?.full_name || "T")[0].toUpperCase()}
            </div>
          </div>
        </header>

        <main className="dashboard-content">
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

                  <div className="collapsible-details">
                    <details>
                      <summary className="collapsible-summary">
                        <span>Add Assessment Answers (Optional)</span>
                        <span style={{ fontSize: "0.8rem", opacity: 0.8 }}>▼</span>
                      </summary>
                      <div className="collapsible-content">
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Technical Quiz/Assessment Answers</label>
                          <textarea
                            className="form-input"
                            style={{ height: "80px", resize: "none" }}
                            placeholder="Describe your answers to any quiz, coding tasks, or assessments..."
                            value={quizAnswers}
                            onChange={(e) => setQuizAnswers(e.target.value)}
                          />
                        </div>
                      </div>
                    </details>
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
                Manually update your name, biography, and web portfolio links.
              </p>

              {profileMsg && (
                <div className={`badge ${profileMsg.startsWith("Error") || profileMsg.startsWith("Invalid") ? "badge-rose" : "badge-emerald"}`} style={{ display: "block", padding: "0.8rem", textAlign: "center", marginBottom: "1.5rem" }}>
                  {profileMsg}
                </div>
              )}

              <form onSubmit={handleSaveProfile}>
                <div className="form-group">
                  <label>Full Name</label>
                  <input type="text" className="form-input" placeholder="Your Name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                </div>

                <div className="form-group">
                  <label>Biography Summary</label>
                  <textarea className="form-input" style={{ height: "100px" }} placeholder="Tell us about yourself..." value={bio} onChange={(e) => setBio(e.target.value)} />
                </div>

                <div className="form-group">
                  <label>GitHub Profile URL</label>
                  <input type="url" className="form-input" placeholder="https://github.com/your-username" value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} />
                </div>

                <div className="form-group">
                  <label>LinkedIn Profile URL</label>
                  <input type="url" className="form-input" placeholder="https://linkedin.com/in/your-profile" value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} />
                </div>

                <div className="form-group">
                  <label>Personal Website URL</label>
                  <input type="url" className="form-input" placeholder="https://yourportfolio.com" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} />
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: "1rem" }} disabled={savingProfile}>
                  {savingProfile ? "Saving Details..." : "Update Profile"}
                </button>
              </form>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
