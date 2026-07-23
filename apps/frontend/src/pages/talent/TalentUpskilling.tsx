import React, { useState, useEffect, useCallback } from "react";
import { useSupabase } from "../../context/SupabaseContext";
import { generateNanoId } from "../../utils/nanoid";

export default function TalentUpskilling(): React.ReactElement {
  const { supabase, profile } = useSupabase();

  const [courses, setCourses] = useState<any[]>([]);
  const [loadingCourses, setLoadingCourses] = useState<boolean>(true);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  
  // Course Player states
  const [activePlayingCourse, setActivePlayingCourse] = useState<any | null>(null);
  const [courseLessons, setCourseLessons] = useState<any[]>([]);
  const [loadingCourseLessons, setLoadingCourseLessons] = useState<boolean>(false);
  const [activeLessonIdx, setActiveLessonIdx] = useState<number>(0);
  const [allLessonsSummary, setAllLessonsSummary] = useState<Record<string, number>>({});

  const profileId = profile?.id;
  const skillGaps = profile?.skill_gaps;

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

  const loadCourses = useCallback(async () => {
    setLoadingCourses(true);
    try {
      let query = supabase.from("courses").select("*");
      if (skillGaps && skillGaps.length > 0) {
        query = query.overlaps("skills_taught", skillGaps);
      }
      
      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        setCourses(data);
      } else {
        const { data: all } = await supabase.from("courses").select("*").limit(6);
        setCourses(all || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingCourses(false);
    }
  }, [skillGaps, supabase]);

  useEffect(() => {
    loadEnrollments();
    fetchAllLessonsSummary();
    loadCourses();
  }, [loadEnrollments, fetchAllLessonsSummary, loadCourses]);

  const handleEnrollCourse = async (courseId: string) => {
    if (!profileId) return;
    try {
      const credId = generateNanoId(8);
      const { error } = await supabase
        .from("course_enrollments")
        .insert({
          user_id: profileId,
          course_id: courseId,
          completed_lessons: [],
          credential_id: credId
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
      const credId = enrollment.credential_id || (isCompletedAll ? generateNanoId(8) : null);

      const updateData: any = {
        completed_lessons: updatedCompleted,
        completed_at: completedAt,
        last_accessed_at: new Date().toISOString()
      };
      if (credId) {
        updateData.credential_id = credId;
      }

      const { error } = await supabase
        .from("course_enrollments")
        .update(updateData)
        .eq("id", enrollment.id);

      if (error) {
        console.error("Failed to update enrollment progress:", error);
      } else {
        setEnrollments(prev => prev.map(e => {
          if (e.id === enrollment.id) {
            return { ...e, completed_lessons: updatedCompleted, completed_at: completedAt, credential_id: credId };
          }
          return e;
        }));

        if (activeLessonIdx < courseLessons.length - 1) {
          setActiveLessonIdx(activeLessonIdx + 1);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
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
            {/* Outline Sidebar */}
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

                        <div style={{ fontSize: "1.1rem", lineHeight: "1.7", color: "var(--text-primary)", whiteSpace: "pre-wrap" }}>
                          {lesson.content}
                        </div>

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
