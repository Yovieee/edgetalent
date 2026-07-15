import React, { useState, useEffect, useCallback } from "react";
import { useSupabase } from "../context/SupabaseContext";
import { CourseSchema, QuizQuestionSchema, ProjectSchema, CourseLessonSchema } from "@edgetalent/shared";

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  role: "talent" | "partner" | "admin" | null;
  skills: string[];
  skill_gaps: string[];
  created_at: string;
}

interface CourseItem {
  id: string;
  title: string;
  description: string;
  skills_taught: string[];
  provider: string;
  link: string;
  created_at: string;
}

interface ProjectItem {
  id: string;
  partner_id: string;
  title: string;
  description: string;
  required_skills: string[];
  budget: number | null;
  scope: "short-term" | "medium-term" | "long-term";
  created_at: string;
}

interface QuizItem {
  id: string;
  category: "frontend" | "backend" | "ai";
  question: string;
  options: string[];
  answer: string;
  created_at: string;
}

export default function AdminDashboard(): React.ReactElement {
  const { supabase, profile, signOut } = useSupabase();
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false);

  // Stats / Overview State
  const [stats, setStats] = useState({
    usersCount: 0,
    talentCount: 0,
    partnerCount: 0,
    adminCount: 0,
    coursesCount: 0,
    projectsCount: 0,
    questionsCount: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);

  // Tab Data States
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);

  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);

  const [quizzes, setQuizzes] = useState<QuizItem[]>([]);
  const [loadingQuizzes, setLoadingQuizzes] = useState(false);

  // Modal / Form States
  const [activeModal, setActiveModal] = useState<"course" | "quiz" | "project" | "lessons" | null>(null);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: "success" | "error" | "" }>({ text: "", type: "" });

  // Lesson Management States
  const [selectedCourseForLessons, setSelectedCourseForLessons] = useState<CourseItem | null>(null);
  const [lessons, setLessons] = useState<any[]>([]);
  const [loadingLessons, setLoadingLessons] = useState(false);
  const [showLessonForm, setShowLessonForm] = useState(false);
  const [lessonEditMode, setLessonEditMode] = useState(false);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);

  // Lesson Form Fields
  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonContent, setLessonContent] = useState("");
  const [lessonSequence, setLessonSequence] = useState<number>(1);
  const [lessonDuration, setLessonDuration] = useState<number>(10);

  // Course Form Fields
  const [courseTitle, setCourseTitle] = useState("");
  const [courseDesc, setCourseDesc] = useState("");
  const [courseSkills, setCourseSkills] = useState("");
  const [courseProvider, setCourseProvider] = useState("");
  const [courseLink, setCourseLink] = useState("");

  // Quiz Form Fields
  const [quizCategory, setQuizCategory] = useState<"frontend" | "backend" | "ai">("frontend");
  const [quizQuestionText, setQuizQuestionText] = useState("");
  const [quizOption1, setQuizOption1] = useState("");
  const [quizOption2, setQuizOption2] = useState("");
  const [quizOption3, setQuizOption3] = useState("");
  const [quizOption4, setQuizOption4] = useState("");
  const [quizAnswer, setQuizAnswer] = useState("");

  // Project Form Fields
  const [projectTitle, setProjectTitle] = useState("");
  const [projectDesc, setProjectDesc] = useState("");
  const [projectSkills, setProjectSkills] = useState("");
  const [projectBudget, setProjectBudget] = useState("");
  const [projectScope, setProjectScope] = useState<"short-term" | "medium-term" | "long-term">("medium-term");
  const [projectPartnerId, setProjectPartnerId] = useState("");

  const toggleSidebar = () => {
    if (window.innerWidth <= 768) {
      setIsMobileOpen(!isMobileOpen);
    } else {
      setIsSidebarCollapsed(!isSidebarCollapsed);
    }
  };

  const showStatus = (text: string, type: "success" | "error") => {
    setStatusMsg({ text, type });
    setTimeout(() => setStatusMsg({ text: "", type: "" }), 4000);
  };

  // Fetching Data Callback Functions
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

  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) {
        setUsers(data as UserProfile[]);
      } else {
        showStatus("Failed to load users: " + error?.message, "error");
      }
    } catch (e: any) {
      showStatus("Users error: " + e.message, "error");
    } finally {
      setLoadingUsers(false);
    }
  }, [supabase]);

  const fetchCourses = useCallback(async () => {
    setLoadingCourses(true);
    try {
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) {
        setCourses(data as CourseItem[]);
      } else {
        showStatus("Failed to load courses: " + error?.message, "error");
      }
    } catch (e: any) {
      showStatus("Courses error: " + e.message, "error");
    } finally {
      setLoadingCourses(false);
    }
  }, [supabase]);

  const fetchProjects = useCallback(async () => {
    setLoadingProjects(true);
    try {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) {
        setProjects(data as ProjectItem[]);
      } else {
        showStatus("Failed to load job listings: " + error?.message, "error");
      }
    } catch (e: any) {
      showStatus("Projects error: " + e.message, "error");
    } finally {
      setLoadingProjects(false);
    }
  }, [supabase]);

  const fetchQuizzes = useCallback(async () => {
    setLoadingQuizzes(true);
    try {
      const { data, error } = await supabase
        .from("quiz_questions")
        .select("*")
        .order("category")
        .order("created_at", { ascending: false });

      if (!error && data) {
        setQuizzes(data as QuizItem[]);
      } else {
        showStatus("Failed to load quiz questions: " + error?.message, "error");
      }
    } catch (e: any) {
      showStatus("Quizzes error: " + e.message, "error");
    } finally {
      setLoadingQuizzes(false);
    }
  }, [supabase]);

  // Load appropriate data when tab changes
  useEffect(() => {
    if (activeTab === "overview") {
      fetchStats();
    } else if (activeTab === "users") {
      fetchUsers();
    } else if (activeTab === "courses") {
      fetchCourses();
    } else if (activeTab === "marketplace") {
      fetchProjects();
      fetchUsers(); // also fetch users so we have partner_ids to pick from in forms
    } else if (activeTab === "quizzes") {
      fetchQuizzes();
    }
  }, [activeTab, fetchStats, fetchUsers, fetchCourses, fetchProjects, fetchQuizzes]);

  // User Actions
  const handleUpdateRole = async (userId: string, newRole: "talent" | "partner" | "admin" | null) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ role: newRole })
        .eq("id", userId);

      if (error) {
        showStatus("Role update failed: " + error.message, "error");
      } else {
        showStatus("User role updated successfully!", "success");
        fetchUsers();
      }
    } catch (e: any) {
      showStatus("Update error: " + e.message, "error");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm("Are you sure you want to delete this user? This will also cascade delete their profile, projects, and applications.")) {
      return;
    }
    try {
      // Direct delete from public.profiles table (which cascades to other tables)
      const { error } = await supabase.from("profiles").delete().eq("id", userId);
      if (error) {
        showStatus("Delete profile failed: " + error.message, "error");
      } else {
        showStatus("User profile deleted successfully!", "success");
        fetchUsers();
      }
    } catch (e: any) {
      showStatus("Delete error: " + e.message, "error");
    }
  };

  // Course Form Actions
  const openCourseModal = (course?: CourseItem) => {
    if (course) {
      setEditMode(true);
      setSelectedId(course.id);
      setCourseTitle(course.title);
      setCourseDesc(course.description || "");
      setCourseSkills(course.skills_taught.join(", "));
      setCourseProvider(course.provider || "");
      setCourseLink(course.link || "");
    } else {
      setEditMode(false);
      setSelectedId(null);
      setCourseTitle("");
      setCourseDesc("");
      setCourseSkills("");
      setCourseProvider("");
      setCourseLink("");
    }
    setActiveModal("course");
  };

  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    const skillsArray = courseSkills
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const payload = {
      title: courseTitle,
      description: courseDesc,
      skills_taught: skillsArray,
      provider: courseProvider,
      link: courseLink,
    };

    const validate = CourseSchema.safeParse(payload);
    if (!validate.success) {
      showStatus("Validation Error: " + validate.error.errors[0].message, "error");
      return;
    }

    try {
      let error;
      if (editMode && selectedId) {
        const { error: err } = await supabase
          .from("courses")
          .update(payload)
          .eq("id", selectedId);
        error = err;
      } else {
        const { error: err } = await supabase.from("courses").insert(payload);
        error = err;
      }

      if (error) {
        showStatus("Saving course failed: " + error.message, "error");
      } else {
        showStatus(editMode ? "Course updated successfully!" : "Course created successfully!", "success");
        setActiveModal(null);
        fetchCourses();
      }
    } catch (e: any) {
      showStatus("Save error: " + e.message, "error");
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!window.confirm("Are you sure you want to delete this course?")) return;
    try {
      const { error } = await supabase.from("courses").delete().eq("id", courseId);
      if (error) {
        showStatus("Delete course failed: " + error.message, "error");
      } else {
        showStatus("Course deleted successfully!", "success");
        fetchCourses();
      }
    } catch (e: any) {
      showStatus("Delete error: " + e.message, "error");
    }
  };

  // Lesson Management Functions
  const fetchLessons = async (courseId: string) => {
    setLoadingLessons(true);
    try {
      const { data, error } = await supabase
        .from("course_lessons")
        .select("*")
        .eq("course_id", courseId)
        .order("sequence_order", { ascending: true });
      if (error) {
        showStatus("Failed to load lessons: " + error.message, "error");
      } else {
        setLessons(data || []);
      }
    } catch (e: any) {
      showStatus("Lessons error: " + e.message, "error");
    } finally {
      setLoadingLessons(false);
    }
  };

  const handleOpenLessonsManager = (course: CourseItem) => {
    setSelectedCourseForLessons(course);
    setLessons([]);
    setShowLessonForm(false);
    fetchLessons(course.id);
    setActiveModal("lessons");
  };

  const handleOpenLessonForm = (lesson?: any) => {
    if (lesson) {
      setLessonEditMode(true);
      setSelectedLessonId(lesson.id);
      setLessonTitle(lesson.title);
      setLessonContent(lesson.content);
      setLessonSequence(lesson.sequence_order);
      setLessonDuration(lesson.duration_minutes);
    } else {
      setLessonEditMode(false);
      setSelectedLessonId(null);
      setLessonTitle("");
      setLessonContent("");
      setLessonSequence(lessons.length + 1);
      setLessonDuration(10);
    }
    setShowLessonForm(true);
  };

  const handleSaveLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseForLessons) return;

    const payload = {
      course_id: selectedCourseForLessons.id,
      title: lessonTitle,
      content: lessonContent,
      sequence_order: Number(lessonSequence),
      duration_minutes: Number(lessonDuration),
    };

    const validate = CourseLessonSchema.safeParse(payload);
    if (!validate.success) {
      showStatus("Validation Error: " + validate.error.errors[0].message, "error");
      return;
    }

    try {
      let error;
      if (lessonEditMode && selectedLessonId) {
        const { error: err } = await supabase
          .from("course_lessons")
          .update(payload)
          .eq("id", selectedLessonId);
        error = err;
      } else {
        const { error: err } = await supabase.from("course_lessons").insert(payload);
        error = err;
      }

      if (error) {
        showStatus("Saving lesson failed: " + error.message, "error");
      } else {
        showStatus(lessonEditMode ? "Lesson updated successfully!" : "Lesson created successfully!", "success");
        setShowLessonForm(false);
        fetchLessons(selectedCourseForLessons.id);
      }
    } catch (e: any) {
      showStatus("Save lesson error: " + e.message, "error");
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!window.confirm("Are you sure you want to delete this lesson?")) return;
    try {
      const { error } = await supabase.from("course_lessons").delete().eq("id", lessonId);
      if (error) {
        showStatus("Delete lesson failed: " + error.message, "error");
      } else {
        showStatus("Lesson deleted successfully!", "success");
        if (selectedCourseForLessons) fetchLessons(selectedCourseForLessons.id);
      }
    } catch (e: any) {
      showStatus("Delete lesson error: " + e.message, "error");
    }
  };

  // Quiz Form Actions
  const openQuizModal = (quiz?: QuizItem) => {
    if (quiz) {
      setEditMode(true);
      setSelectedId(quiz.id);
      setQuizCategory(quiz.category);
      setQuizQuestionText(quiz.question);
      setQuizOption1(quiz.options[0] || "");
      setQuizOption2(quiz.options[1] || "");
      setQuizOption3(quiz.options[2] || "");
      setQuizOption4(quiz.options[3] || "");
      setQuizAnswer(quiz.answer);
    } else {
      setEditMode(false);
      setSelectedId(null);
      setQuizCategory("frontend");
      setQuizQuestionText("");
      setQuizOption1("");
      setQuizOption2("");
      setQuizOption3("");
      setQuizOption4("");
      setQuizAnswer("");
    }
    setActiveModal("quiz");
  };

  const handleSaveQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    const optionsArray = [quizOption1, quizOption2, quizOption3, quizOption4]
      .map((o) => o.trim())
      .filter((o) => o.length > 0);

    const payload = {
      category: quizCategory,
      question: quizQuestionText,
      options: optionsArray,
      answer: quizAnswer,
    };

    const validate = QuizQuestionSchema.safeParse(payload);
    if (!validate.success) {
      showStatus("Validation Error: " + validate.error.errors[0].message, "error");
      return;
    }

    if (!optionsArray.includes(quizAnswer)) {
      showStatus("Correct answer must be one of the listed options.", "error");
      return;
    }

    try {
      let error;
      if (editMode && selectedId) {
        const { error: err } = await supabase
          .from("quiz_questions")
          .update(payload)
          .eq("id", selectedId);
        error = err;
      } else {
        const { error: err } = await supabase.from("quiz_questions").insert(payload);
        error = err;
      }

      if (error) {
        showStatus("Saving quiz question failed: " + error.message, "error");
      } else {
        showStatus(editMode ? "Question updated successfully!" : "Question created successfully!", "success");
        setActiveModal(null);
        fetchQuizzes();
      }
    } catch (e: any) {
      showStatus("Save error: " + e.message, "error");
    }
  };

  const handleDeleteQuiz = async (quizId: string) => {
    if (!window.confirm("Are you sure you want to delete this question?")) return;
    try {
      const { error } = await supabase.from("quiz_questions").delete().eq("id", quizId);
      if (error) {
        showStatus("Delete question failed: " + error.message, "error");
      } else {
        showStatus("Question deleted successfully!", "success");
        fetchQuizzes();
      }
    } catch (e: any) {
      showStatus("Delete error: " + e.message, "error");
    }
  };

  // Project Form Actions
  const openProjectModal = (proj?: ProjectItem) => {
    const defaultPartner = users.find((u) => u.role === "partner")?.id || "";

    if (proj) {
      setEditMode(true);
      setSelectedId(proj.id);
      setProjectTitle(proj.title);
      setProjectDesc(proj.description);
      setProjectSkills(proj.required_skills.join(", "));
      setProjectBudget(proj.budget !== null ? proj.budget.toString() : "");
      setProjectScope(proj.scope);
      setProjectPartnerId(proj.partner_id);
    } else {
      setEditMode(false);
      setSelectedId(null);
      setProjectTitle("");
      setProjectDesc("");
      setProjectSkills("");
      setProjectBudget("");
      setProjectScope("medium-term");
      setProjectPartnerId(defaultPartner);
    }
    setActiveModal("project");
  };

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    const skillsArray = projectSkills
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const payload = {
      title: projectTitle,
      description: projectDesc,
      required_skills: skillsArray,
      budget: projectBudget ? parseFloat(projectBudget) : null,
      scope: projectScope,
      partner_id: projectPartnerId,
    };

    const validate = ProjectSchema.safeParse(payload);
    if (!validate.success) {
      showStatus("Validation Error: " + validate.error.errors[0].message, "error");
      return;
    }

    try {
      let error;
      if (editMode && selectedId) {
        const { error: err } = await supabase
          .from("projects")
          .update(payload)
          .eq("id", selectedId);
        error = err;
      } else {
        const { error: err } = await supabase.from("projects").insert(payload);
        error = err;
      }

      if (error) {
        showStatus("Saving project failed: " + error.message, "error");
      } else {
        showStatus(editMode ? "Project updated successfully!" : "Project created successfully!", "success");
        setActiveModal(null);
        fetchProjects();
      }
    } catch (e: any) {
      showStatus("Save error: " + e.message, "error");
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!window.confirm("Are you sure you want to delete this project listing?")) return;
    try {
      const { error } = await supabase.from("projects").delete().eq("id", projectId);
      if (error) {
        showStatus("Delete project failed: " + error.message, "error");
      } else {
        showStatus("Project deleted successfully!", "success");
        fetchProjects();
      }
    } catch (e: any) {
      showStatus("Delete error: " + e.message, "error");
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", position: "relative" }}>
      {/* Toast Alert */}
      {statusMsg.text && (
        <div
          style={{
            position: "fixed",
            top: "20px",
            right: "20px",
            zIndex: 9999,
            padding: "1rem 1.5rem",
            borderRadius: "var(--radius-sm)",
            background: statusMsg.type === "success" ? "rgba(16, 185, 129, 0.95)" : "rgba(225, 29, 72, 0.95)",
            color: "white",
            fontWeight: 600,
            boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
            backdropFilter: "blur(8px)",
            animation: "fadeInUp 0.3s ease forwards",
          }}
        >
          {statusMsg.text}
        </div>
      )}

      {/* Sidebar navigation */}
      <aside
        className="glass-panel"
        style={{
          width: isSidebarCollapsed ? "80px" : "280px",
          display: window.innerWidth <= 768 && !isMobileOpen ? "none" : "flex",
          flexDirection: "column",
          borderRadius: 0,
          borderTop: "none",
          borderBottom: "none",
          borderLeft: "none",
          padding: "2rem 1.5rem",
          transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          zIndex: 100,
          background: "var(--glass-bg)",
        }}
      >
        {/* Title */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "3rem", overflow: "hidden" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "8px",
              background: "linear-gradient(135deg, var(--color-purple) 0%, var(--color-rose) 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontWeight: 800,
              fontSize: "1.2rem",
              flexShrink: 0,
            }}
          >
            Ω
          </div>
          {!isSidebarCollapsed && (
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontWeight: 800, fontSize: "1.1rem", letterSpacing: "-0.03em" }}>EdgeTalent</span>
              <span style={{ fontSize: "0.7rem", color: "var(--color-purple)", fontWeight: 700, textTransform: "uppercase" }}>
                Admin Panel
              </span>
            </div>
          )}
        </div>

        {/* Navigation Items */}
        <nav style={{ display: "flex", flexDirection: "column", gap: "0.5rem", flex: 1 }}>
          {[
            { id: "overview", label: "Overview", icon: "📊" },
            { id: "users", label: "Users List", icon: "👥" },
            { id: "quizzes", label: "Quizzes", icon: "📝" },
            { id: "courses", label: "Upskilling Hub", icon: "🎓" },
            { id: "marketplace", label: "Job Marketplace", icon: "💼" },
          ].map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsMobileOpen(false);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem",
                  padding: "0.85rem 1.25rem",
                  borderRadius: "var(--radius-sm)",
                  border: "none",
                  background: isActive ? "rgba(124, 58, 237, 0.08)" : "transparent",
                  color: isActive ? "var(--color-purple)" : "var(--text-secondary)",
                  cursor: "pointer",
                  fontWeight: isActive ? 700 : 500,
                  textAlign: "left",
                  width: "100%",
                  transition: "all 0.2s ease",
                  borderLeft: isActive ? "4px solid var(--color-purple)" : "4px solid transparent",
                }}
              >
                <span style={{ fontSize: "1.2rem" }}>{item.icon}</span>
                {!isSidebarCollapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* User Card & Logout */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem", borderTop: "1px solid var(--glass-border)", paddingTop: "1.5rem" }}>
          {!isSidebarCollapsed && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  background: "var(--bg-tertiary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.1rem",
                }}
              >
                🔑
              </div>
              <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
                <span style={{ fontSize: "0.85rem", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {profile?.full_name || "Administrator"}
                </span>
                <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{profile?.email}</span>
              </div>
            </div>
          )}
          <button className="btn btn-secondary" onClick={signOut} style={{ width: "100%", padding: "0.6rem" }}>
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: "2.5rem", overflowY: "auto", display: "flex", flexDirection: "column", gap: "2rem" }}>
        {/* Top Header */}
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <button
              onClick={toggleSidebar}
              style={{
                background: "transparent",
                border: "none",
                fontSize: "1.5rem",
                cursor: "pointer",
                marginRight: "1rem",
              }}
            >
              ☰
            </button>
            <h2 style={{ display: "inline-block", fontSize: "1.75rem", textTransform: "capitalize" }}>
              {activeTab} Management
            </h2>
          </div>
          <div style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
            Local Time: {new Date().toLocaleDateString()}
          </div>
        </header>

        {/* Content Panels based on Tab */}
        {activeTab === "overview" && (
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
        )}

        {activeTab === "users" && (
          <div className="glass-panel animate-fade-in" style={{ padding: "2rem" }}>
            <h3 style={{ marginBottom: "1.5rem" }}>Users Accounts Profiles</h3>
            {loadingUsers ? (
              <p>Loading users list...</p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid var(--glass-border)", color: "var(--text-secondary)" }}>
                      <th style={{ padding: "1rem" }}>Name</th>
                      <th style={{ padding: "1rem" }}>Email</th>
                      <th style={{ padding: "1rem" }}>Role</th>
                      <th style={{ padding: "1rem" }}>Skills</th>
                      <th style={{ padding: "1rem" }}>Created At</th>
                      <th style={{ padding: "1rem", textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} style={{ borderBottom: "1px solid var(--glass-border)" }}>
                        <td style={{ padding: "1rem", fontWeight: 600 }}>{u.full_name || "N/A"}</td>
                        <td style={{ padding: "1rem" }}>{u.email}</td>
                        <td style={{ padding: "1rem" }}>
                          <span
                            className={`badge ${
                              u.role === "admin"
                                ? "badge-rose"
                                : u.role === "partner"
                                ? "badge-emerald"
                                : u.role === "talent"
                                ? "badge-cyan"
                                : "badge-secondary"
                            }`}
                            style={{ textTransform: "uppercase" }}
                          >
                            {u.role || "No Role"}
                          </span>
                        </td>
                        <td style={{ padding: "1rem" }}>
                          {u.skills && u.skills.length > 0 ? (
                            <div style={{ display: "flex", gap: "0.25rem", flexWrap: "wrap" }}>
                              {u.skills.slice(0, 3).map((s, i) => (
                                <span key={i} className="badge badge-secondary" style={{ fontSize: "0.75rem" }}>
                                  {s}
                                </span>
                              ))}
                              {u.skills.length > 3 && <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>+{u.skills.length - 3} more</span>}
                            </div>
                          ) : (
                            <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>None</span>
                          )}
                        </td>
                        <td style={{ padding: "1rem", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                          {new Date(u.created_at).toLocaleDateString()}
                        </td>
                        <td style={{ padding: "1rem", textAlign: "right" }}>
                          <div style={{ display: "inline-flex", gap: "0.5rem", alignItems: "center" }}>
                            <select
                              value={u.role || ""}
                              onChange={(e) => handleUpdateRole(u.id, (e.target.value || null) as any)}
                              className="form-input"
                              style={{ padding: "0.3rem 0.5rem", fontSize: "0.85rem", width: "110px", margin: 0 }}
                              disabled={u.id === profile?.id}
                            >
                              <option value="">Unassigned</option>
                              <option value="talent">Talent</option>
                              <option value="partner">Partner</option>
                              <option value="admin">Admin</option>
                            </select>
                            <button
                              className="btn btn-secondary"
                              onClick={() => handleDeleteUser(u.id)}
                              style={{ padding: "0.3rem 0.6rem", color: "var(--color-rose)" }}
                              disabled={u.id === profile?.id}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === "quizzes" && (
          <div className="glass-panel animate-fade-in" style={{ padding: "2rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h3 style={{ margin: 0 }}>Assessment Quiz Questions</h3>
              <button className="btn btn-primary" onClick={() => openQuizModal()}>
                Add Question
              </button>
            </div>

            {loadingQuizzes ? (
              <p>Loading quiz questions...</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                {["frontend", "backend", "ai"].map((cat) => {
                  const filtered = quizzes.filter((q) => q.category === cat);
                  return (
                    <div key={cat} style={{ border: "1px solid var(--glass-border)", borderRadius: "var(--radius-sm)", padding: "1.5rem" }}>
                      <h4 style={{ textTransform: "uppercase", color: "var(--color-cyan)", marginBottom: "1rem", borderBottom: "1px solid var(--glass-border)", paddingBottom: "0.5rem" }}>
                        {cat} Development Questions ({filtered.length})
                      </h4>
                      {filtered.length === 0 ? (
                        <p style={{ color: "var(--text-muted)" }}>No questions in this category.</p>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                          {filtered.map((q, idx) => (
                            <div
                              key={q.id}
                              style={{
                                padding: "1rem",
                                background: "var(--bg-tertiary)",
                                borderRadius: "var(--radius-sm)",
                                display: "flex",
                                justifyContent: "space-between",
                                gap: "1rem",
                              }}
                            >
                              <div style={{ flex: 1 }}>
                                <p style={{ fontWeight: 600, marginBottom: "0.5rem" }}>
                                  {idx + 1}. {q.question}
                                </p>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", paddingLeft: "1rem" }}>
                                  {q.options.map((opt, i) => (
                                    <div
                                      key={i}
                                      style={{
                                        fontSize: "0.85rem",
                                        color: opt === q.answer ? "var(--color-emerald)" : "var(--text-secondary)",
                                        fontWeight: opt === q.answer ? 700 : 400,
                                      }}
                                    >
                                      {opt === q.answer ? "✓" : "○"} {opt}
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", justifyContent: "center" }}>
                                <button className="btn btn-secondary" onClick={() => openQuizModal(q)} style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem" }}>
                                  Edit
                                </button>
                                <button
                                  className="btn btn-secondary"
                                  onClick={() => handleDeleteQuiz(q.id)}
                                  style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem", color: "var(--color-rose)" }}
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === "courses" && (
          <div className="glass-panel animate-fade-in" style={{ padding: "2rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h3 style={{ margin: 0 }}>Upskilling Courses Catalog</h3>
              <button className="btn btn-primary" onClick={() => openCourseModal()}>
                Add Course
              </button>
            </div>

            {loadingCourses ? (
              <p>Loading courses...</p>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.5rem" }}>
                {courses.map((c) => (
                  <div key={c.id} className="glass-panel" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", justifyContent: "space-between", gap: "1rem" }}>
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                        <span className="badge badge-amber" style={{ fontSize: "0.75rem" }}>
                          {c.provider || "Self-study"}
                        </span>
                        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                          {new Date(c.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <h4 style={{ fontSize: "1.1rem", marginBottom: "0.5rem" }}>{c.title}</h4>
                      <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", minHeight: "3.5rem", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical" }}>
                        {c.description || "No description provided."}
                      </p>
                      {c.skills_taught && c.skills_taught.length > 0 && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem", marginTop: "1rem" }}>
                          {c.skills_taught.map((skill, idx) => (
                            <span key={idx} className="badge badge-cyan" style={{ fontSize: "0.75rem" }}>
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem", borderTop: "1px solid var(--glass-border)", paddingTop: "1rem" }}>
                      {c.link && (
                        <a href={c.link} target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ flex: 1, padding: "0.5rem", fontSize: "0.85rem" }}>
                          Course Link ↗
                        </a>
                      )}
                      <button className="btn btn-secondary" onClick={() => handleOpenLessonsManager(c)} style={{ padding: "0.5rem", fontSize: "0.85rem", borderColor: "var(--color-cyan)" }}>
                        Lessons
                      </button>
                      <button className="btn btn-secondary" onClick={() => openCourseModal(c)} style={{ padding: "0.5rem", fontSize: "0.85rem" }}>
                        Edit
                      </button>
                      <button
                        className="btn btn-secondary"
                        onClick={() => handleDeleteCourse(c.id)}
                        style={{ padding: "0.5rem", fontSize: "0.85rem", color: "var(--color-rose)" }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "marketplace" && (
          <div className="glass-panel animate-fade-in" style={{ padding: "2rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h3 style={{ margin: 0 }}>Job Marketplace Listings</h3>
              <button className="btn btn-primary" onClick={() => openProjectModal()}>
                Add Project / Job
              </button>
            </div>

            {loadingProjects ? (
              <p>Loading projects...</p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid var(--glass-border)", color: "var(--text-secondary)" }}>
                      <th style={{ padding: "1rem" }}>Title</th>
                      <th style={{ padding: "1rem" }}>Budget</th>
                      <th style={{ padding: "1rem" }}>Scope</th>
                      <th style={{ padding: "1rem" }}>Required Skills</th>
                      <th style={{ padding: "1rem" }}>Partner/Company</th>
                      <th style={{ padding: "1rem", textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projects.map((p) => {
                      const company = users.find((u) => u.id === p.partner_id);
                      return (
                        <tr key={p.id} style={{ borderBottom: "1px solid var(--glass-border)" }}>
                          <td style={{ padding: "1rem", fontWeight: 600 }}>{p.title}</td>
                          <td style={{ padding: "1rem", color: "var(--color-emerald)", fontWeight: 600 }}>
                            {p.budget ? `$${p.budget.toLocaleString()}` : "N/A"}
                          </td>
                          <td style={{ padding: "1rem" }}>
                            <span className="badge badge-secondary" style={{ textTransform: "uppercase" }}>
                              {p.scope}
                            </span>
                          </td>
                          <td style={{ padding: "1rem" }}>
                            <div style={{ display: "flex", gap: "0.25rem", flexWrap: "wrap" }}>
                              {p.required_skills.map((s, idx) => (
                                <span key={idx} className="badge badge-cyan" style={{ fontSize: "0.75rem" }}>
                                  {s}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td style={{ padding: "1rem", fontSize: "0.9rem" }}>
                            {company ? company.full_name : "Unknown Partner"}
                            <br />
                            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{p.partner_id.slice(0, 8)}...</span>
                          </td>
                          <td style={{ padding: "1rem", textAlign: "right" }}>
                            <div style={{ display: "inline-flex", gap: "0.5rem" }}>
                              <button className="btn btn-secondary" onClick={() => openProjectModal(p)} style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem" }}>
                                Edit
                              </button>
                              <button
                                className="btn btn-secondary"
                                onClick={() => handleDeleteProject(p.id)}
                                style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem", color: "var(--color-rose)" }}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Course Modal Form */}
      {activeModal === "course" && (
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
          <div className="glass-panel" style={{ width: "90%", maxWidth: "500px", padding: "2.5rem" }}>
            <h3 style={{ marginBottom: "1.5rem" }}>{editMode ? "Edit Course Details" : "Create New Course"}</h3>
            <form onSubmit={handleSaveCourse}>
              <div className="form-group">
                <label>Course Title</label>
                <input
                  type="text"
                  required
                  value={courseTitle}
                  onChange={(e) => setCourseTitle(e.target.value)}
                  className="form-input"
                  placeholder="e.g. Fullstack React & Node Roadmap"
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={courseDesc}
                  onChange={(e) => setCourseDesc(e.target.value)}
                  className="form-input"
                  placeholder="Summarize course contents..."
                  style={{ minHeight: "80px" }}
                />
              </div>
              <div className="form-group">
                <label>Skills Taught (comma-separated list)</label>
                <input
                  type="text"
                  value={courseSkills}
                  onChange={(e) => setCourseSkills(e.target.value)}
                  className="form-input"
                  placeholder="React, TypeScript, Node.js"
                />
              </div>
              <div className="form-group">
                <label>Provider</label>
                <input
                  type="text"
                  value={courseProvider}
                  onChange={(e) => setCourseProvider(e.target.value)}
                  className="form-input"
                  placeholder="e.g. Coursera, Udemy"
                />
              </div>
              <div className="form-group">
                <label>Link/URL</label>
                <input
                  type="text"
                  value={courseLink}
                  onChange={(e) => setCourseLink(e.target.value)}
                  className="form-input"
                  placeholder="https://example.com/course-link"
                />
              </div>
              <div style={{ display: "flex", gap: "1rem", marginTop: "2rem" }}>
                <button type="button" className="btn btn-secondary" onClick={() => setActiveModal(null)} style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  {editMode ? "Save Changes" : "Create Course"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quiz Modal Form */}
      {activeModal === "quiz" && (
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
          <div className="glass-panel" style={{ width: "90%", maxWidth: "550px", padding: "2.5rem" }}>
            <h3 style={{ marginBottom: "1.5rem" }}>{editMode ? "Edit Quiz Question" : "Create Quiz Question"}</h3>
            <form onSubmit={handleSaveQuiz}>
              <div className="form-group">
                <label>Category</label>
                <select
                  value={quizCategory}
                  onChange={(e) => setQuizCategory(e.target.value as any)}
                  className="form-input"
                >
                  <option value="frontend">Frontend Development</option>
                  <option value="backend">Backend Development</option>
                  <option value="ai">AI & Data Science</option>
                </select>
              </div>
              <div className="form-group">
                <label>Question Text</label>
                <textarea
                  required
                  value={quizQuestionText}
                  onChange={(e) => setQuizQuestionText(e.target.value)}
                  className="form-input"
                  placeholder="e.g. Which React hook handles state lifecycle?"
                  style={{ minHeight: "60px" }}
                />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div className="form-group">
                  <label>Option A</label>
                  <input
                    type="text"
                    required
                    value={quizOption1}
                    onChange={(e) => setQuizOption1(e.target.value)}
                    className="form-input"
                    placeholder="Option A"
                  />
                </div>
                <div className="form-group">
                  <label>Option B</label>
                  <input
                    type="text"
                    required
                    value={quizOption2}
                    onChange={(e) => setQuizOption2(e.target.value)}
                    className="form-input"
                    placeholder="Option B"
                  />
                </div>
                <div className="form-group">
                  <label>Option C</label>
                  <input
                    type="text"
                    value={quizOption3}
                    onChange={(e) => setQuizOption3(e.target.value)}
                    className="form-input"
                    placeholder="Option C"
                  />
                </div>
                <div className="form-group">
                  <label>Option D</label>
                  <input
                    type="text"
                    value={quizOption4}
                    onChange={(e) => setQuizOption4(e.target.value)}
                    className="form-input"
                    placeholder="Option D"
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Correct Answer (Exact option match)</label>
                <select
                  required
                  value={quizAnswer}
                  onChange={(e) => setQuizAnswer(e.target.value)}
                  className="form-input"
                >
                  <option value="">-- Select Answer --</option>
                  {quizOption1 && <option value={quizOption1}>A: {quizOption1}</option>}
                  {quizOption2 && <option value={quizOption2}>B: {quizOption2}</option>}
                  {quizOption3 && <option value={quizOption3}>C: {quizOption3}</option>}
                  {quizOption4 && <option value={quizOption4}>D: {quizOption4}</option>}
                </select>
              </div>
              <div style={{ display: "flex", gap: "1rem", marginTop: "2rem" }}>
                <button type="button" className="btn btn-secondary" onClick={() => setActiveModal(null)} style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  {editMode ? "Save Changes" : "Create Question"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Project Modal Form */}
      {activeModal === "project" && (
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
          <div className="glass-panel" style={{ width: "90%", maxWidth: "500px", padding: "2.5rem" }}>
            <h3 style={{ marginBottom: "1.5rem" }}>{editMode ? "Edit Project Details" : "Publish New Project"}</h3>
            <form onSubmit={handleSaveProject}>
              <div className="form-group">
                <label>Project Title</label>
                <input
                  type="text"
                  required
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  className="form-input"
                  placeholder="e.g. Build an Admin Panel"
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  required
                  value={projectDesc}
                  onChange={(e) => setProjectDesc(e.target.value)}
                  className="form-input"
                  placeholder="Detail project specifications and parameters..."
                  style={{ minHeight: "80px" }}
                />
              </div>
              <div className="form-group">
                <label>Required Skills (comma-separated list)</label>
                <input
                  type="text"
                  value={projectSkills}
                  onChange={(e) => setProjectSkills(e.target.value)}
                  className="form-input"
                  placeholder="React, Supabase, pgvector"
                />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div className="form-group">
                  <label>Budget (USD)</label>
                  <input
                    type="number"
                    value={projectBudget}
                    onChange={(e) => setProjectBudget(e.target.value)}
                    className="form-input"
                    placeholder="e.g. 2500"
                  />
                </div>
                <div className="form-group">
                  <label>Project Scope</label>
                  <select
                    value={projectScope}
                    onChange={(e) => setProjectScope(e.target.value as any)}
                    className="form-input"
                  >
                    <option value="short-term">Short-term</option>
                    <option value="medium-term">Medium-term</option>
                    <option value="long-term">Long-term</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Belongs to Corporate Partner / Company</label>
                <select
                  required
                  value={projectPartnerId}
                  onChange={(e) => setProjectPartnerId(e.target.value)}
                  className="form-input"
                >
                  <option value="">-- Select Partner --</option>
                  {users
                    .filter((u) => u.role === "partner")
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.full_name || p.email} ({p.id.slice(0, 8)})
                      </option>
                    ))}
                </select>
              </div>
              <div style={{ display: "flex", gap: "1rem", marginTop: "2rem" }}>
                <button type="button" className="btn btn-secondary" onClick={() => setActiveModal(null)} style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  {editMode ? "Save Changes" : "Publish Job"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lessons Modal Form */}
      {activeModal === "lessons" && selectedCourseForLessons && (
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
          <div className="glass-panel animate-fade-in" style={{ width: "95%", maxWidth: "700px", padding: "2rem", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h3 style={{ margin: 0 }}>Lessons for {selectedCourseForLessons.title}</h3>
              <button className="btn btn-secondary" onClick={() => setActiveModal(null)}>Close</button>
            </div>

            {showLessonForm ? (
              <form onSubmit={handleSaveLesson} className="glass-panel" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
                <h4>{lessonEditMode ? "Edit Lesson" : "Add New Lesson"}</h4>
                <div className="form-group">
                  <label>Lesson Title</label>
                  <input
                    type="text"
                    required
                    value={lessonTitle}
                    onChange={(e) => setLessonTitle(e.target.value)}
                    className="form-input"
                    placeholder="e.g. Lesson 1: Getting Started"
                  />
                </div>
                <div className="form-group">
                  <label>Lesson Content (Supports Markdown)</label>
                  <textarea
                    required
                    value={lessonContent}
                    onChange={(e) => setLessonContent(e.target.value)}
                    className="form-input"
                    placeholder="Enter lesson contents, text, or markdown code here..."
                    style={{ minHeight: "150px" }}
                  />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div className="form-group">
                    <label>Sequence Order</label>
                    <input
                      type="number"
                      required
                      value={lessonSequence}
                      onChange={(e) => setLessonSequence(Number(e.target.value))}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>Duration (Minutes)</label>
                    <input
                      type="number"
                      required
                      value={lessonDuration}
                      onChange={(e) => setLessonDuration(Number(e.target.value))}
                      className="form-input"
                    />
                  </div>
                </div>
                <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowLessonForm(false)} style={{ flex: 1 }}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                    {lessonEditMode ? "Save Changes" : "Add Lesson"}
                  </button>
                </div>
              </form>
            ) : (
              <div style={{ marginBottom: "1.5rem" }}>
                <button className="btn btn-primary" onClick={() => handleOpenLessonForm()} style={{ marginBottom: "1rem" }}>
                  Add Lesson
                </button>
              </div>
            )}

            {loadingLessons ? (
              <p>Loading lessons...</p>
            ) : lessons.length === 0 ? (
              <p style={{ color: "var(--text-secondary)" }}>No lessons added yet. Use the button above to add the first lesson.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {lessons.map((lesson) => (
                  <div
                    key={lesson.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "1rem",
                      background: "rgba(0, 0, 0, 0.02)",
                      borderRadius: "6px",
                      border: "1px solid var(--glass-border)",
                    }}
                  >
                    <div>
                      <span className="badge badge-cyan" style={{ marginRight: "0.5rem", fontSize: "0.75rem" }}>
                        Seq {lesson.sequence_order}
                      </span>
                      <strong style={{ fontSize: "0.95rem" }}>{lesson.title}</strong>
                      <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
                        ⏱ {lesson.duration_minutes} mins | Content length: {lesson.content.length} chars
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button className="btn btn-secondary" style={{ padding: "0.25rem 0.5rem", fontSize: "0.8rem" }} onClick={() => handleOpenLessonForm(lesson)}>
                        Edit
                      </button>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: "0.25rem 0.5rem", fontSize: "0.8rem", color: "var(--color-rose)" }}
                        onClick={() => handleDeleteLesson(lesson.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
