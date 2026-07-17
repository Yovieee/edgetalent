import React, { useState, useEffect } from "react";
import { useSupabase } from "../../context/SupabaseContext";

interface Question {
  id: string;
  question: string;
  options: string[];
  answer: string;
}

export default function TalentAnalyzer(): React.ReactElement {
  const { supabase, profile, fetchProfile } = useSupabase();

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

  // Career Interest states
  const [targetRole, setTargetRole] = useState<string>("Fullstack Developer");
  const [workArrangement, setWorkArrangement] = useState<string>("Remote");
  const [experienceLevel, setExperienceLevel] = useState<string>("Mid-level");
  const [goals, setGoals] = useState<string>("");

  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [analyzerError, setAnalyzerError] = useState<string>("");

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

  const runAIAnalysis = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!profile?.id) return;
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
      await fetchProfile(profile.id);
    } catch (err: any) {
      setAnalyzerError(err.message || "An error occurred during assessment profile generation.");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
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
          if (!questions || questions.length === 0) {
            return (
              <div className="glass-panel animate-fade-in" style={{ padding: "2.5rem", maxWidth: "700px", margin: "0 auto", textAlign: "center" }}>
                <h3 style={{ marginBottom: "1rem" }}>Quiz Unavailable</h3>
                <p style={{ color: "var(--text-secondary)", marginBottom: "2rem" }}>
                  No questions are currently loaded for this category. Please check back later.
                </p>
                <button className="btn btn-secondary" onClick={() => setActiveQuiz(null)}>
                  Back to Panel
                </button>
              </div>
            );
          }
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
                      let score = 0;
                      questions.forEach((q, idx) => {
                        if (selectedAnswers[idx] === q.answer) {
                          score++;
                        }
                      });
                      if (activeQuiz === "frontend") setFrontendScore(score);
                      if (activeQuiz === "backend") setBackendScore(score);
                      if (activeQuiz === "ai") setAiScore(score);
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
  );
}
