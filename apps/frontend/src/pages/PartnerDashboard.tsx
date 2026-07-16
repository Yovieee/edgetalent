import React, { useState, useEffect, useCallback } from "react";
import { useSupabase } from "../context/SupabaseContext";
import { ProjectSchema, FundingOpportunity } from "@edgetalent/shared";

export default function PartnerDashboard(): React.ReactElement {
  const { supabase, profile, signOut } = useSupabase();
  const [activeTab, setActiveTab] = useState<string>("dashboard");
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

  // Hiring Desk states
  const [applications, setApplications] = useState<any[]>([]);
  const [loadingApplications, setLoadingApplications] = useState<boolean>(false);
  const [applicationsError, setApplicationsError] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("All");

  // Funding states
  const [fundingOpportunities, setFundingOpportunities] = useState<FundingOpportunity[]>([]);
  const [loadingFunding, setLoadingFunding] = useState<boolean>(false);
  const [searchFundingQuery, setSearchFundingQuery] = useState<string>("");
  const [selectedFundingCategory, setSelectedFundingCategory] = useState<string>("All");
  const [selectedOpportunity, setSelectedOpportunity] = useState<FundingOpportunity | null>(null);
  const [showOpportunityModal, setShowOpportunityModal] = useState<boolean>(false);

  // Events states
  const [events, setEvents] = useState<any[]>([]);
  const [loadingEvents, setLoadingEvents] = useState<boolean>(false);
  const [eventRegistrations, setEventRegistrations] = useState<any[]>([]);
  const [allRegistrations, setAllRegistrations] = useState<any[]>([]);
  const [searchEventQuery, setSearchEventQuery] = useState<string>("");
  const [selectedEventCategory, setSelectedEventCategory] = useState<string>("All");
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [showEventDetailModal, setShowEventDetailModal] = useState<boolean>(false);
  const [registeringEventId, setRegisteringEventId] = useState<string | null>(null);

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

  const loadFundingOpportunities = useCallback(async () => {
    setLoadingFunding(true);
    try {
      const { data, error } = await supabase
        .from("funding_opportunities")
        .select("*")
        .order("created_at", { ascending: false });
      if (!error && data) {
        setFundingOpportunities(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingFunding(false);
    }
  }, [supabase]);

  // Fetch events
  const loadEvents = useCallback(async () => {
    setLoadingEvents(true);
    try {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("event_date", { ascending: true });
      if (!error && data) {
        setEvents(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingEvents(false);
    }
  }, [supabase]);

  // Fetch registrations/RSVPs
  const loadEventRegistrations = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("event_registrations")
        .select("*");
      if (!error && data) {
        setAllRegistrations(data);
        if (profile) {
          setEventRegistrations(data.filter((r: any) => r.user_id === profile.id));
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, [profile, supabase]);

  // RSVP handler
  const handleEventRSVP = async (eventId: string) => {
    if (!profile) return;

    // Capacity check
    const eventObj = events.find(e => e.id === eventId);
    const existingRegistration = eventRegistrations.find(r => r.event_id === eventId);
    
    if (eventObj && eventObj.capacity && !existingRegistration) {
      const currentRSVPs = allRegistrations.filter(r => r.event_id === eventId).length;
      if (currentRSVPs >= eventObj.capacity) {
        alert("Sorry, this event has already reached its capacity limit!");
        return;
      }
    }

    setRegisteringEventId(eventId);
    try {
      if (existingRegistration) {
        // Cancel RSVP
        const { error } = await supabase
          .from("event_registrations")
          .delete()
          .eq("id", existingRegistration.id);
        
        if (error) throw error;
        
        setEventRegistrations(prev => prev.filter(r => r.id !== existingRegistration.id));
        setAllRegistrations(prev => prev.filter(r => r.id !== existingRegistration.id));
      } else {
        // RSVP/Register
        const { data, error } = await supabase
          .from("event_registrations")
          .insert({
            event_id: eventId,
            user_id: profile.id
          })
          .select()
          .single();

        if (error) throw error;
        if (data) {
          setEventRegistrations(prev => [...prev, data]);
          setAllRegistrations(prev => [...prev, data]);
        }
      }
    } catch (e: any) {
      console.error(e);
      alert("Failed to update RSVP status: " + e.message);
    } finally {
      setRegisteringEventId(null);
    }
  };

  // Fetch applications for the entrepreneur's projects
  const loadApplications = useCallback(async () => {
    if (!profile) return;
    setLoadingApplications(true);
    setApplicationsError("");
    try {
      const { data: projs, error: projErr } = await supabase
        .from("projects")
        .select("id")
        .eq("partner_id", profile.id);

      if (projErr) throw projErr;

      if (!projs || projs.length === 0) {
        setApplications([]);
        return;
      }

      const projIds = projs.map((p) => p.id);

      const { data, error } = await supabase
        .from("applications")
        .select("*, projects(*), profiles:talent_id(*)")
        .in("project_id", projIds);

      if (error) throw error;

      if (data) {
        // Sort newest first
        const sorted = [...data].sort((a, b) => new Date(b.applied_at).getTime() - new Date(a.applied_at).getTime());
        setApplications(sorted);
      }
    } catch (e: any) {
      console.error("Error loading applications:", e);
      setApplicationsError(e.message || "Failed to load applications.");
    } finally {
      setLoadingApplications(false);
    }
  }, [profile, supabase]);

  // Update application status
  const handleUpdateStatus = async (applicationId: string, newStatus: "applied" | "reviewing" | "shortlisted" | "accepted" | "rejected") => {
    try {
      const { error } = await supabase
        .from("applications")
        .update({ status: newStatus })
        .eq("id", applicationId);

      if (error) throw error;

      // Update state locally
      setApplications(prev =>
        prev.map(app => (app.id === applicationId ? { ...app, status: newStatus } : app))
      );

      // Refresh stats on dashboard overview
      loadOverview();
    } catch (err: any) {
      console.error("Error updating application status:", err);
      alert(err.message || "Failed to update application status.");
    }
  };

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
    if (activeTab === "courses" || activeTab === "dashboard") {
      loadCourses();
      loadEnrollments();
      fetchAllLessonsSummary();
    }
    if (activeTab === "funding") {
      loadFundingOpportunities();
    }
    if (activeTab === "hiring") {
      loadApplications();
    }
    if (activeTab === "events") {
      loadEvents();
      loadEventRegistrations();
    }
  }, [activeTab, loadCourses, loadEnrollments, fetchAllLessonsSummary, loadFundingOpportunities, loadApplications, loadEvents, loadEventRegistrations]);

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
            { id: "dashboard", label: "Dashboard", icon: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            )},
            { id: "overview", label: "Manage Projects", icon: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="9" />
                <rect x="14" y="3" width="7" height="5" />
                <rect x="14" y="12" width="7" height="9" />
                <rect x="3" y="16" width="7" height="5" />
              </svg>
            )},
            { id: "hiring", label: "Hiring Desk", icon: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            )},
            { id: "courses", label: "Entrepreneurship Academy", icon: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
            )},
            { id: "funding", label: "Funding Opportunities", icon: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="1" x2="12" y2="23"></line>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
              </svg>
            )},
            { id: "events", label: "Events", icon: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
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
              {activeTab === "dashboard" && "Dashboard"}
              {activeTab === "overview" && "Manage Projects"}
              {activeTab === "hiring" && "Hiring Desk"}
              {activeTab === "courses" && "Entrepreneurship Academy"}
              {activeTab === "funding" && "Funding Opportunities"}
              {activeTab === "events" && "Events Hub"}
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
          {/* Dashboard Tab */}
          {activeTab === "dashboard" && (
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
                    <button className="btn btn-primary" onClick={() => setActiveTab("overview")} style={{ width: "100%" }}>
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
                    <button className="btn btn-success" onClick={() => setActiveTab("hiring")} style={{ width: "100%" }}>
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
                    <button className="btn btn-secondary" onClick={() => setActiveTab("courses")} style={{ width: "100%" }}>
                      Browse Academy Courses
                    </button>
                  </div>
                </div>

                {/* Right Column: Recent Postings */}
                <div className="glass-panel" style={{ padding: "1.5rem" }}>
                  <h3 style={{ fontSize: "1.3rem", marginBottom: "1.5rem" }}>Recent Project Postings</h3>
                  {projects.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "2rem 0" }}>
                      <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: "1.25rem" }}>
                        You haven't posted any projects yet.
                      </p>
                      <button className="btn btn-primary" onClick={() => { setActiveTab("overview"); setShowPostModal(true); }}>
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
                        <button className="btn btn-secondary" onClick={() => setActiveTab("overview")} style={{ marginTop: "0.5rem", width: "100%" }}>
                          View All {projects.length} Projects
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

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

          {/* Hiring Desk Tab */}
          {activeTab === "hiring" && (
            <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
              {/* Hero Header */}
              <div className="glass-panel" style={{ padding: "2.5rem 2rem", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <div style={{ position: "absolute", top: "0", left: "0", width: "100%", height: "4px", background: "var(--grad-emerald-cyan)" }} />
                <h3 style={{ fontSize: "1.75rem", margin: 0, fontWeight: "700" }}>Hiring Desk</h3>
                <p style={{ color: "var(--text-secondary)", fontSize: "1rem", margin: 0, maxWidth: "700px" }}>
                  Manage and review applications submitted by talents for your posted projects. Track candidates, view AI vector matches, and transition application statuses.
                </p>
              </div>

              {/* Stats Overview */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1.5rem" }}>
                <div className="glass-panel" style={{ padding: "1.25rem", textAlign: "center" }}>
                  <h4 style={{ color: "var(--text-secondary)", marginBottom: "0.25rem", fontSize: "0.8rem", textTransform: "uppercase" }}>Total Applicants</h4>
                  <p style={{ fontSize: "1.8rem", fontWeight: "bold", color: "var(--text-primary)", margin: "0.25rem 0 0 0" }}>{applications.length}</p>
                </div>
                <div className="glass-panel" style={{ padding: "1.25rem", textAlign: "center" }}>
                  <h4 style={{ color: "var(--text-secondary)", marginBottom: "0.25rem", fontSize: "0.8rem", textTransform: "uppercase" }}>Reviewing</h4>
                  <p style={{ fontSize: "1.8rem", fontWeight: "bold", color: "var(--color-cyan)", margin: "0.25rem 0 0 0" }}>
                    {applications.filter(a => a.status === "reviewing").length}
                  </p>
                </div>
                <div className="glass-panel" style={{ padding: "1.25rem", textAlign: "center" }}>
                  <h4 style={{ color: "var(--text-secondary)", marginBottom: "0.25rem", fontSize: "0.8rem", textTransform: "uppercase" }}>Shortlisted</h4>
                  <p style={{ fontSize: "1.8rem", fontWeight: "bold", color: "var(--color-purple)", margin: "0.25rem 0 0 0" }}>
                    {applications.filter(a => a.status === "shortlisted").length}
                  </p>
                </div>
                <div className="glass-panel" style={{ padding: "1.25rem", textAlign: "center" }}>
                  <h4 style={{ color: "var(--text-secondary)", marginBottom: "0.25rem", fontSize: "0.8rem", textTransform: "uppercase" }}>Accepted</h4>
                  <p style={{ fontSize: "1.8rem", fontWeight: "bold", color: "var(--color-emerald)", margin: "0.25rem 0 0 0" }}>
                    {applications.filter(a => a.status === "accepted").length}
                  </p>
                </div>
                <div className="glass-panel" style={{ padding: "1.25rem", textAlign: "center" }}>
                  <h4 style={{ color: "var(--text-secondary)", marginBottom: "0.25rem", fontSize: "0.8rem", textTransform: "uppercase" }}>Rejected</h4>
                  <p style={{ fontSize: "1.8rem", fontWeight: "bold", color: "var(--color-rose)", margin: "0.25rem 0 0 0" }}>
                    {applications.filter(a => a.status === "rejected").length}
                  </p>
                </div>
              </div>

              {/* Filters & Search Control Panel */}
              <div className="glass-panel" style={{ padding: "1.5rem", display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap", justifyContent: "space-between" }}>
                {/* Search */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "rgba(255, 255, 255, 0.5)", border: "1px solid var(--glass-border)", borderRadius: "var(--radius-sm)", padding: "0.5rem 1rem", minWidth: "280px", flex: "1" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search applicants or projects..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ border: "none", background: "transparent", outline: "none", color: "var(--text-primary)", fontSize: "0.9rem", width: "100%" }}
                  />
                </div>

                {/* Status Filter Buttons */}
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                  {["All", "Applied", "Reviewing", "Shortlisted", "Accepted", "Rejected"].map((status) => {
                    const count = status === "All" ? applications.length : applications.filter(a => a.status.toLowerCase() === status.toLowerCase()).length;
                    const isActive = statusFilter === status;
                    return (
                      <button
                        key={status}
                        className={`badge ${isActive ? "badge-cyan" : "badge-neutral"}`}
                        style={{ cursor: "pointer", border: "none", padding: "0.5rem 1rem", fontSize: "0.85rem", borderRadius: "100px", transition: "all 0.2s" }}
                        onClick={() => setStatusFilter(status)}
                      >
                        {status} ({count})
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Applications Area */}
              {loadingApplications ? (
                <div style={{ display: "flex", justifyContent: "center", padding: "3rem" }}>
                  <p style={{ color: "var(--text-secondary)" }}>Loading candidate applications...</p>
                </div>
              ) : applicationsError ? (
                <div className="badge badge-rose" style={{ padding: "1rem", borderRadius: "var(--radius-sm)" }}>
                  {applicationsError}
                </div>
              ) : (() => {
                // Apply Client-Side Filtering
                const filteredApplications = applications.filter((app) => {
                  const matchSearch =
                    (app.profiles?.full_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (app.projects?.title || "").toLowerCase().includes(searchQuery.toLowerCase());
                  const matchStatus =
                    statusFilter === "All" || app.status.toLowerCase() === statusFilter.toLowerCase();
                  return matchSearch && matchStatus;
                });

                if (filteredApplications.length === 0) {
                  return (
                    <div className="glass-panel" style={{ padding: "4rem 2rem", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
                      <span style={{ fontSize: "3rem" }}>💼</span>
                      <h4 style={{ fontSize: "1.25rem", margin: 0 }}>No applications found</h4>
                      <p style={{ color: "var(--text-secondary)", maxWidth: "500px", margin: 0 }}>
                        {statusFilter !== "All" || searchQuery
                          ? "Try adjusting your search criteria or filters to see more results."
                          : "No candidates have applied to your active project scopes yet. Post more deliverables scopes in the Projects workspace to attract elite talents."}
                      </p>
                      {statusFilter === "All" && !searchQuery && (
                        <button className="btn btn-primary" onClick={() => setActiveTab("overview")}>
                          Go to Projects Workspace
                        </button>
                      )}
                    </div>
                  );
                }

                return (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "1.5rem" }}>
                    {filteredApplications.map((app) => {
                      const talent = app.profiles || {};
                      const project = app.projects || {};
                      const initials = (talent.full_name || "T")[0].toUpperCase();
                      const matchPct = app.match_percentage || 0;
                      
                      // Match percentage colors
                      let matchBadgeClass = "badge-rose";
                      let matchColor = "var(--color-rose)";
                      if (matchPct >= 80) {
                        matchBadgeClass = "badge-emerald";
                        matchColor = "var(--color-emerald)";
                      } else if (matchPct >= 50) {
                        matchBadgeClass = "badge-cyan";
                        matchColor = "var(--color-cyan)";
                      } else if (matchPct > 0) {
                        matchBadgeClass = "badge-amber";
                        matchColor = "var(--color-amber)";
                      }

                      // Status styles
                      let statusBadgeClass = "badge-neutral";
                      if (app.status === "reviewing") statusBadgeClass = "badge-cyan";
                      else if (app.status === "shortlisted") statusBadgeClass = "badge-purple";
                      else if (app.status === "accepted") statusBadgeClass = "badge-emerald";
                      else if (app.status === "rejected") statusBadgeClass = "badge-rose";

                      return (
                        <div key={app.id} className="glass-panel" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", justifyContent: "space-between", gap: "1.25rem", transition: "all 0.3s" }}>
                          
                          {/* Card Top */}
                          <div>
                            {/* Project Reference */}
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem", marginBottom: "1rem" }}>
                              <span className="badge badge-neutral" style={{ fontSize: "0.7rem", maxWidth: "200px", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }} title={project.title}>
                                Project: {project.title}
                              </span>
                              <span className={`badge ${statusBadgeClass}`} style={{ fontSize: "0.7rem", textTransform: "capitalize" }}>
                                {app.status}
                              </span>
                            </div>

                            {/* Talent Info Row */}
                            <div style={{ display: "flex", gap: "1rem", alignItems: "center", marginBottom: "1rem" }}>
                              <div style={{
                                width: "42px",
                                height: "42px",
                                borderRadius: "50%",
                                background: "var(--grad-cyan-purple)",
                                color: "white",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontWeight: "700",
                                fontSize: "1.1rem"
                              }}>
                                {initials}
                              </div>
                              <div style={{ overflow: "hidden" }}>
                                <h4 style={{ fontSize: "1.1rem", margin: 0, whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>{talent.full_name || "EdgeTalent Member"}</h4>
                                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{talent.email}</span>
                              </div>
                            </div>

                            {/* AI Match Score Progress */}
                            {matchPct > 0 && (
                              <div style={{ marginBottom: "1rem" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.25rem" }}>
                                  <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: "500" }}>AI Match Accuracy</span>
                                  <span className={`badge ${matchBadgeClass}`} style={{ fontSize: "0.7rem" }}>{matchPct}% Match</span>
                                </div>
                                <div style={{ width: "100%", height: "6px", background: "var(--bg-tertiary)", borderRadius: "10px", overflow: "hidden" }}>
                                  <div style={{ width: `${matchPct}%`, height: "100%", background: matchColor, borderRadius: "10px" }} />
                                </div>
                              </div>
                            )}

                            {/* Bio */}
                            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: "1.5", margin: "0 0 1rem 0", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }} title={talent.bio}>
                              {talent.bio || "No biography provided by candidate."}
                            </p>

                            {/* Skills Badges */}
                            {talent.skills && talent.skills.length > 0 && (
                              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem", marginBottom: "1rem" }}>
                                {talent.skills.slice(0, 6).map((skill: string, idx: number) => (
                                  <span key={idx} className="badge badge-emerald" style={{ fontSize: "0.65rem", padding: "0.15rem 0.4rem" }}>{skill}</span>
                                ))}
                                {talent.skills.length > 6 && (
                                  <span className="badge badge-neutral" style={{ fontSize: "0.65rem", padding: "0.15rem 0.4rem" }}>+{talent.skills.length - 6} more</span>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Card Footer Actions */}
                          <div style={{ borderTop: "1px solid var(--glass-border)", paddingTop: "1rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                            {/* Date applied */}
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                              <span>Applied: {new Date(app.applied_at).toLocaleDateString()}</span>
                            </div>

                            {/* Update Status Buttons */}
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                              <button
                                className="btn btn-secondary btn-review"
                                style={{ flex: "1", padding: "0.4rem 0.8rem", fontSize: "0.8rem", background: app.status === "reviewing" ? "rgba(8, 145, 178, 0.1)" : "", borderColor: app.status === "reviewing" ? "var(--color-cyan)" : "" }}
                                onClick={() => handleUpdateStatus(app.id, "reviewing")}
                              >
                                Review
                              </button>
                              <button
                                className="btn btn-secondary btn-shortlist"
                                style={{ flex: "1", padding: "0.4rem 0.8rem", fontSize: "0.8rem", background: app.status === "shortlisted" ? "rgba(124, 58, 237, 0.1)" : "", borderColor: app.status === "shortlisted" ? "var(--color-purple)" : "" }}
                                onClick={() => handleUpdateStatus(app.id, "shortlisted")}
                              >
                                Shortlist
                              </button>
                              <button
                                className="btn btn-success btn-accept"
                                style={{ flex: "1", padding: "0.4rem 0.8rem", fontSize: "0.8rem", minWidth: "70px" }}
                                disabled={app.status === "accepted"}
                                onClick={() => handleUpdateStatus(app.id, "accepted")}
                              >
                                Accept
                              </button>
                              <button
                                className="btn btn-warning btn-reject"
                                style={{ flex: "1", padding: "0.4rem 0.8rem", fontSize: "0.8rem", minWidth: "70px" }}
                                disabled={app.status === "rejected"}
                                onClick={() => handleUpdateStatus(app.id, "rejected")}
                              >
                                Reject
                              </button>
                            </div>

                            {/* Contact button */}
                            {talent.email && (
                              <a
                                href={`mailto:${talent.email}?subject=Application for ${project.title}`}
                                className="btn btn-primary"
                                style={{ width: "100%", padding: "0.5rem 1rem", fontSize: "0.85rem", textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center" }}
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "0.5rem" }}>
                                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                  <polyline points="22,6 12,13 2,6" />
                                </svg>
                                Contact Candidate
                              </a>
                            )}
                          </div>

                        </div>
                      );
                    })}
                  </div>
                );
              })()}
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

          {/* Funding Opportunities Workspace */}
          {activeTab === "funding" && (
            <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
              {/* Hero Header */}
              <div className="glass-panel" style={{ padding: "2.5rem 2rem", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <div style={{ position: "absolute", top: "0", left: "0", width: "100%", height: "4px", background: "var(--grad-cyan-purple)" }} />
                <h3 style={{ fontSize: "1.75rem", margin: 0, fontWeight: "700" }}>Funding & Grants Hub</h3>
                <p style={{ color: "var(--text-secondary)", fontSize: "1rem", margin: 0, maxWidth: "700px" }}>
                  Explore capital financing, accelerators, government research grants, and equity financing opportunities curated for tech entrepreneurs and startups.
                </p>
              </div>

              {/* Filters & Search Panel */}
              <div className="glass-panel" style={{ padding: "1.5rem", display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap", justifyContent: "space-between" }}>
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                  {["All", "Grants", "Accelerators", "Equity/VC", "Loans/Debt"].map((cat) => (
                    <button
                      key={cat}
                      className={`badge ${selectedFundingCategory === cat ? "badge-cyan" : "badge-neutral"}`}
                      style={{ cursor: "pointer", border: "none", padding: "0.5rem 1rem", fontSize: "0.85rem", borderRadius: "100px", transition: "all 0.2s" }}
                      onClick={() => setSelectedFundingCategory(cat)}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
                <div style={{ display: "flex", gap: "0.5rem", width: "100%", maxWidth: "320px", position: "relative" }}>
                  <input
                    type="text"
                    placeholder="Search opportunities..."
                    className="input-field"
                    style={{ paddingRight: "2.5rem", margin: 0 }}
                    value={searchFundingQuery}
                    onChange={(e) => setSearchFundingQuery(e.target.value)}
                  />
                  <span style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-secondary)" }}>🔍</span>
                </div>
              </div>

              {/* Funding Grid */}
              {loadingFunding ? (
                <div style={{ textAlign: "center", padding: "3rem" }}>
                  <p style={{ color: "var(--text-secondary)" }}>Loading funding opportunities...</p>
                </div>
              ) : (() => {
                const filtered = fundingOpportunities.filter((opp) => {
                  const matchCat = selectedFundingCategory === "All" || opp.category === selectedFundingCategory;
                  const matchQuery = opp.title.toLowerCase().includes(searchFundingQuery.toLowerCase()) ||
                    opp.description.toLowerCase().includes(searchFundingQuery.toLowerCase());
                  return matchCat && matchQuery;
                });

                if (filtered.length === 0) {
                  return (
                    <div className="glass-panel" style={{ padding: "3rem", textAlign: "center" }}>
                      <p style={{ color: "var(--text-secondary)", margin: 0 }}>No funding opportunities matched your criteria.</p>
                    </div>
                  );
                }

                return (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "2rem" }}>
                    {filtered.map((opp) => {
                      // Profile fit calculation
                      let fitPercent = 0;
                      if (profile && profile.skills) {
                        const userSkills = profile.skills.map((s: string) => s.toLowerCase());
                        const text = (opp.title + " " + opp.description + " " + opp.content).toLowerCase();
                        let matches = 0;
                        userSkills.forEach((s: string) => {
                          if (text.includes(s)) matches++;
                        });
                        fitPercent = userSkills.length > 0 ? Math.min(100, Math.round(40 + (matches / userSkills.length) * 60)) : 55;
                      } else {
                        fitPercent = 55;
                      }

                      return (
                        <div key={opp.id} className="glass-panel animate-fade-in" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", justifyContent: "space-between", gap: "1.5rem" }}>
                          <div>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                              <span className={`badge ${
                                opp.category === "Grants" ? "badge-emerald" :
                                opp.category === "Accelerators" ? "badge-purple" :
                                opp.category === "Equity/VC" ? "badge-cyan" : "badge-amber"
                              }`} style={{ fontSize: "0.75rem" }}>
                                {opp.category}
                              </span>
                              <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                                <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Profile Fit:</span>
                                <span className={`badge ${fitPercent >= 75 ? "badge-emerald" : fitPercent >= 50 ? "badge-cyan" : "badge-rose"}`} style={{ fontSize: "0.7rem", padding: "0.1rem 0.3rem" }}>
                                  {fitPercent}%
                                </span>
                              </div>
                            </div>
                            <h4 style={{ fontSize: "1.2rem", margin: "0 0 0.5rem 0", fontWeight: "600" }}>{opp.title}</h4>
                            <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", margin: "0 0 1.25rem 0", lineHeight: "1.5" }}>{opp.description}</p>
                            
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "0.85rem", borderTop: "1px solid var(--glass-border)", paddingTop: "1rem" }}>
                              <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <span style={{ color: "var(--text-secondary)" }}>Amount:</span>
                                <span style={{ fontWeight: "600" }}>{opp.amount || "N/A"}</span>
                              </div>
                              <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <span style={{ color: "var(--text-secondary)" }}>Deadline:</span>
                                <span style={{ fontWeight: "600", color: "var(--color-rose)" }}>{opp.deadline || "N/A"}</span>
                              </div>
                            </div>
                          </div>

                          <button
                            className="btn btn-primary"
                            style={{ width: "100%", padding: "0.6rem" }}
                            onClick={() => {
                              setSelectedOpportunity(opp);
                              setShowOpportunityModal(true);
                            }}
                          >
                            Read Details & Apply
                          </button>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          )}

          {/* Events Hub Workspace */}
          {activeTab === "events" && (
            <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
              {/* Hero Header */}
              <div className="glass-panel" style={{ padding: "2.5rem 2rem", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <div style={{ position: "absolute", top: "0", left: "0", width: "100%", height: "4px", background: "var(--grad-cyan-purple)" }} />
                <h3 style={{ fontSize: "1.75rem", margin: 0, fontWeight: "700" }}>Events & Workshops</h3>
                <p style={{ color: "var(--text-secondary)", fontSize: "1rem", margin: 0, maxWidth: "700px" }}>
                  Explore and attend community tech events, hackathons, and networking opportunities. Connect with upcoming tech talent and enterprise partners.
                </p>
              </div>

              {/* Filters & Search Panel */}
              <div className="glass-panel" style={{ padding: "1.5rem", display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap", justifyContent: "space-between" }}>
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                  {["All", "Hackathon", "Webinar", "Workshop", "Networking", "Pitch Night"].map((cat) => (
                    <button
                      key={cat}
                      className={`badge ${selectedEventCategory === cat ? "badge-cyan" : "badge-neutral"}`}
                      style={{ cursor: "pointer", border: "none", padding: "0.5rem 1rem", fontSize: "0.85rem", borderRadius: "100px", transition: "all 0.2s" }}
                      onClick={() => setSelectedEventCategory(cat)}
                    >
                      {cat === "All" ? "All Events" : cat}
                    </button>
                  ))}
                </div>
                <div style={{ display: "flex", gap: "0.5rem", width: "100%", maxWidth: "320px", position: "relative" }}>
                  <input
                    type="text"
                    placeholder="Search events..."
                    className="input-field"
                    style={{ paddingRight: "2.5rem", margin: 0 }}
                    value={searchEventQuery}
                    onChange={(e) => setSearchEventQuery(e.target.value)}
                  />
                  <span style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-secondary)" }}>🔍</span>
                </div>
              </div>

              {/* Events Grid */}
              {loadingEvents ? (
                <div style={{ textAlign: "center", padding: "3rem" }}>
                  <p style={{ color: "var(--text-secondary)" }}>Loading upcoming events...</p>
                </div>
              ) : (() => {
                const filtered = events.filter((evt) => {
                  const matchCat = selectedEventCategory === "All" || evt.category === selectedEventCategory;
                  const matchQuery = evt.title.toLowerCase().includes(searchEventQuery.toLowerCase()) ||
                    evt.description.toLowerCase().includes(searchEventQuery.toLowerCase());
                  return matchCat && matchQuery;
                });

                if (filtered.length === 0) {
                  return (
                    <div className="glass-panel" style={{ padding: "3rem", textAlign: "center" }}>
                      <p style={{ color: "var(--text-secondary)", margin: 0 }}>No upcoming events matched your criteria.</p>
                    </div>
                  );
                }

                return (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "2rem" }}>
                    {filtered.map((evt) => {
                      const isRegistered = eventRegistrations.some((reg) => reg.event_id === evt.id);
                      const registeredCount = allRegistrations.filter((r) => r.event_id === evt.id).length;
                      const isFull = evt.capacity ? registeredCount >= evt.capacity : false;
                      const capacityText = evt.capacity
                        ? `${registeredCount} / ${evt.capacity} registered ${isFull ? "(Full)" : ""}`
                        : `${registeredCount} registered (Unlimited)`;

                      return (
                        <div key={evt.id} className="glass-panel animate-fade-in" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", justifyContent: "space-between", gap: "1.5rem" }}>
                          <div>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                              <span className={`badge ${
                                evt.category === "Hackathon" ? "badge-rose" :
                                evt.category === "Webinar" ? "badge-purple" :
                                evt.category === "Workshop" ? "badge-cyan" :
                                evt.category === "Networking" ? "badge-emerald" : "badge-amber"
                              }`} style={{ fontSize: "0.75rem" }}>
                                {evt.category}
                              </span>
                              {isRegistered && (
                                <span className="badge badge-emerald" style={{ fontSize: "0.7rem", padding: "0.15rem 0.4rem" }}>
                                  ✓ Registered
                                </span>
                              )}
                              {!isRegistered && isFull && (
                                <span className="badge badge-rose" style={{ fontSize: "0.7rem", padding: "0.15rem 0.4rem" }}>
                                  Full
                                </span>
                              )}
                            </div>
                            <h4 style={{ fontSize: "1.2rem", margin: "0 0 0.5rem 0", fontWeight: "600" }}>{evt.title}</h4>
                            <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", margin: "0 0 1.25rem 0", lineHeight: "1.5" }}>{evt.description}</p>
                            
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "0.85rem", borderTop: "1px solid var(--glass-border)", paddingTop: "1rem" }}>
                              <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <span style={{ color: "var(--text-secondary)" }}>Date & Time:</span>
                                <span style={{ fontWeight: "600", color: "var(--color-cyan)" }}>{new Date(evt.event_date).toLocaleString()}</span>
                              </div>
                              <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <span style={{ color: "var(--text-secondary)" }}>Location:</span>
                                <span style={{ fontWeight: "600" }}>{evt.location}</span>
                              </div>
                              <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <span style={{ color: "var(--text-secondary)" }}>Host:</span>
                                <span style={{ fontWeight: "600" }}>{evt.organizer}</span>
                              </div>
                              <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <span style={{ color: "var(--text-secondary)" }}>Capacity:</span>
                                <span style={{ fontWeight: "600", color: isFull ? "var(--color-rose)" : "var(--text-muted)" }}>{capacityText}</span>
                              </div>
                            </div>
                          </div>

                          <div style={{ display: "flex", gap: "0.5rem" }}>
                            <button
                              className="btn btn-secondary"
                              style={{ flex: 1, padding: "0.6rem" }}
                              onClick={() => {
                                setSelectedEvent(evt);
                                setShowEventDetailModal(true);
                              }}
                            >
                              Details
                            </button>
                            <button
                              className={`btn ${isRegistered ? "btn-secondary" : isFull ? "btn-secondary" : "btn-primary"}`}
                              style={{ flex: 1.5, padding: "0.6rem" }}
                              disabled={registeringEventId === evt.id || (isFull && !isRegistered)}
                              onClick={() => handleEventRSVP(evt.id)}
                            >
                              {registeringEventId === evt.id ? "Loading..." : isRegistered ? "Cancel RSVP" : isFull ? "Full" : "RSVP / Register"}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
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


      {/* Funding Opportunity Detail Modal */}
      {showOpportunityModal && selectedOpportunity && (
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
            zIndex: 1001,
          }}
          onClick={() => setShowOpportunityModal(false)}
        >
          <div
            className="glass-panel animate-fade-in"
            style={{
              width: "90%",
              maxWidth: "650px",
              padding: "2.5rem",
              maxHeight: "90vh",
              overflowY: "auto",
              position: "relative"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
              <div>
                <span className={`badge ${
                  selectedOpportunity.category === "Grants" ? "badge-emerald" :
                  selectedOpportunity.category === "Accelerators" ? "badge-purple" :
                  selectedOpportunity.category === "Equity/VC" ? "badge-cyan" : "badge-amber"
                }`} style={{ fontSize: "0.75rem", marginBottom: "0.5rem" }}>
                  {selectedOpportunity.category}
                </span>
                <h3 style={{ fontSize: "1.5rem", margin: 0, fontWeight: "700" }}>{selectedOpportunity.title}</h3>
              </div>
              <button
                className="btn-close"
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--text-secondary)",
                  fontSize: "1.5rem",
                  cursor: "pointer",
                  lineHeight: 1,
                  padding: 0
                }}
                onClick={() => setShowOpportunityModal(false)}
              >
                &times;
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <div>
                <h4 style={{ fontSize: "1rem", marginBottom: "0.5rem", color: "var(--text-primary)" }}>Program Description</h4>
                <p style={{ fontSize: "0.95rem", color: "var(--text-secondary)", lineHeight: "1.6", margin: 0 }}>
                  {selectedOpportunity.content}
                </p>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", background: "rgba(255, 255, 255, 0.03)", padding: "1rem", borderRadius: "8px", border: "1px solid var(--glass-border)" }}>
                <div>
                  <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block" }}>Funding Amount</span>
                  <span style={{ fontSize: "0.95rem", fontWeight: "600", color: "var(--text-primary)" }}>{selectedOpportunity.amount || "N/A"}</span>
                </div>
                <div>
                  <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block" }}>Application Deadline</span>
                  <span style={{ fontSize: "0.95rem", fontWeight: "600", color: "var(--color-rose)" }}>{selectedOpportunity.deadline || "N/A"}</span>
                </div>
                <div style={{ gridColumn: "span 2" }}>
                  <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block" }}>Eligibility Criteria</span>
                  <span style={{ fontSize: "0.95rem", fontWeight: "600", color: "var(--text-primary)", display: "block" }}>{selectedOpportunity.eligibility || "N/A"}</span>
                </div>
              </div>

              <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                <button
                  type="button"
                  id="btn-close-funding-modal"
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                  onClick={() => setShowOpportunityModal(false)}
                >
                  Close
                </button>
                {selectedOpportunity.link && (
                  <a
                    href={selectedOpportunity.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary"
                    style={{ flex: 1, textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center" }}
                  >
                    Apply on Official Website
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Event Detail Modal */}
      {showEventDetailModal && selectedEvent && (() => {
        const isRegistered = eventRegistrations.some((reg) => reg.event_id === selectedEvent.id);
        return (
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
              zIndex: 1001,
            }}
            onClick={() => setShowEventDetailModal(false)}
          >
            <div
              className="glass-panel animate-fade-in"
              style={{
                width: "90%",
                maxWidth: "650px",
                padding: "2.5rem",
                maxHeight: "90vh",
                overflowY: "auto",
                position: "relative"
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
                <div>
                  <span className={`badge ${
                    selectedEvent.category === "Hackathon" ? "badge-rose" :
                    selectedEvent.category === "Webinar" ? "badge-purple" :
                    selectedEvent.category === "Workshop" ? "badge-cyan" :
                    selectedEvent.category === "Networking" ? "badge-emerald" : "badge-amber"
                  }`} style={{ fontSize: "0.75rem", marginBottom: "0.5rem" }}>
                    {selectedEvent.category}
                  </span>
                  <h3 style={{ fontSize: "1.5rem", margin: 0, fontWeight: "700" }}>{selectedEvent.title}</h3>
                </div>
                <button
                  className="btn-close"
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--text-secondary)",
                    fontSize: "1.5rem",
                    cursor: "pointer",
                    lineHeight: 1,
                    padding: 0
                  }}
                  onClick={() => setShowEventDetailModal(false)}
                >
                  &times;
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                <div>
                  <h4 style={{ fontSize: "1rem", marginBottom: "0.5rem", color: "var(--text-primary)" }}>Event Description</h4>
                  <p style={{ fontSize: "0.95rem", color: "var(--text-secondary)", lineHeight: "1.6", margin: 0 }}>
                    {selectedEvent.content}
                  </p>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", background: "rgba(255, 255, 255, 0.03)", padding: "1rem", borderRadius: "8px", border: "1px solid var(--glass-border)" }}>
                  <div>
                    <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block" }}>Date & Time</span>
                    <span style={{ fontSize: "0.95rem", fontWeight: "600", color: "var(--color-cyan)" }}>{new Date(selectedEvent.event_date).toLocaleString()}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block" }}>Location</span>
                    <span style={{ fontSize: "0.95rem", fontWeight: "600", color: "var(--text-primary)" }}>{selectedEvent.location}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block" }}>Organizer</span>
                    <span style={{ fontSize: "0.95rem", fontWeight: "600", color: "var(--text-primary)" }}>{selectedEvent.organizer}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block" }}>Capacity Limit</span>
                    <span style={{ fontSize: "0.95rem", fontWeight: "600", color: "var(--text-primary)" }}>{selectedEvent.capacity ? `${selectedEvent.capacity} spots` : "Unlimited"}</span>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ flex: 1 }}
                    onClick={() => setShowEventDetailModal(false)}
                  >
                    Close
                  </button>
                  <button
                    className={`btn ${isRegistered ? "btn-secondary" : "btn-primary"}`}
                    style={{ flex: 1.2 }}
                    disabled={registeringEventId === selectedEvent.id}
                    onClick={() => handleEventRSVP(selectedEvent.id)}
                  >
                    {registeringEventId === selectedEvent.id ? "Processing..." : isRegistered ? "Cancel RSVP" : "RSVP / Register"}
                  </button>
                  {selectedEvent.link && (
                    <a
                      href={selectedEvent.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-success"
                      style={{ flex: 1.2, textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center" }}
                    >
                      Official Page ↗
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
