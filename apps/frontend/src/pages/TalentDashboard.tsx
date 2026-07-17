import React, { useState, useEffect, useCallback } from "react";
import { useSupabase } from "../context/SupabaseContext";
import { PortfolioLinksSchema, FundingOpportunity } from "@edgetalent/shared";
import { 
  LayoutDashboard, Activity, GraduationCap, Briefcase, CheckSquare, 
  Award, DollarSign, Calendar, User, X, LogOut, Menu, Search, Plus 
} from "lucide-react";

interface Question {
  id: string;
  question: string;
  options: string[];
  answer: string;
}

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

  // Quiz states
  const [frontendScore, setFrontendScore] = useState<number | null>(null);
  const [backendScore, setBackendScore] = useState<number | null>(null);
  const [aiScore, setAiScore] = useState<number | null>(null);

  // Active quiz-taking states
  const [activeQuiz, setActiveQuiz] = useState<"frontend" | "backend" | "ai" | "interests" | null>(null);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});

  const [dbQuestions, setDbQuestions] = useState<{
    frontend: Question[];
    backend: Question[];
    ai: Question[];
  }>({
    frontend: [],
    backend: [],
    ai: [],
  });

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const { data, error } = await supabase
          .from("quiz_questions")
          .select("*");
        if (!error && data) {
          const frontend: Question[] = [];
          const backend: Question[] = [];
          const ai: Question[] = [];
          
          data.forEach((q: any) => {
            const formatted: Question = {
              id: q.id,
              question: q.question,
              options: q.options,
              answer: q.answer
            };
            if (q.category === "frontend") frontend.push(formatted);
            else if (q.category === "backend") backend.push(formatted);
            else if (q.category === "ai") ai.push(formatted);
          });
          
          setDbQuestions({
            frontend,
            backend,
            ai,
          });
        }
      } catch (err) {
        console.error("Failed to load questions from database.", err);
      }
    };
    fetchQuestions();
  }, [supabase]);

  // Career Interest states
  const [targetRole, setTargetRole] = useState<string>("Fullstack Developer");
  const [workArrangement, setWorkArrangement] = useState<string>("Remote");
  const [experienceLevel, setExperienceLevel] = useState<string>("Mid-level");
  const [goals, setGoals] = useState<string>("");

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

  // LMS/Enrollment states
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [activePlayingCourse, setActivePlayingCourse] = useState<any | null>(null);
  const [courseLessons, setCourseLessons] = useState<any[]>([]);
  const [loadingCourseLessons, setLoadingCourseLessons] = useState<boolean>(false);
  const [activeLessonIdx, setActiveLessonIdx] = useState<number>(0);
  const [allLessonsSummary, setAllLessonsSummary] = useState<Record<string, number>>({});

  // Marketplace states
  const [matchedProjects, setMatchedProjects] = useState<any[]>([]);
  const [loadingProjects, setLoadingProjects] = useState<boolean>(true);
  const [applyStates, setApplyStates] = useState<Record<string, "idle" | "applying" | "applied">>({});

  // My Gigs states
  const [gigSearchQuery, setGigSearchQuery] = useState<string>("");
  const [gigFilterStatus, setGigFilterStatus] = useState<string>("all");
  const [selectedGig, setSelectedGig] = useState<any | null>(null);

  // Certificates states
  const [externalCertificates, setExternalCertificates] = useState<any[]>([]);
  const [loadingExternalCertificates, setLoadingExternalCertificates] = useState<boolean>(true);
  const [selectedEnrollmentCert, setSelectedEnrollmentCert] = useState<any | null>(null);
  const [showAddCertModal, setShowAddCertModal] = useState<boolean>(false);
  const [showEditCertModal, setShowEditCertModal] = useState<boolean>(false);
  const [selectedExternalCert, setSelectedExternalCert] = useState<any | null>(null);

  // Funding Opportunities states
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

  // Form states for external certs
  const [certName, setCertName] = useState<string>("");
  const [certIssuer, setCertIssuer] = useState<string>("");
  const [certIssueDate, setCertIssueDate] = useState<string>("");
  const [certExpiryDate, setCertExpiryDate] = useState<string>("");
  const [certCredId, setCertCredId] = useState<string>("");
  const [certCredUrl, setCertCredUrl] = useState<string>("");
  const [savingCert, setSavingCert] = useState<boolean>(false);

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
        .select("*, projects(*, profiles(full_name, email))")
        .eq("talent_id", profileId);
      if (!error && data) setApplications(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingOverview(false);
    }
  }, [profileId, supabase]);

  // Fetch user enrollments
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

  // Fetch external certificates
  const loadExternalCertificates = useCallback(async () => {
    if (!profileId) return;
    setLoadingExternalCertificates(true);
    try {
      const { data, error } = await supabase
        .from("talent_certificates")
        .select("*")
        .eq("user_id", profileId)
        .order("issue_date", { ascending: false });
      if (!error && data) {
        setExternalCertificates(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingExternalCertificates(false);
    }
  }, [profileId, supabase]);

  // Fetch funding opportunities
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
        if (profileId) {
          setEventRegistrations(data.filter((r: any) => r.user_id === profileId));
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, [profileId, supabase]);

  // RSVP handler
  const handleEventRSVP = async (eventId: string) => {
    if (!profileId) return;

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
            user_id: profileId
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

  const handleAddExternalCert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileId) return;
    if (!certName.trim() || !certIssuer.trim() || !certIssueDate) {
      alert("Please fill in Name, Organization, and Issue Date.");
      return;
    }
    setSavingCert(true);
    try {
      const { error } = await supabase
        .from("talent_certificates")
        .insert({
          user_id: profileId,
          name: certName,
          issuing_organization: certIssuer,
          issue_date: certIssueDate,
          expiration_date: certExpiryDate || null,
          credential_id: certCredId || null,
          credential_url: certCredUrl || null
        });
      if (error) {
        alert("Failed to add certificate: " + error.message);
      } else {
        setShowAddCertModal(false);
        resetCertForm();
        loadExternalCertificates();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingCert(false);
    }
  };

  const handleEditExternalCert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileId || !selectedExternalCert) return;
    if (!certName.trim() || !certIssuer.trim() || !certIssueDate) {
      alert("Please fill in Name, Organization, and Issue Date.");
      return;
    }
    setSavingCert(true);
    try {
      const { error } = await supabase
        .from("talent_certificates")
        .update({
          name: certName,
          issuing_organization: certIssuer,
          issue_date: certIssueDate,
          expiration_date: certExpiryDate || null,
          credential_id: certCredId || null,
          credential_url: certCredUrl || null
        })
        .eq("id", selectedExternalCert.id);
      if (error) {
        alert("Failed to update certificate: " + error.message);
      } else {
        setShowEditCertModal(false);
        resetCertForm();
        loadExternalCertificates();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingCert(false);
    }
  };

  const handleDeleteExternalCert = async (id: string) => {
    if (!confirm("Are you sure you want to delete this certificate?")) return;
    try {
      const { error } = await supabase
        .from("talent_certificates")
        .delete()
        .eq("id", id);
      if (error) {
        alert("Failed to delete certificate: " + error.message);
      } else {
        loadExternalCertificates();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const openEditModal = (cert: any) => {
    setSelectedExternalCert(cert);
    setCertName(cert.name || "");
    setCertIssuer(cert.issuing_organization || "");
    setCertIssueDate(cert.issue_date || "");
    setCertExpiryDate(cert.expiration_date || "");
    setCertCredId(cert.credential_id || "");
    setCertCredUrl(cert.credential_url || "");
    setShowEditCertModal(true);
  };

  const resetCertForm = () => {
    setCertName("");
    setCertIssuer("");
    setCertIssueDate("");
    setCertExpiryDate("");
    setCertCredId("");
    setCertCredUrl("");
    setSelectedExternalCert(null);
  };


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
    if (!profileId) return;
    try {
      const { error } = await supabase
        .from("course_enrollments")
        .insert({
          user_id: profileId,
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
    if (!profileId || !activePlayingCourse) return;
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
    if (activeTab === "overview" || activeTab === "gigs") loadOverview();
    if (activeTab === "upskilling") {
      loadCourses();
      loadEnrollments();
      fetchAllLessonsSummary();
    }
    if (activeTab === "marketplace") loadProjects();
    if (activeTab === "certificates") {
      loadEnrollments();
      loadExternalCertificates();
    }
    if (activeTab === "funding") {
      loadFundingOpportunities();
    }
    if (activeTab === "events") {
      loadEvents();
      loadEventRegistrations();
    }
  }, [activeTab, loadOverview, loadCourses, loadEnrollments, fetchAllLessonsSummary, loadProjects, loadExternalCertificates, loadFundingOpportunities, loadEvents, loadEventRegistrations]);

  // AI Quiz & Preferences submission Request
  const runAIAnalysis = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!profileId) return;
    setAnalyzing(true);
    setAnalyzerError("");
    setAnalysisResult(null);

    const quizResultsPayload = {
      frontend: frontendScore !== null ? { score: frontendScore } : undefined,
      backend: backendScore !== null ? { score: backendScore } : undefined,
      ai: aiScore !== null ? { score: aiScore } : undefined
    };

    const interestsPayload = {
      role: targetRole,
      workArrangement,
      experienceLevel,
      goals
    };

    try {
      const { data: result, error: invokeErr } = await supabase.functions.invoke(
        "analyze-skill-gap",
        {
          body: { quizResults: quizResultsPayload, interests: interestsPayload }
        }
      );

      if (invokeErr) {
        throw new Error(invokeErr.message || "Failed to submit assessment.");
      }

      setAnalysisResult(result);
      await fetchProfile(profileId);
    } catch (err: any) {
      setAnalyzerError(err.message || "An error occurred during assessment profile generation.");
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

  const renderStepper = (status: string) => {
    const steps = [
      { label: "Applied", active: true },
      { label: "Under Review", active: ["reviewing", "shortlisted", "accepted"].includes(status) },
      { label: "Shortlisted", active: ["shortlisted", "accepted"].includes(status) },
      { label: "Hired", active: status === "accepted" }
    ];

    if (status === "rejected") {
      return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "1rem", padding: "0 0.5rem" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
            <div style={{ width: "22px", height: "22px", borderRadius: "50%", background: "var(--color-purple)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "0.7rem", fontWeight: "bold" }}>✓</div>
            <span style={{ fontSize: "0.65rem", marginTop: "0.25rem", color: "var(--text-secondary)", fontWeight: "600" }}>Applied</span>
          </div>
          <div style={{ flex: 1, height: "2px", background: "var(--color-rose)", margin: "0 0.25rem 10px 0.25rem" }}></div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
            <div style={{ width: "22px", height: "22px", borderRadius: "50%", background: "var(--color-rose)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "0.7rem", fontWeight: "bold" }}>✕</div>
            <span style={{ fontSize: "0.65rem", marginTop: "0.25rem", color: "var(--color-rose)", fontWeight: "600" }}>Declined</span>
          </div>
        </div>
      );
    }

    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "1rem", padding: "0 0.5rem" }}>
        {steps.map((step, idx) => (
          <React.Fragment key={idx}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", zIndex: 1 }}>
              <div style={{
                width: "22px",
                height: "22px",
                borderRadius: "50%",
                background: step.active ? (idx === 3 ? "var(--color-emerald)" : "var(--color-purple)") : "var(--bg-tertiary)",
                border: `2px solid ${step.active ? (idx === 3 ? "var(--color-emerald)" : "var(--color-purple)") : "var(--glass-border)"}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: step.active ? "white" : "var(--text-muted)",
                fontSize: "0.7rem",
                fontWeight: "bold",
                boxShadow: step.active ? (idx === 3 ? "var(--glow-emerald)" : "var(--glow-purple)") : "none"
              }}>
                {step.active ? "✓" : idx + 1}
              </div>
              <span style={{
                fontSize: "0.65rem",
                marginTop: "0.25rem",
                color: step.active ? "var(--text-primary)" : "var(--text-muted)",
                fontWeight: step.active ? "600" : "400"
              }}>
                {step.label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div style={{
                flex: 1,
                height: "2px",
                background: steps[idx + 1].active ? "var(--color-purple)" : "var(--glass-border)",
                margin: "0 -8px 10px -8px"
              }}></div>
            )}
          </React.Fragment>
        ))}
      </div>
    );
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
              <X size={20} />
            </button>
          )}
        </div>

        <div className="sidebar-menu">
          {[
            { id: "overview", label: "Overview", icon: <LayoutDashboard size={20} /> },
            { id: "analyzer", label: "Skills & Interests", icon: <Activity size={20} /> },
            { id: "upskilling", label: "Upskilling", icon: <GraduationCap size={20} /> },
            { id: "marketplace", label: "Marketplace", icon: <Briefcase size={20} /> },
            { id: "gigs", label: "My Gigs", icon: <CheckSquare size={20} /> },
            { id: "certificates", label: "Certificates", icon: <Award size={20} /> },
            { id: "funding", label: "Funding Opportunities", icon: <DollarSign size={20} /> },
            { id: "events", label: "Events", icon: <Calendar size={20} /> },
            { id: "profile", label: "My Profile", icon: <User size={20} /> }
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
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="dashboard-main">
        <header className="dashboard-header">
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <button className="hamburger-btn" onClick={toggleSidebar}>
              <Menu size={20} />
            </button>
            <h2 className="dashboard-header-title">
              {activeTab === "overview" && "Overview"}
              {activeTab === "analyzer" && "Skills & Interests"}
              {activeTab === "upskilling" && "Upskilling Hub"}
              {activeTab === "marketplace" && "Project Marketplace"}
              {activeTab === "gigs" && "My Gigs"}
              {activeTab === "certificates" && "Certificates"}
              {activeTab === "funding" && "Funding Opportunities"}
              {activeTab === "events" && "Events Hub"}
              {activeTab === "profile" && "My Profile"}
            </h2>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }} className="user-profile-menu">
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

          {/* Skills & Interests Quiz */}
          {activeTab === "analyzer" && (
            <div className="animate-fade-in">
              {activeQuiz === null ? (
                <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "2rem" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                    <div className="glass-panel" style={{ padding: "2rem" }}>
                      <h3>Skills & Interests Assessment</h3>
                      <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
                        Complete the technical quizzes and define your career interests. Your scores and selections will determine your verified skills, identify upskilling gaps, and unlock project matching in the marketplace.
                      </p>

                      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                        {/* Frontend Quiz Card */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--glass-border)", paddingBottom: "1rem" }}>
                          <div>
                            <h4 style={{ margin: 0, fontSize: "1.1rem" }}>Frontend Development Quiz</h4>
                            <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                              Test React, TypeScript, HTML/CSS, and state hooks. (5 Questions)
                            </p>
                          </div>
                          <div>
                            {frontendScore !== null ? (
                              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                                <span className={`badge ${frontendScore >= 3 ? "badge-emerald" : "badge-rose"}`} style={{ fontSize: "0.8rem" }}>
                                  Score: {frontendScore}/5 ({frontendScore >= 3 ? "Passed" : "Fail"})
                                </span>
                                <button className="btn btn-secondary" style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem" }} onClick={() => { setActiveQuiz("frontend"); setCurrentQuestionIdx(0); setSelectedAnswers({}); }} id="btn-quiz-frontend-retake">
                                  Retake
                                </button>
                              </div>
                            ) : (
                              <button className="btn btn-primary" style={{ padding: "0.5rem 1rem", fontSize: "0.85rem" }} onClick={() => { setActiveQuiz("frontend"); setCurrentQuestionIdx(0); setSelectedAnswers({}); }} id="btn-quiz-frontend-start">
                                Start Quiz
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Backend Quiz Card */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--glass-border)", paddingBottom: "1rem" }}>
                          <div>
                            <h4 style={{ margin: 0, fontSize: "1.1rem" }}>Backend Development Quiz</h4>
                            <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                              Test Node.js, relational databases, REST APIs, and npm. (5 Questions)
                            </p>
                          </div>
                          <div>
                            {backendScore !== null ? (
                              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                                <span className={`badge ${backendScore >= 3 ? "badge-emerald" : "badge-rose"}`} style={{ fontSize: "0.8rem" }}>
                                  Score: {backendScore}/5 ({backendScore >= 3 ? "Passed" : "Fail"})
                                </span>
                                <button className="btn btn-secondary" style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem" }} onClick={() => { setActiveQuiz("backend"); setCurrentQuestionIdx(0); setSelectedAnswers({}); }} id="btn-quiz-backend-retake">
                                  Retake
                                </button>
                              </div>
                            ) : (
                              <button className="btn btn-primary" style={{ padding: "0.5rem 1rem", fontSize: "0.85rem" }} onClick={() => { setActiveQuiz("backend"); setCurrentQuestionIdx(0); setSelectedAnswers({}); }} id="btn-quiz-backend-start">
                                Start Quiz
                              </button>
                            )}
                          </div>
                        </div>

                        {/* AI Quiz Card */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--glass-border)", paddingBottom: "1rem" }}>
                          <div>
                            <h4 style={{ margin: 0, fontSize: "1.1rem" }}>AI & Data Science Quiz</h4>
                            <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                              Test Python, PyTorch, vector databases, LLMs, and prompts. (5 Questions)
                            </p>
                          </div>
                          <div>
                            {aiScore !== null ? (
                              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                                <span className={`badge ${aiScore >= 3 ? "badge-emerald" : "badge-rose"}`} style={{ fontSize: "0.8rem" }}>
                                  Score: {aiScore}/5 ({aiScore >= 3 ? "Passed" : "Fail"})
                                </span>
                                <button className="btn btn-secondary" style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem" }} onClick={() => { setActiveQuiz("ai"); setCurrentQuestionIdx(0); setSelectedAnswers({}); }} id="btn-quiz-ai-retake">
                                  Retake
                                </button>
                              </div>
                            ) : (
                              <button className="btn btn-primary" style={{ padding: "0.5rem 1rem", fontSize: "0.85rem" }} onClick={() => { setActiveQuiz("ai"); setCurrentQuestionIdx(0); setSelectedAnswers({}); }} id="btn-quiz-ai-start">
                                Start Quiz
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Career Interests Card */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "0.5rem" }}>
                          <div>
                            <h4 style={{ margin: 0, fontSize: "1.1rem" }}>Career Preferences</h4>
                            <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                              Define your role target, arrangement preferences, and career goals.
                            </p>
                          </div>
                          <div>
                            <button className="btn btn-primary" style={{ padding: "0.5rem 1rem", fontSize: "0.85rem" }} onClick={() => setActiveQuiz("interests")} id="btn-quiz-interests-start">
                              Configure Preferences
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="glass-panel" style={{ padding: "2rem" }}>
                      <h3>Generate Profile</h3>
                      <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "1.5rem" }}>
                        Submit your combined quiz results and preferences to run vector analysis, which computes your profile biography and matches you against marketplace projects.
                      </p>

                      <button
                        className="btn btn-success"
                        style={{ width: "100%" }}
                        onClick={() => runAIAnalysis()}
                        disabled={analyzing || (frontendScore === null && backendScore === null && aiScore === null)}
                        id="btn-submit-quiz-interests"
                      >
                        {analyzing ? "Generating Profile..." : "Submit Quiz & Interests"}
                      </button>
                      {(frontendScore === null && backendScore === null && aiScore === null) && (
                        <p style={{ color: "var(--color-rose)", fontSize: "0.75rem", marginTop: "0.5rem", textAlign: "center" }}>
                          ⚠️ Please take at least one quiz before submitting.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Analyzer Results (Right side) */}
                  <div className="glass-panel" style={{ padding: "2rem" }}>
                    <h3>Assessment Results</h3>
                    {analyzing ? (
                      <div style={{ padding: "3rem 0", textAlign: "center" }}>
                        <p style={{ color: "var(--text-secondary)", marginBottom: "1rem" }}>Generating your verified profiles and computing project match scoring...</p>
                        <div className="badge badge-cyan">Connecting...</div>
                      </div>
                    ) : analyzerError ? (
                      <div className="badge badge-rose" style={{ display: "block", padding: "1rem" }}>
                        {analyzerError}
                      </div>
                    ) : analysisResult || profile?.skills_embedding ? (
                      <div>
                        <h4 style={{ color: "var(--color-cyan)", marginBottom: "0.5rem" }}>Generated Profile Bio</h4>
                        <p style={{ fontSize: "0.95rem", lineHeight: "1.5", color: "var(--text-secondary)", marginBottom: "1.5rem" }} id="profile-bio-text">
                          {analysisResult?.bio || profile?.bio || "No bio summary generated."}
                        </p>

                        <h4 style={{ color: "var(--color-emerald)", marginBottom: "0.5rem" }}>Verified Skills</h4>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1.5rem" }} id="verified-skills-list">
                          {(analysisResult?.skills || profile?.skills || []).map((skill: string, i: number) => (
                            <span key={i} className="badge badge-emerald">{skill}</span>
                          ))}
                        </div>

                        <h4 style={{ color: "var(--color-rose)", marginBottom: "0.5rem" }}>Skill Gaps Identified</h4>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }} id="skill-gaps-list">
                          {(analysisResult?.skill_gaps || profile?.skill_gaps || []).map((gap: string, i: number) => (
                            <span key={i} className="badge badge-rose">{gap}</span>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p style={{ color: "var(--text-secondary)" }}>Complete a quiz and submit the form to generate your skill and interest profile.</p>
                    )}
                  </div>
                </div>
              ) : activeQuiz === "interests" ? (
                /* Career Interests Config Panel */
                <div className="glass-panel animate-fade-in" style={{ padding: "2.5rem", maxWidth: "600px", margin: "0 auto" }}>
                  <h3>Configure Career Preferences</h3>
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: "2rem" }}>
                    Select your preferred alignment to feed into your matching profile.
                  </p>

                  <div className="form-group">
                    <label>Target Role Alignment</label>
                    <select className="form-select" value={targetRole} onChange={(e) => setTargetRole(e.target.value)} id="select-interest-role">
                      <option value="Fullstack Developer">Fullstack Developer</option>
                      <option value="AI Engineer">AI Engineer</option>
                      <option value="Cloud Architect">Cloud Architect</option>
                      <option value="DevOps Specialist">DevOps Specialist</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Preferred Work Arrangement</label>
                    <select className="form-select" value={workArrangement} onChange={(e) => setWorkArrangement(e.target.value)} id="select-interest-arrangement">
                      <option value="Remote">Remote</option>
                      <option value="Hybrid">Hybrid</option>
                      <option value="Onsite">Onsite</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Experience Level</label>
                    <select className="form-select" value={experienceLevel} onChange={(e) => setExperienceLevel(e.target.value)} id="select-interest-experience">
                      <option value="Junior">Junior</option>
                      <option value="Mid-level">Mid-level</option>
                      <option value="Senior">Senior</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Primary Career Goals</label>
                    <textarea
                      className="form-input"
                      style={{ height: "100px", resize: "none" }}
                      placeholder="Describe what projects or tech stack you want to focus on..."
                      value={goals}
                      onChange={(e) => setGoals(e.target.value)}
                      id="input-interest-goals"
                    />
                  </div>

                  <div style={{ display: "flex", gap: "1rem", marginTop: "2rem" }}>
                    <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setActiveQuiz(null)}>
                      Cancel
                    </button>
                    <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => setActiveQuiz(null)} id="btn-save-interests">
                      Save Preferences
                    </button>
                  </div>
                </div>
              ) : (
                /* Technical Quiz Taking Panel */
                (() => {
                  const questions = activeQuiz === "frontend" ? dbQuestions.frontend : activeQuiz === "backend" ? dbQuestions.backend : dbQuestions.ai;
                  const currentQuestion = questions[currentQuestionIdx];
                  const progressPct = Math.round((currentQuestionIdx / questions.length) * 100);

                  return (
                    <div className="glass-panel animate-fade-in" style={{ padding: "2.5rem", maxWidth: "700px", margin: "0 auto" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                        <span className="badge badge-cyan" style={{ textTransform: "uppercase" }}>
                          {activeQuiz} Quiz
                        </span>
                        <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 600 }}>
                          Question {currentQuestionIdx + 1} of {questions.length}
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div style={{ width: "100%", height: "6px", background: "var(--bg-tertiary)", borderRadius: "3px", marginBottom: "2rem", overflow: "hidden" }}>
                        <div style={{ width: `${progressPct}%`, height: "100%", background: "var(--color-cyan)", transition: "width 0.3s ease" }} />
                      </div>

                      <h3 style={{ fontSize: "1.35rem", marginBottom: "1.5rem", color: "var(--text-primary)" }}>
                        {currentQuestion.question}
                      </h3>

                      {/* Options */}
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "2rem" }}>
                        {currentQuestion.options.map((option, idx) => {
                          const isSelected = selectedAnswers[currentQuestionIdx] === option;
                          return (
                            <button
                              key={idx}
                              onClick={() => setSelectedAnswers(prev => ({ ...prev, [currentQuestionIdx]: option }))}
                              className={`form-input quiz-option-btn-${currentQuestionIdx}-${idx}`}
                              style={{
                                textAlign: "left",
                                padding: "1rem 1.25rem",
                                borderRadius: "var(--radius-sm)",
                                border: isSelected ? "2px solid var(--color-cyan)" : "1px solid var(--glass-border)",
                                background: isSelected ? "rgba(8, 145, 178, 0.05)" : "var(--bg-secondary)",
                                cursor: "pointer",
                                fontSize: "0.95rem",
                                fontWeight: isSelected ? 600 : 400,
                                transition: "all 0.2s ease"
                              }}
                            >
                              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                <div style={{
                                  width: "18px",
                                  height: "18px",
                                  borderRadius: "50%",
                                  border: isSelected ? "5px solid var(--color-cyan)" : "2px solid var(--text-muted)",
                                  background: "var(--bg-secondary)",
                                  transition: "all 0.15s ease"
                                }} />
                                <span>{option}</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "2rem" }}>
                        <button
                          className="btn btn-secondary"
                          onClick={() => setCurrentQuestionIdx(prev => Math.max(0, prev - 1))}
                          disabled={currentQuestionIdx === 0}
                          id="btn-quiz-prev"
                        >
                          Previous
                        </button>
                        {currentQuestionIdx < questions.length - 1 ? (
                          <button
                            className="btn btn-primary"
                            onClick={() => setCurrentQuestionIdx(prev => prev + 1)}
                            disabled={!selectedAnswers[currentQuestionIdx]}
                            id="btn-quiz-next"
                          >
                            Next
                          </button>
                        ) : (
                          <button
                            className="btn btn-success"
                            onClick={() => {
                              // Calculate score
                              let score = 0;
                              questions.forEach((q, idx) => {
                                if (selectedAnswers[idx] === q.answer) {
                                  score++;
                                }
                              });
                              if (activeQuiz === "frontend") setFrontendScore(score);
                              if (activeQuiz === "backend") setBackendScore(score);
                              if (activeQuiz === "ai") setAiScore(score);

                              // Clear active quiz
                              setActiveQuiz(null);
                            }}
                            disabled={!selectedAnswers[currentQuestionIdx]}
                            id="btn-quiz-finish"
                          >
                            Finish Quiz
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })()
              )}
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
                  {courses.map((course) => {
                    const enrollment = enrollments.find(e => e.course_id === course.id);
                    const totalLessons = allLessonsSummary[course.id] || 0;
                    const completedLessons = enrollment?.completed_lessons?.length || 0;
                    const progressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

                    return (
                      <div key={course.id} className="glass-panel animate-fade-in" style={{ padding: "2rem", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                        <div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                            <span className="badge badge-emerald">{course.provider}</span>
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
                            <button
                              className="btn btn-primary"
                              style={{ width: "100%" }}
                              onClick={() => handleStartCourse(course)}
                            >
                              {progressPercent === 100 ? "Review Lessons" : "Continue Lessons"}
                            </button>
                          ) : (
                            <button
                              className="btn btn-primary"
                              style={{ width: "100%" }}
                              onClick={() => handleEnrollCourse(course.id)}
                            >
                              Enroll in Course
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
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

          {/* My Gigs Workspace */}
          {activeTab === "gigs" && (
            <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
              {/* Stats Summary Cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.5rem" }}>
                <div className="glass-panel" style={{ padding: "1.5rem" }}>
                  <h4 style={{ color: "var(--text-secondary)", marginBottom: "0.5rem", fontSize: "0.85rem", textTransform: "uppercase" }}>Total Applications</h4>
                  <p style={{ fontSize: "2rem", fontWeight: "bold", color: "var(--color-purple)", margin: 0 }}>
                    {applications.length}
                  </p>
                </div>
                <div className="glass-panel" style={{ padding: "1.5rem" }}>
                  <h4 style={{ color: "var(--text-secondary)", marginBottom: "0.5rem", fontSize: "0.85rem", textTransform: "uppercase" }}>Active Gigs</h4>
                  <p style={{ fontSize: "2rem", fontWeight: "bold", color: "var(--color-emerald)", margin: 0 }}>
                    {applications.filter(a => a.status === "accepted").length}
                  </p>
                </div>
                <div className="glass-panel" style={{ padding: "1.5rem" }}>
                  <h4 style={{ color: "var(--text-secondary)", marginBottom: "0.5rem", fontSize: "0.85rem", textTransform: "uppercase" }}>Shortlisted</h4>
                  <p style={{ fontSize: "2rem", fontWeight: "bold", color: "var(--color-amber)", margin: 0 }}>
                    {applications.filter(a => a.status === "shortlisted").length}
                  </p>
                </div>
                <div className="glass-panel" style={{ padding: "1.5rem" }}>
                  <h4 style={{ color: "var(--text-secondary)", marginBottom: "0.5rem", fontSize: "0.85rem", textTransform: "uppercase" }}>Under Review</h4>
                  <p style={{ fontSize: "2rem", fontWeight: "bold", color: "var(--color-cyan)", margin: 0 }}>
                    {applications.filter(a => a.status === "reviewing").length}
                  </p>
                </div>
              </div>

              {/* Filters & Search Control Bar */}
              <div className="glass-panel" style={{ padding: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1.5rem" }}>
                {/* Search */}
                <div style={{ position: "relative", flex: 1, minWidth: "280px" }}>
                  <span style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", display: "flex", alignItems: "center" }}>
                    <Search size={18} />
                  </span>
                  <input
                    type="text"
                    placeholder="Search by gig title, description, or client..."
                    value={gigSearchQuery}
                    onChange={(e) => setGigSearchQuery(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.75rem 1rem 0.75rem 2.8rem",
                      background: "rgba(255, 255, 255, 0.4)",
                      border: "1px solid var(--glass-border)",
                      borderRadius: "var(--radius-sm)",
                      color: "var(--text-primary)",
                      fontSize: "0.95rem",
                      outline: "none",
                      transition: "border-color 0.2s"
                    }}
                    onFocus={(e) => e.target.style.borderColor = "var(--color-cyan)"}
                    onBlur={(e) => e.target.style.borderColor = "var(--glass-border)"}
                  />
                </div>

                {/* Filters */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                  {[
                    { id: "all", label: "All" },
                    { id: "active", label: "Active" },
                    { id: "shortlisted", label: "Shortlisted" },
                    { id: "reviewing", label: "In Review" },
                    { id: "applied", label: "Applied" },
                    { id: "rejected", label: "Declined" }
                  ].map((filter) => {
                    let count = 0;
                    if (filter.id === "all") count = applications.length;
                    else if (filter.id === "active") count = applications.filter(a => a.status === "accepted").length;
                    else if (filter.id === "reviewing") count = applications.filter(a => a.status === "reviewing").length;
                    else count = applications.filter(a => a.status === filter.id).length;

                    const isActive = gigFilterStatus === filter.id;
                    return (
                      <button
                        key={filter.id}
                        onClick={() => setGigFilterStatus(filter.id)}
                        style={{
                          padding: "0.5rem 1rem",
                          borderRadius: "9999px",
                          border: "1px solid",
                          borderColor: isActive ? "var(--color-cyan)" : "var(--glass-border)",
                          background: isActive ? "rgba(8, 145, 178, 0.1)" : "transparent",
                          color: isActive ? "var(--color-cyan)" : "var(--text-secondary)",
                          fontWeight: "600",
                          fontSize: "0.85rem",
                          cursor: "pointer",
                          transition: "all 0.2s ease"
                        }}
                      >
                        {filter.label} <span style={{ opacity: 0.6, fontSize: "0.75rem", marginLeft: "0.25rem" }}>({count})</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Main Content Area */}
              {loadingOverview ? (
                <div className="glass-panel" style={{ padding: "3rem", textAlign: "center" }}>
                  <p style={{ color: "var(--text-secondary)" }}>Loading your gigs portfolio...</p>
                </div>
              ) : applications.length === 0 ? (
                <div className="glass-panel" style={{ padding: "4rem 2rem", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "1.5rem" }}>
                  <div style={{ fontSize: "4rem" }}>💼</div>
                  <div>
                    <h3 style={{ marginBottom: "0.5rem" }}>Start your industrial gig journey!</h3>
                    <p style={{ color: "var(--text-secondary)", maxWidth: "500px", margin: "0 auto" }}>
                      You haven't applied to any projects yet. Check out the project marketplace to find high-match industrial projects.
                    </p>
                  </div>
                  <button className="btn btn-primary" onClick={() => setActiveTab("marketplace")}>
                    Browse Marketplace
                  </button>
                </div>
              ) : (
                (() => {
                  const filtered = applications.filter((app) => {
                    const project = app.projects || {};
                    const titleMatch = (project.title || "").toLowerCase().includes(gigSearchQuery.toLowerCase());
                    const descMatch = (project.description || "").toLowerCase().includes(gigSearchQuery.toLowerCase());
                    
                    const partner = project.profiles || {};
                    const partnerMatch = (partner.full_name || "").toLowerCase().includes(gigSearchQuery.toLowerCase());
                    
                    const matchesSearch = titleMatch || descMatch || partnerMatch;

                    if (!matchesSearch) return false;

                    if (gigFilterStatus === "all") return true;
                    if (gigFilterStatus === "active") return app.status === "accepted";
                    if (gigFilterStatus === "reviewing") return app.status === "reviewing";
                    return app.status === gigFilterStatus;
                  });

                  if (filtered.length === 0) {
                    return (
                      <div className="glass-panel" style={{ padding: "3rem", textAlign: "center", color: "var(--text-secondary)" }}>
                        No gigs match your search or filter criteria.
                      </div>
                    );
                  }

                  return (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem" }}>
                      {filtered.map((app) => {
                        const project = app.projects || {};
                        const partnerName = project.profiles?.full_name || "EdgeTalent Partner";
                        const showContact = ["accepted", "shortlisted"].includes(app.status);
                        
                        return (
                          <div
                            key={app.id}
                            className="glass-panel gig-card-hover"
                            style={{
                              padding: "2rem",
                              display: "flex",
                              flexDirection: "column",
                              justifyContent: "space-between",
                              gap: "1.5rem",
                              position: "relative",
                              overflow: "hidden"
                            }}
                          >
                            <div>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                                <span className={`badge ${
                                  app.status === "accepted" ? "badge-emerald" : 
                                  app.status === "rejected" ? "badge-rose" : 
                                  app.status === "shortlisted" ? "badge-amber" : 
                                  app.status === "reviewing" ? "badge-cyan" : "badge-purple"
                                }`}>
                                  {app.status === "accepted" ? "Hired" : app.status}
                                </span>

                                {app.match_percentage && (
                                  <span className="badge badge-cyan" style={{ fontSize: "0.7rem" }}>
                                    {app.match_percentage}% AI Match
                                  </span>
                                )}
                              </div>

                              <h3 style={{ fontSize: "1.25rem", marginBottom: "0.5rem", color: "var(--text-primary)" }}>{project.title}</h3>
                              
                              <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "1rem" }}>
                                <b>Partner:</b> {showContact ? partnerName : "EdgeTalent Client (Hidden)"}
                              </p>

                              <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden", textOverflow: "ellipsis", marginBottom: "1rem", lineHeight: "1.5" }}>
                                {project.description}
                              </p>

                              <div style={{ display: "flex", gap: "1rem", fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                                <span>⏱️ <b>{project.scope}</b></span>
                                <span>💰 <b>${project.budget}</b></span>
                              </div>
                            </div>

                            <div>
                              {renderStepper(app.status)}

                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1.5rem", paddingTop: "1rem", borderTop: "1px solid var(--glass-border)" }}>
                                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                                  Applied {new Date(app.applied_at).toLocaleDateString()}
                                </span>
                                <button
                                  className="btn btn-secondary"
                                  onClick={() => setSelectedGig(app)}
                                  style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem" }}
                                >
                                  Details
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()
              )}
            </div>
          )}

          {/* Certificates Workspace */}
          {activeTab === "certificates" && (
            <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
              {/* Header */}
              <div className="glass-panel" style={{ padding: "2rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1.5rem" }}>
                <div>
                  <h3 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>My Credentials & Certificates</h3>
                  <p style={{ color: "var(--text-secondary)" }}>
                    Verify your expertise with official platform credentials and external industry certifications.
                  </p>
                </div>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    resetCertForm();
                    setShowAddCertModal(true);
                  }}
                >
                  <Plus size={18} style={{ marginRight: "0.25rem" }} />
                  Add Certification
                </button>
              </div>

              {/* Stats Summary Cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.5rem" }}>
                {(() => {
                  const completedCount = enrollments.filter(e => e.completed_at).length;
                  const externalCount = externalCertificates.length;
                  
                  // Compute unique skills taught across all completed platform courses
                  const platformSkillsSet = new Set<string>();
                  enrollments.forEach(e => {
                    if (e.completed_at && e.courses?.skills_taught) {
                      e.courses.skills_taught.forEach((s: string) => platformSkillsSet.add(s));
                    }
                  });
                  const verifiedSkillsCount = platformSkillsSet.size;

                  return (
                    <>
                      <div className="glass-panel" style={{ padding: "1.5rem", display: "flex", alignItems: "center", gap: "1rem" }}>
                        <div style={{ background: "rgba(124, 58, 237, 0.1)", color: "var(--color-purple)", width: "48px", height: "48px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem" }}>
                          🎓
                        </div>
                        <div>
                          <div style={{ fontSize: "1.5rem", fontWeight: "bold" }}>{completedCount}</div>
                          <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Platform Certificates</div>
                        </div>
                      </div>

                      <div className="glass-panel" style={{ padding: "1.5rem", display: "flex", alignItems: "center", gap: "1rem" }}>
                        <div style={{ background: "rgba(8, 145, 178, 0.1)", color: "var(--color-cyan)", width: "48px", height: "48px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem" }}>
                          🏆
                        </div>
                        <div>
                          <div style={{ fontSize: "1.5rem", fontWeight: "bold" }}>{externalCount}</div>
                          <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>External Certifications</div>
                        </div>
                      </div>

                      <div className="glass-panel" style={{ padding: "1.5rem", display: "flex", alignItems: "center", gap: "1rem" }}>
                        <div style={{ background: "rgba(5, 150, 105, 0.1)", color: "var(--color-emerald)", width: "48px", height: "48px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem" }}>
                          ✓
                        </div>
                        <div>
                          <div style={{ fontSize: "1.5rem", fontWeight: "bold" }}>{verifiedSkillsCount}</div>
                          <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Verified Platform Skills</div>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* Platform Certificates Section */}
              <div>
                <h4 style={{ fontSize: "1.2rem", marginBottom: "1rem", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span>🎓</span> Platform Certificates of Completion
                </h4>
                {(() => {
                  const completedEnrollments = enrollments.filter(e => e.completed_at);
                  if (completedEnrollments.length === 0) {
                    return (
                      <div className="glass-panel" style={{ padding: "3rem", textAlign: "center" }}>
                        <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
                          You haven't completed any academy courses yet.
                        </p>
                        <button className="btn btn-primary" onClick={() => setActiveTab("upskilling")}>
                          Explore Upskilling Hub
                        </button>
                      </div>
                    );
                  }

                  return (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem" }}>
                      {completedEnrollments.map((enrollment) => {
                        const course = enrollment.courses || {};
                        return (
                          <div key={enrollment.id} className="glass-panel" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: "200px" }}>
                            <div>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                                <span className="badge badge-emerald" style={{ fontSize: "0.7rem" }}>{course.provider || "EdgeTalent Academy"}</span>
                                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                                  {new Date(enrollment.completed_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                                </span>
                              </div>
                              <h5 style={{ fontSize: "1.1rem", marginBottom: "0.5rem", color: "var(--text-primary)" }}>{course.title || "Academy Course"}</h5>
                              <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "1rem" }}>
                                Credential ID: <span style={{ fontFamily: "monospace", fontSize: "0.75rem" }}>{enrollment.id.slice(0, 8)}...</span>
                              </p>
                              
                              {course.skills_taught && (
                                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem", marginBottom: "1rem" }}>
                                  {course.skills_taught.map((skill: string, idx: number) => (
                                    <span key={idx} className="badge badge-cyan" style={{ fontSize: "0.65rem" }}>{skill}</span>
                                  ))}
                                </div>
                              )}
                            </div>

                            <button
                              className="btn btn-secondary"
                              style={{ width: "100%", fontSize: "0.85rem", padding: "0.5rem" }}
                              onClick={() => setSelectedEnrollmentCert(enrollment)}
                            >
                              📜 View Certificate
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>

              {/* External Certificates Section */}
              <div>
                <h4 style={{ fontSize: "1.2rem", marginBottom: "1rem", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span>🏆</span> External Certifications
                </h4>
                {loadingExternalCertificates ? (
                  <p style={{ color: "var(--text-secondary)" }}>Loading external certifications...</p>
                ) : externalCertificates.length === 0 ? (
                  <div className="glass-panel" style={{ padding: "3rem", textAlign: "center" }}>
                    <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
                      No external certifications added yet. Show off your industry credentials!
                    </p>
                    <button
                      className="btn btn-secondary"
                      onClick={() => {
                        resetCertForm();
                        setShowAddCertModal(true);
                      }}
                    >
                      Add Industry Credential
                    </button>
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem" }}>
                    {externalCertificates.map((cert) => (
                      <div key={cert.id} className="glass-panel" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: "200px" }}>
                        <div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                            <h5 style={{ fontSize: "1.1rem", color: "var(--text-primary)", margin: 0 }}>{cert.name}</h5>
                            <div style={{ display: "flex", gap: "0.25rem" }} className="no-print">
                              <button
                                onClick={() => openEditModal(cert)}
                                style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-secondary)", padding: "0.2rem" }}
                                title="Edit Certification"
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => handleDeleteExternalCert(cert.id)}
                                style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--color-rose)", padding: "0.2rem" }}
                                title="Delete Certification"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                          <p style={{ fontSize: "0.9rem", fontWeight: "600", color: "var(--color-cyan)", marginBottom: "0.5rem" }}>
                            {cert.issuing_organization}
                          </p>
                          <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>
                            Issued: <b>{new Date(cert.issue_date).toLocaleDateString(undefined, { year: 'numeric', month: 'short' })}</b>
                            {cert.expiration_date && (
                              <> | Expires: <b>{new Date(cert.expiration_date).toLocaleDateString(undefined, { year: 'numeric', month: 'short' })}</b></>
                            )}
                          </div>
                          {cert.credential_id && (
                            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>
                              Credential ID: <span style={{ fontFamily: "monospace" }}>{cert.credential_id}</span>
                            </p>
                          )}
                        </div>

                        {cert.credential_url && (
                          <a
                            href={cert.credential_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-secondary"
                            style={{ width: "100%", fontSize: "0.85rem", padding: "0.5rem", textDecoration: "none" }}
                          >
                            🔗 Verify Credential
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
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
                      // Profile fit mock calculation
                      let fitPercent = 0;
                      if (profile && profile.skills) {
                        const userSkills = profile.skills.map((s: string) => s.toLowerCase());
                        const text = (opp.title + " " + opp.description + " " + opp.content).toLowerCase();
                        let matches = 0;
                        userSkills.forEach((s: string) => {
                          if (text.includes(s)) matches++;
                        });
                        fitPercent = userSkills.length > 0 ? Math.min(100, Math.round(40 + (matches / userSkills.length) * 60)) : 50;
                      } else {
                        fitPercent = 50;
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
                  Join webinars, hackathons, and interactive networking nights hosted by industry leaders and community organizers.
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
              <span className="badge badge-emerald" style={{ fontSize: "0.75rem", marginBottom: "0.25rem" }}>
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

      {/* Gig Details Modal */}
      {selectedGig && (
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
        >
          <div className="glass-panel animate-fade-in" style={{ width: "90%", maxWidth: "700px", padding: "2.5rem", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
              <div>
                <span className={`badge ${
                  selectedGig.status === "accepted" ? "badge-emerald" : 
                  selectedGig.status === "rejected" ? "badge-rose" : 
                  selectedGig.status === "shortlisted" ? "badge-amber" : 
                  selectedGig.status === "reviewing" ? "badge-cyan" : "badge-purple"
                }`} style={{ marginBottom: "0.5rem" }}>
                  {selectedGig.status === "accepted" ? "Hired" : selectedGig.status}
                </span>
                <h3 style={{ margin: 0, fontSize: "1.75rem", color: "var(--text-primary)" }}>{selectedGig.projects?.title}</h3>
              </div>
              <button
                className="hamburger-btn"
                onClick={() => setSelectedGig(null)}
                style={{ padding: "0.25rem", cursor: "pointer", border: "none", background: "transparent", color: "var(--text-primary)" }}
              >
                <X size={24} />
              </button>
            </div>

            <div style={{ background: "rgba(255, 255, 255, 0.3)", padding: "1.5rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--glass-border)", marginBottom: "2rem" }}>
              <h4 style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "0.5rem", textTransform: "uppercase" }}>Application Stage</h4>
              {renderStepper(selectedGig.status)}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                <div className="glass-panel" style={{ padding: "1rem", background: "rgba(255, 255, 255, 0.4)" }}>
                  <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>⏱ Scope</span>
                  <p style={{ fontSize: "1.1rem", fontWeight: "bold", margin: "0.25rem 0 0 0" }}>{selectedGig.projects?.scope}</p>
                </div>
                <div className="glass-panel" style={{ padding: "1rem", background: "rgba(255, 255, 255, 0.4)" }}>
                  <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>💰 Budget</span>
                  <p style={{ fontSize: "1.1rem", fontWeight: "bold", margin: "0.25rem 0 0 0" }}>${selectedGig.projects?.budget}</p>
                </div>
              </div>

              <div>
                <h4 style={{ fontSize: "1rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>Description</h4>
                <p style={{ fontSize: "0.95rem", color: "var(--text-primary)", lineHeight: "1.6", whiteSpace: "pre-wrap" }}>
                  {selectedGig.projects?.description}
                </p>
              </div>

              <div>
                <h4 style={{ fontSize: "1rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>Required Skills</h4>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                  {selectedGig.projects?.required_skills?.map((skill: string, idx: number) => (
                    <span key={idx} className="badge badge-purple" style={{ fontSize: "0.75rem" }}>
                      {skill}
                    </span>
                  )) || <span style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>None specified</span>}
                </div>
              </div>

              {selectedGig.match_percentage && (
                <div className="glass-panel" style={{ padding: "1.5rem", background: "rgba(8, 145, 178, 0.04)" }}>
                  <h4 style={{ fontSize: "1rem", color: "var(--color-cyan)", marginBottom: "0.5rem" }}>AI Fit Assessment</h4>
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "0.5rem" }}>
                    <span style={{ fontSize: "1.5rem", fontWeight: "bold", color: "var(--color-cyan)" }}>{selectedGig.match_percentage}%</span>
                    <div style={{ flex: 1, height: "8px", background: "rgba(8, 145, 178, 0.1)", borderRadius: "4px", overflow: "hidden" }}>
                      <div style={{ width: `${selectedGig.match_percentage}%`, height: "100%", background: "var(--color-cyan)" }}></div>
                    </div>
                  </div>
                  <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", margin: 0 }}>
                    Our AI has matched your profile skills, experience, and interests against the client requirements.
                  </p>
                </div>
              )}

              <div style={{ borderTop: "1px solid var(--glass-border)", paddingTop: "1.5rem", marginTop: "1rem" }}>
                {["accepted", "shortlisted"].includes(selectedGig.status) ? (
                  <div className="glass-panel" style={{ padding: "1.5rem", background: "rgba(5, 150, 105, 0.04)", border: "1px solid rgba(5, 150, 105, 0.2)" }}>
                    <h4 style={{ fontSize: "1.1rem", color: "var(--color-emerald)", marginBottom: "0.75rem" }}>🎉 Client Contact Details Unlocked!</h4>
                    <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "1rem" }}>
                      Congratulations! The partner client has shortlisted or accepted your application. You can reach out directly to coordinate deliverables:
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1rem" }}>
                      <span style={{ fontSize: "0.9rem" }}>👤 <b>Name:</b> {selectedGig.projects?.profiles?.full_name || "EdgeTalent Partner"}</span>
                      <span style={{ fontSize: "0.9rem" }}>✉️ <b>Email:</b> <a href={`mailto:${selectedGig.projects?.profiles?.email}`} style={{ color: "var(--color-cyan)", textDecoration: "underline" }}>{selectedGig.projects?.profiles?.email}</a></span>
                    </div>
                    <a
                      href={`mailto:${selectedGig.projects?.profiles?.email}?subject=Regarding Project: ${encodeURIComponent(selectedGig.projects?.title || "")}`}
                      className="btn btn-success"
                      style={{ width: "100%" }}
                    >
                      Email Client
                    </a>
                  </div>
                ) : (
                  <div className="glass-panel" style={{ padding: "1.5rem", background: "rgba(0, 0, 0, 0.02)", textAlign: "center" }}>
                    <h4 style={{ fontSize: "1rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>🔒 Contact Info Locked</h4>
                    <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: 0 }}>
                      Client details and direct contact details will unlock automatically once your application is shortlisted or accepted.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "2rem" }}>
              <button className="btn btn-secondary" onClick={() => setSelectedGig(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Platform Certificate PDF/Print Viewer Modal */}
      {selectedEnrollmentCert && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1001,
          }}
          className="no-print-backdrop"
        >
          <div
            className="glass-panel animate-fade-in"
            style={{
              width: "95%",
              maxWidth: "800px",
              padding: "2rem",
              maxHeight: "95vh",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              alignItems: "center"
            }}
          >
            {/* Modal Controls */}
            <div style={{ display: "flex", justifyContent: "space-between", width: "100%", marginBottom: "1.5rem" }} className="no-print">
              <button
                className="btn btn-success"
                onClick={() => window.print()}
              >
                🖨️ Print / Save PDF
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => setSelectedEnrollmentCert(null)}
              >
                Close
              </button>
            </div>

            {/* Certificate Print Layout */}
            <div
              className="print-certificate-container"
              style={{
                width: "100%",
                aspectRatio: "1.414", // Standard A4 ratio
                background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)", // Gorgeous premium dark theme
                color: "#f8fafc",
                border: "8px double var(--color-cyan)",
                borderRadius: "var(--radius-sm)",
                padding: "3rem",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                alignItems: "center",
                textAlign: "center",
                position: "relative",
                boxShadow: "0 20px 50px rgba(0, 0, 0, 0.3)",
                overflow: "hidden"
              }}
            >
              {/* Subtle background glow designs */}
              <div style={{ position: "absolute", width: "300px", height: "300px", background: "rgba(8, 145, 178, 0.15)", borderRadius: "50%", top: "-150px", left: "-150px", filter: "blur(50px)" }} />
              <div style={{ position: "absolute", width: "300px", height: "300px", background: "rgba(124, 58, 237, 0.15)", borderRadius: "50%", bottom: "-150px", right: "-150px", filter: "blur(50px)" }} />

              {/* Header */}
              <div style={{ zIndex: 1 }}>
                <h4 style={{ letterSpacing: "0.2em", fontSize: "0.9rem", color: "var(--color-cyan)", textTransform: "uppercase", marginBottom: "0.5rem" }}>
                  EdgeTalent Academy
                </h4>
                <div style={{ height: "2px", width: "60px", background: "var(--grad-cyan-purple)", margin: "0 auto 1.5rem auto" }} />
              </div>

              {/* Body */}
              <div style={{ zIndex: 1, display: "flex", flexDirection: "column", gap: "1rem" }}>
                <h1 style={{ fontSize: "2rem", fontWeight: "800", color: "white", letterSpacing: "-0.01em", textTransform: "uppercase" }}>
                  Certificate of Completion
                </h1>
                <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0.5rem 0" }}>
                  This is proudly presented to
                </p>
                <h2 style={{ fontSize: "2.25rem", color: "var(--color-cyan)", fontFamily: "var(--font-heading)", borderBottom: "1px solid rgba(255, 255, 255, 0.1)", paddingBottom: "0.5rem", display: "inline-block", margin: "0 auto", minWidth: "300px" }}>
                  {profile?.full_name || "Talent Member"}
                </h2>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", maxWidth: "550px", margin: "0.5rem auto 0 auto", lineHeight: "1.5" }}>
                  for successfully completing all requirements and passing the rigorous assessments for the advanced industry training program:
                </p>
                <h3 style={{ fontSize: "1.4rem", color: "white", fontWeight: "700" }}>
                  {selectedEnrollmentCert.courses?.title}
                </h3>
                
                {/* Verified skills list */}
                {selectedEnrollmentCert.courses?.skills_taught && (
                  <div style={{ marginTop: "1rem" }}>
                    <p style={{ color: "var(--text-muted)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.4rem" }}>
                      Verified Mastery in:
                    </p>
                    <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                      {selectedEnrollmentCert.courses.skills_taught.map((skill: string, idx: number) => (
                        <span key={idx} style={{ background: "rgba(8, 145, 178, 0.2)", border: "1px solid rgba(8, 145, 178, 0.4)", color: "white", padding: "0.2rem 0.5rem", borderRadius: "4px", fontSize: "0.7rem", fontWeight: "bold" }}>
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: "2rem", zIndex: 1 }}>
                {/* Date */}
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Date of Issue</div>
                  <div style={{ fontSize: "0.85rem", fontWeight: "bold", color: "white", marginTop: "0.25rem" }}>
                    {new Date(selectedEnrollmentCert.completed_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                  </div>
                </div>

                {/* Seal SVG */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <svg width="60" height="60" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="50" cy="50" r="40" fill="rgba(8, 145, 178, 0.15)" stroke="var(--color-cyan)" strokeWidth="3" />
                    <circle cx="50" cy="50" r="32" stroke="var(--color-cyan)" strokeWidth="1" strokeDasharray="3 3" />
                    <path d="M50 25L57 40H73L60 50L65 65L50 55L35 65L40 50L27 40H43L50 25Z" fill="var(--color-cyan)" />
                  </svg>
                  <span style={{ fontSize: "0.6rem", color: "var(--color-cyan)", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: "0.25rem", fontWeight: "bold" }}>Verified Seal</span>
                </div>

                {/* Authority Signature */}
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontFamily: "'Reenie Beanie', cursive, 'Brush Script MT', sans-serif", fontSize: "1.6rem", color: "var(--color-cyan)", fontStyle: "italic", lineHeight: "1", marginBottom: "-0.25rem" }}>
                    EdgeTalent Verification
                  </div>
                  <div style={{ height: "1px", width: "120px", background: "rgba(255, 255, 255, 0.2)", margin: "0.25rem 0" }} />
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Authorized Registrar</div>
                </div>
              </div>

              {/* Bottom Credential ID bar */}
              <div style={{ position: "absolute", bottom: "8px", left: "0", right: "0", display: "flex", justifyContent: "center", fontSize: "0.65rem", color: "var(--text-muted)" }}>
                Credential ID: <span style={{ fontFamily: "monospace", marginLeft: "0.25rem" }}>{selectedEnrollmentCert.id}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add External Certificate Modal */}
      {showAddCertModal && (
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
        >
          <div className="glass-panel animate-fade-in" style={{ width: "90%", maxWidth: "550px", padding: "2.5rem", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h3 style={{ margin: 0 }}>Add External Certification</h3>
              <button
                className="hamburger-btn"
                onClick={() => {
                  setShowAddCertModal(false);
                  resetCertForm();
                }}
                style={{ padding: "0.25rem", cursor: "pointer", border: "none", background: "transparent", color: "var(--text-primary)" }}
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleAddExternalCert} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div className="form-group">
                <label>Certification Name *</label>
                <input
                  type="text"
                  placeholder="e.g. AWS Certified Solutions Architect"
                  value={certName}
                  onChange={(e) => setCertName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Issuing Organization *</label>
                <input
                  type="text"
                  placeholder="e.g. Amazon Web Services"
                  value={certIssuer}
                  onChange={(e) => setCertIssuer(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div className="form-group">
                  <label>Issue Date *</label>
                  <input
                    type="date"
                    value={certIssueDate}
                    onChange={(e) => setCertIssueDate(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Expiration Date</label>
                  <input
                    type="date"
                    value={certExpiryDate}
                    onChange={(e) => setCertExpiryDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Credential ID</label>
                <input
                  type="text"
                  placeholder="Credential ID or number"
                  value={certCredId}
                  onChange={(e) => setCertCredId(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Credential URL</label>
                <input
                  type="url"
                  placeholder="https://verify.org/credential/123"
                  value={certCredUrl}
                  onChange={(e) => setCertCredUrl(e.target.value)}
                />
              </div>

              <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => { setShowAddCertModal(false); resetCertForm(); }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={savingCert}>
                  {savingCert ? "Saving..." : "Add Certificate"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit External Certificate Modal */}
      {showEditCertModal && selectedExternalCert && (
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
        >
          <div className="glass-panel animate-fade-in" style={{ width: "90%", maxWidth: "550px", padding: "2.5rem", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h3 style={{ margin: 0 }}>Edit Certification</h3>
              <button
                className="hamburger-btn"
                onClick={() => {
                  setShowEditCertModal(false);
                  resetCertForm();
                }}
                style={{ padding: "0.25rem", cursor: "pointer", border: "none", background: "transparent", color: "var(--text-primary)" }}
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleEditExternalCert} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div className="form-group">
                <label>Certification Name *</label>
                <input
                  type="text"
                  placeholder="e.g. AWS Certified Solutions Architect"
                  value={certName}
                  onChange={(e) => setCertName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Issuing Organization *</label>
                <input
                  type="text"
                  placeholder="e.g. Amazon Web Services"
                  value={certIssuer}
                  onChange={(e) => setCertIssuer(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div className="form-group">
                  <label>Issue Date *</label>
                  <input
                    type="date"
                    value={certIssueDate}
                    onChange={(e) => setCertIssueDate(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Expiration Date</label>
                  <input
                    type="date"
                    value={certExpiryDate}
                    onChange={(e) => setCertExpiryDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Credential ID</label>
                <input
                  type="text"
                  placeholder="Credential ID or number"
                  value={certCredId}
                  onChange={(e) => setCertCredId(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Credential URL</label>
                <input
                  type="url"
                  placeholder="https://verify.org/credential/123"
                  value={certCredUrl}
                  onChange={(e) => setCertCredUrl(e.target.value)}
                />
              </div>

              <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => { setShowEditCertModal(false); resetCertForm(); }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={savingCert}>
                  {savingCert ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
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
