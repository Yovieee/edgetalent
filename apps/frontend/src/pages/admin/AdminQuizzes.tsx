import React, { useState, useEffect, useCallback } from "react";
import { useSupabase } from "../../context/SupabaseContext";
import { QuizQuestionSchema } from "@edgetalent/shared";

interface QuizItem {
  id: string;
  category: "frontend" | "backend" | "ai";
  question: string;
  options: string[];
  answer: string;
  created_at: string;
}

export default function AdminQuizzes(): React.ReactElement {
  const { supabase } = useSupabase();

  const [quizzes, setQuizzes] = useState<QuizItem[]>([]);
  const [loadingQuizzes, setLoadingQuizzes] = useState<boolean>(true);
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: "success" | "error" | "" }>({ text: "", type: "" });

  // Quiz Form Fields
  const [quizCategory, setQuizCategory] = useState<"frontend" | "backend" | "ai">("frontend");
  const [quizQuestionText, setQuizQuestionText] = useState("");
  const [quizOption1, setQuizOption1] = useState("");
  const [quizOption2, setQuizOption2] = useState("");
  const [quizOption3, setQuizOption3] = useState("");
  const [quizOption4, setQuizOption4] = useState("");
  const [quizAnswer, setQuizAnswer] = useState("");

  const [editMode, setEditMode] = useState<boolean>(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeModal, setActiveModal] = useState<"quiz" | null>(null);

  const showStatus = (text: string, type: "success" | "error") => {
    setStatusMsg({ text, type });
    setTimeout(() => setStatusMsg({ text: "", type: "" }), 4000);
  };

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

  useEffect(() => {
    fetchQuizzes();
  }, [fetchQuizzes]);

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

  return (
    <div className="glass-panel animate-fade-in" style={{ padding: "2rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h3 style={{ margin: 0 }}>Assessment Quiz Questions</h3>
        <button className="btn btn-primary" onClick={() => openQuizModal()}>
          Add Question
        </button>
      </div>

      {statusMsg.text && (
        <div className={`badge ${statusMsg.type === "error" ? "badge-rose" : "badge-emerald"}`} style={{ display: "block", padding: "0.8rem", textAlign: "center", marginBottom: "1.5rem" }}>
          {statusMsg.text}
        </div>
      )}

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
    </div>
  );
}
