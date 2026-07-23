import React, { useState, useEffect, useCallback } from "react";
import { useSupabase } from "../../context/SupabaseContext";
import { CourseSchema, CourseLessonSchema } from "@edgetalent/shared";
import Modal from "../../components/Modal";

interface CourseItem {
  id: string;
  title: string;
  description: string;
  skills_taught: string[];
  provider: string;
  link: string;
  created_at: string;
}

export default function AdminCourses(): React.ReactElement {
  const { supabase } = useSupabase();

  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [loadingCourses, setLoadingCourses] = useState<boolean>(true);
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: "success" | "error" | "" }>({ text: "", type: "" });

  // Course Form Fields
  const [courseTitle, setCourseTitle] = useState("");
  const [courseDesc, setCourseDesc] = useState("");
  const [courseSkills, setCourseSkills] = useState("");
  const [courseProvider, setCourseProvider] = useState("");
  const [courseLink, setCourseLink] = useState("");
  const [editMode, setEditMode] = useState<boolean>(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Lesson states
  const [selectedCourseForLessons, setSelectedCourseForLessons] = useState<CourseItem | null>(null);
  const [lessons, setLessons] = useState<any[]>([]);
  const [loadingLessons, setLoadingLessons] = useState<boolean>(false);
  const [showLessonForm, setShowLessonForm] = useState<boolean>(false);
  const [lessonEditMode, setLessonEditMode] = useState<boolean>(false);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);

  // Lesson Form Fields
  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonContent, setLessonContent] = useState("");
  const [lessonSequence, setLessonSequence] = useState<number>(1);
  const [lessonDuration, setLessonDuration] = useState<number>(10);

  // Modal active states
  const [activeModal, setActiveModal] = useState<"course" | "lessons" | null>(null);

  const showStatus = (text: string, type: "success" | "error") => {
    setStatusMsg({ text, type });
    setTimeout(() => setStatusMsg({ text: "", type: "" }), 4000);
  };

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

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

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

  // Lesson functions
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

  return (
    <div className="glass-panel animate-fade-in" style={{ padding: "2rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h3 style={{ margin: 0 }}>Upskilling Courses Catalog</h3>
        <button className="btn btn-primary" onClick={() => openCourseModal()}>
          Add Course
        </button>
      </div>

      {statusMsg.text && (
        <div className={`badge ${statusMsg.type === "error" ? "badge-rose" : "badge-emerald"}`} style={{ display: "block", padding: "0.8rem", textAlign: "center", marginBottom: "1.5rem" }}>
          {statusMsg.text}
        </div>
      )}

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

      {/* Course Modal Form */}
      <Modal
        isOpen={activeModal === "course"}
        onClose={() => setActiveModal(null)}
        title={editMode ? "Edit Course Details" : "Create New Course"}
        size="md"
      >
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
      </Modal>

      {/* Lesson Manager Modal */}
      <Modal
        isOpen={activeModal === "lessons" && !!selectedCourseForLessons}
        onClose={() => setActiveModal(null)}
        title={selectedCourseForLessons ? `Lessons for ${selectedCourseForLessons.title}` : "Lesson Manager"}
        size="lg"
      >
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
                  background: "var(--bg-tertiary)",
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
      </Modal>
    </div>
  );
}
