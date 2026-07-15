import React, { useState, useEffect, useCallback } from "react";
import { useSupabase } from "../context/SupabaseContext";
import { ProjectSchema } from "@edgetalent/shared";

export default function PartnerDashboard(): React.ReactElement {
  const { supabase, profile, signOut } = useSupabase();
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
  const [projects, setProjects] = useState<any[]>([]);
  const [loadingOverview, setLoadingOverview] = useState<boolean>(true);
  const [totalApplications, setTotalApplications] = useState<number>(0);

  // Portal states
  const [showPostModal, setShowPostModal] = useState<boolean>(false);
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

  // Course states
  const [courses, setCourses] = useState<any[]>([]);
  const [loadingCourses, setLoadingCourses] = useState<boolean>(false);

  // LMS/Enrollment states
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [activePlayingCourse, setActivePlayingCourse] = useState<any | null>(null);
  const [courseLessons, setCourseLessons] = useState<any[]>([]);
  const [loadingCourseLessons, setLoadingCourseLessons] = useState<boolean>(false);
  const [activeLessonIdx, setActiveLessonIdx] = useState<number>(0);
  const [allLessonsSummary, setAllLessonsSummary] = useState<Record<string, number>>({});

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

  // Fetch user enrollments
  const loadEnrollments = useCallback(async () => {
    if (!profile) return;
    try {
      const { data, error } = await supabase
        .from("course_enrollments")
        .select("*")
        .eq("user_id", profile.id);
      if (!error && data) {
        setEnrollments(data);
      }
    } catch (e) {
      console.error(e);
    }
  }, [profile, supabase]);

  // Fetch lesson counts summary
  const fetchAllLessonsSummary = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("course_lessons")
        .select("id, course_id");
      if (!error && data) {
        const counts: Record<string, number> = {};
        data.forEach((lesson: any) => {
          counts[lesson.course_id] = (counts[lesson.course_id] || 0) + 1;
        });
        setAllLessonsSummary(counts);
      }
    } catch (e) {
      console.error(e);
    }
  }, [supabase]);

  // Enroll in a course
  const handleEnrollCourse = async (courseId: string) => {
    if (!profile) return;
    try {
      const { error } = await supabase
        .from("course_enrollments")
        .insert({
          user_id: profile.id,
          course_id: courseId,
          completed_lessons: []
        });
      if (error) {
        alert("Enrollment failed: " + error.message);
      } else {
        loadEnrollments();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Open interactive course player
  const handleStartCourse = async (course: any) => {
    setActivePlayingCourse(course);
    setCourseLessons([]);
    setLoadingCourseLessons(true);
    setActiveLessonIdx(0);
    try {
      const { data, error } = await supabase
        .from("course_lessons")
        .select("*")
        .eq("course_id", course.id)
        .order("sequence_order", { ascending: true });
      if (!error && data) {
        setCourseLessons(data);
      } else if (error) {
        console.error(error);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingCourseLessons(false);
    }
  };

  // Mark lesson as completed and track progress
  const handleCompleteLesson = async (lessonId: string) => {
    if (!profile || !activePlayingCourse) return;
    const enrollment = enrollments.find(e => e.course_id === activePlayingCourse.id);
    if (!enrollment) return;

    let updatedCompleted = [...(enrollment.completed_lessons || [])];
    if (!updatedCompleted.includes(lessonId)) {
      updatedCompleted.push(lessonId);
    }

    try {
      const isCompletedAll = courseLessons.every(l => updatedCompleted.includes(l.id));
      const completedAt = isCompletedAll ? new Date().toISOString() : null;

      const { error } = await supabase
        .from("course_enrollments")
        .update({
          completed_lessons: updatedCompleted,
          completed_at: completedAt,
          last_accessed_at: new Date().toISOString()
        })
        .eq("id", enrollment.id);

      if (error) {
        console.error("Failed to update enrollment progress:", error);
      } else {
        setEnrollments(prev => prev.map(e => {
          if (e.id === enrollment.id) {
            return { ...e, completed_lessons: updatedCompleted, completed_at: completedAt };
          }
          return e;
        }));

        // Advance to next lesson if available
        if (activeLessonIdx < courseLessons.length - 1) {
          setActiveLessonIdx(activeLessonIdx + 1);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Fetch entrepreneurship training courses
  const loadCourses = useCallback(async () => {
    setLoadingCourses(true);
    try {
      const entrepreneurshipSkills = [
        "Entrepreneurship",
        "Business Strategy",
        "Venture Capital",
        "Product-Market Fit",
        "Startup Scaling",
        "Pitching",
        "Financial Modeling",
        "Marketing Strategy",
        "Leadership"
      ];
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .overlaps("skills_taught", entrepreneurshipSkills);

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

  useEffect(() => {
    if (activeTab === "courses") {
      loadCourses();
      loadEnrollments();
      fetchAllLessonsSummary();
    }
  }, [activeTab, loadCourses, loadEnrollments, fetchAllLessonsSummary]);

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
      
      // Reload overview
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
            { id: "overview", label: "Manage Projects", icon: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="9" />
                <rect x="14" y="3" width="7" height="5" />
                <rect x="14" y="12" width="7" height="9" />
                <rect x="3" y="16" width="7" height="5" />
              </svg>
            )},
            { id: "courses", label: "Entrepreneurship Academy", icon: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
            )}
          ].map((tab) => (
            <button
              key={tab.id}
              className={`sidebar-menu-btn ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => {
                setActiveTab(tab.id);
                setExpandedProjectId("");
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
              {(profile?.full_name || "P")[0].toUpperCase()}
            </div>
            <div className="sidebar-user-info">
              <span className="sidebar-user-name">{profile?.full_name || "Enterprise Partner"}</span>
              <span className="sidebar-user-role">Partner</span>
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
              {activeTab === "overview" && "Manage Projects"}
              {activeTab === "courses" && "Entrepreneurship Academy"}
            </h2>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }} className="user-profile-menu">
            <div style={{ textAlign: "right" }} className="header-user-info">
              <div style={{ fontSize: "0.85rem", fontWeight: "600" }}>{profile?.full_name || "Enterprise Partner"}</div>
              <span className="badge badge-cyan" style={{ fontSize: "0.6rem", padding: "0.1rem 0.4rem" }}>Partner</span>
            </div>
            <div className="avatar-badge" style={{ width: "32px", height: "32px", fontSize: "0.85rem", margin: 0 }}>
              {(profile?.full_name || "P")[0].toUpperCase()}
            </div>
          </div>
        </header>

        <main className="dashboard-content">
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
                                    <div key={talent.talent_id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(0, 0, 0, 0.02)", border: "1px solid var(--glass-border)", borderRadius: "var(--radius-sm)", padding: "1rem" }}>
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


          {/* Entrepreneurship Academy Tab */}
          {activeTab === "courses" && (
            <div className="animate-fade-in">
              <div className="glass-panel" style={{ padding: "2rem", marginBottom: "2rem" }}>
                <h3>Entrepreneurship & Business Training</h3>
                <p style={{ color: "var(--text-secondary)" }}>
                  Upskill your entrepreneurial journey with premium business strategy, financial modeling, and venture leadership training courses.
                </p>
              </div>

              {loadingCourses ? (
                <p style={{ color: "var(--text-secondary)" }}>Loading business courses...</p>
              ) : courses.length === 0 ? (
                <p style={{ color: "var(--text-secondary)" }}>No courses available. Check back later!</p>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "2rem" }}>
                  {courses.map((course) => {
                    const enrollment = enrollments.find(e => e.course_id === course.id);
                    const totalLessons = allLessonsSummary[course.id] || 0;
                    const completedLessons = enrollment?.completed_lessons?.length || 0;
                    const progressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

                    return (
                      <div key={course.id} className="glass-panel animate-fade-in" style={{ padding: "2rem", display: "flex", flexDirection: "column", justifyContent: "space-between", gap: "1rem" }}>
                        <div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                            <span className="badge badge-amber">{course.provider}</span>
                            {enrollment && (
                              <span className={`badge ${enrollment.completed_at ? "badge-emerald" : "badge-cyan"}`} style={{ fontSize: "0.75rem" }}>
                                {enrollment.completed_at ? "✓ Completed" : "In Progress"}
                              </span>
                            )}
                          </div>
                          <h4 style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>{course.title}</h4>
                          <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "1.5rem" }}>{course.description}</p>
                          
                          {course.skills_taught && course.skills_taught.length > 0 && (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem", marginBottom: "1.5rem" }}>
                              {course.skills_taught.map((skill: string, idx: number) => (
                                <span key={idx} className="badge badge-cyan" style={{ fontSize: "0.7rem" }}>{skill}</span>
                              ))}
                            </div>
                          )}

                          {enrollment && totalLessons > 0 && (
                            <div style={{ margin: "1rem 0 1.5rem 0" }}>
                              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", marginBottom: "0.25rem" }}>
                                <span style={{ color: "var(--text-secondary)" }}>Progress</span>
                                <span>{completedLessons}/{totalLessons} Lessons ({progressPercent}%)</span>
                              </div>
                              <div style={{ width: "100%", height: "6px", background: "rgba(0, 0, 0, 0.05)", borderRadius: "3px", overflow: "hidden" }}>
                                <div style={{ width: `${progressPercent}%`, height: "100%", background: progressPercent === 100 ? "var(--color-emerald)" : "var(--color-cyan)", transition: "width 0.3s" }} />
                              </div>
                            </div>
                          )}
                        </div>

                        <div>
                          {enrollment ? (
                            <div style={{ display: "flex", gap: "0.5rem" }}>
                              <button
                                className="btn btn-primary"
                                style={{ flex: 1 }}
                                onClick={() => handleStartCourse(course)}
                              >
                                {progressPercent === 100 ? "Review Lessons" : "Continue Lessons"}
                              </button>
                              {course.link && (
                                <a href={course.link} target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ padding: "0.5rem", display: "flex", alignItems: "center", justifyContent: "center" }} title="Visit External Course Website">
                                  ↗
                                </a>
                              )}
                            </div>
                          ) : (
                            <div style={{ display: "flex", gap: "0.5rem" }}>
                              <button
                                className="btn btn-primary"
                                style={{ flex: 1 }}
                                onClick={() => handleEnrollCourse(course.id)}
                              >
                                Enroll in Course
                              </button>
                              {course.link && (
                                <a href={course.link} target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ padding: "0.5rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                  Link ↗
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </main>
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
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
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
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600" }}>Project Title</label>
                <input type="text" className="form-input" placeholder="e.g. EdgeTalent Upgrades" value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>

              <div className="form-group" style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600" }}>Description & Scope</label>
                <textarea className="form-input" style={{ height: "100px" }} placeholder="Describe deliverables and parameters..." value={description} onChange={(e) => setDescription(e.target.value)} required />
              </div>

              <div className="form-group" style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600" }}>Required Skills (comma-separated)</label>
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

      {/* Course Player Overlay */}
      {activePlayingCourse && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "var(--bg-primary)",
            zIndex: 1000,
            display: "flex",
            flexDirection: "column"
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "1.25rem 2rem",
              background: "var(--bg-secondary)",
              borderBottom: "1px solid var(--glass-border)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}
          >
            <div>
              <span className="badge badge-amber" style={{ fontSize: "0.75rem", marginBottom: "0.25rem" }}>
                {activePlayingCourse.provider}
              </span>
              <h3 style={{ margin: 0, fontSize: "1.3rem" }}>{activePlayingCourse.title}</h3>
            </div>
            <button className="btn btn-secondary" onClick={() => setActivePlayingCourse(null)}>
              Exit Course
            </button>
          </div>

          {/* Main Body */}
          <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
            {/* Sidebar */}
            <div
              style={{
                width: "280px",
                borderRight: "1px solid var(--glass-border)",
                background: "var(--bg-tertiary)",
                display: "flex",
                flexDirection: "column",
                overflowY: "auto"
              }}
            >
              <div style={{ padding: "1.5rem 1rem", borderBottom: "1px solid var(--glass-border)" }}>
                <strong style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>COURSE OUTLINE</strong>
              </div>
              {loadingCourseLessons ? (
                <div style={{ padding: "1rem", color: "var(--text-secondary)" }}>Loading lessons...</div>
              ) : courseLessons.length === 0 ? (
                <div style={{ padding: "1rem", color: "var(--text-secondary)" }}>No lessons available.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column" }}>
                  {courseLessons.map((lesson, idx) => {
                    const isCompleted = enrollments
                      .find(e => e.course_id === activePlayingCourse.id)
                      ?.completed_lessons?.includes(lesson.id);
                    const isActive = idx === activeLessonIdx;

                    return (
                      <button
                        key={lesson.id}
                        onClick={() => setActiveLessonIdx(idx)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.75rem",
                          padding: "1.25rem 1rem",
                          border: "none",
                          borderBottom: "1px solid var(--glass-border)",
                          background: isActive
                            ? "rgba(6, 182, 212, 0.1)"
                            : "transparent",
                          textAlign: "left",
                          cursor: "pointer",
                          transition: "background 0.2s",
                          color: isActive ? "var(--color-cyan)" : "var(--text-primary)",
                          width: "100%"
                        }}
                      >
                        <div
                          style={{
                            width: "18px",
                            height: "18px",
                            borderRadius: "50%",
                            border: `2px solid ${isCompleted ? "var(--color-emerald)" : "var(--text-muted)"}`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: isCompleted ? "var(--color-emerald)" : "transparent",
                            fontSize: "0.65rem",
                            color: "#fff",
                            flexShrink: 0
                          }}
                        >
                          {isCompleted ? "✓" : ""}
                        </div>
                        <div style={{ overflow: "hidden" }}>
                          <div style={{ fontSize: "0.85rem", fontWeight: isActive ? "bold" : "normal", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {lesson.title}
                          </div>
                          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                            ⏱ {lesson.duration_minutes} mins
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Content Area */}
            <div style={{ flex: 1, padding: "3rem", overflowY: "auto", background: "var(--bg-secondary)" }}>
              {loadingCourseLessons ? (
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
                  <p>Loading course materials...</p>
                </div>
              ) : courseLessons.length === 0 ? (
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
                  <p style={{ color: "var(--text-secondary)" }}>No lessons have been configured for this course yet.</p>
                </div>
              ) : (
                <div style={{ maxWidth: "800px", margin: "0 auto" }}>
                  {(() => {
                    const lesson = courseLessons[activeLessonIdx];
                    if (!lesson) return null;
                    const isCompleted = enrollments
                      .find(e => e.course_id === activePlayingCourse.id)
                      ?.completed_lessons?.includes(lesson.id);

                    return (
                      <div className="glass-panel animate-fade-in" style={{ padding: "3rem", display: "flex", flexDirection: "column", gap: "2rem" }}>
                        <div style={{ borderBottom: "1px solid var(--glass-border)", paddingBottom: "1.5rem" }}>
                          <span className="badge badge-cyan" style={{ fontSize: "0.75rem", marginBottom: "0.5rem" }}>
                            Lesson {activeLessonIdx + 1} of {courseLessons.length}
                          </span>
                          <h2 style={{ fontSize: "2rem", margin: 0 }}>{lesson.title}</h2>
                          <div style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginTop: "0.5rem", display: "flex", gap: "1rem" }}>
                            <span>⏱ Reading Time: {lesson.duration_minutes} mins</span>
                            {isCompleted && <span style={{ color: "var(--color-emerald)", fontWeight: "bold" }}>✓ Completed</span>}
                          </div>
                        </div>

                        {/* Lesson Body Text */}
                        <div style={{ fontSize: "1.1rem", lineHeight: "1.7", color: "var(--text-primary)", whiteSpace: "pre-wrap" }}>
                          {lesson.content}
                        </div>

                        {/* Actions */}
                        <div style={{ borderTop: "1px solid var(--glass-border)", paddingTop: "2rem", display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "2rem" }}>
                          <button
                            className="btn btn-secondary"
                            disabled={activeLessonIdx === 0}
                            onClick={() => setActiveLessonIdx(activeLessonIdx - 1)}
                          >
                            ← Previous Lesson
                          </button>

                          <button
                            className="btn btn-primary"
                            onClick={() => handleCompleteLesson(lesson.id)}
                            style={{ background: isCompleted ? "rgba(16, 185, 129, 0.2)" : "var(--color-emerald)", borderColor: isCompleted ? "var(--color-emerald)" : "var(--color-emerald)" }}
                          >
                            {isCompleted ? (activeLessonIdx < courseLessons.length - 1 ? "Next Lesson →" : "Course Completed ✓") : "Mark as Completed"}
                          </button>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
