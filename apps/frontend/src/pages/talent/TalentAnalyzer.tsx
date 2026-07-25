import React, { useState, useEffect } from "react";
import { useSupabase } from "../../context/SupabaseContext";

interface Question {
  id: string;
  question: string;
  options: string[];
  answer: string;
}

const defaultEnglishQuestions: Question[] = [
  {
    id: "eng-1",
    question: "Select the grammatically correct sentence for professional communication:",
    options: [
      "We have received your application and will review it shortly.",
      "We have received your application and will review it short.",
      "We received your application and review it shortly.",
      "We receive your application and reviewing it shortly."
    ],
    answer: "We have received your application and will review it shortly."
  },
  {
    id: "eng-2",
    question: "Choose the word that best fits: 'The software architecture requires a ___ database connection to ensure high availability.'",
    options: ["resilient", "reluctant", "redundant", "recurrent"],
    answer: "resilient"
  },
  {
    id: "eng-3",
    question: "What does the phrase 'hit the ground running' mean in a project setting?",
    options: [
      "To start a new project immediately with high energy and full speed",
      "To run away from a difficult bug",
      "To test the hardware foundation of a server",
      "To delay work until full specifications are available"
    ],
    answer: "To start a new project immediately with high energy and full speed"
  },
  {
    id: "eng-4",
    question: "Which sentence uses proper punctuation?",
    options: [
      "The team completed the sprint; however, two bugs remained.",
      "The team completed the sprint, however, two bugs remained.",
      "The team completed the sprint; however two bugs remained.",
      "The team completed the sprint however; two bugs remained."
    ],
    answer: "The team completed the sprint; however, two bugs remained."
  },
  {
    id: "eng-5",
    question: "Identify the closest synonym for 'concise':",
    options: ["Succinct", "Verbose", "Ambiguous", "Elaborate"],
    answer: "Succinct"
  }
];

const defaultIqQuestions: Question[] = [
  {
    id: "iq-1",
    question: "What number comes next in the sequence? 2, 6, 12, 20, 30, ___",
    options: ["42", "40", "44", "46"],
    answer: "42"
  },
  {
    id: "iq-2",
    question: "If all Zips are Zaps, and some Zaps are Zops, which statement MUST be true?",
    options: [
      "Some Zips might be Zops",
      "All Zips are Zops",
      "No Zips are Zops",
      "All Zops are Zips"
    ],
    answer: "Some Zips might be Zops"
  },
  {
    id: "iq-3",
    question: "Which number completes the pattern? 3 -> 9, 4 -> 16, 5 -> 25, 6 -> ___",
    options: ["36", "30", "32", "38"],
    answer: "36"
  },
  {
    id: "iq-4",
    question: "A project takes 6 developers 12 days to complete. How many days would it take 9 developers working at the same pace?",
    options: ["8 days", "6 days", "9 days", "10 days"],
    answer: "8 days"
  },
  {
    id: "iq-5",
    question: "Which item does NOT belong in the group: Algorithm, Heuristic, Function, Pseudocode, Molecule?",
    options: ["Molecule", "Algorithm", "Heuristic", "Pseudocode"],
    answer: "Molecule"
  }
];

const defaultMbtiQuestions: Question[] = [
  {
    id: "mbti-1",
    question: "In a team workspace environment, where do you draw your primary energy from?",
    options: [
      "Collaborating actively with teammates and group brainstorming (Extraversion - E)",
      "Deep focused solo work and independent problem solving (Introversion - I)"
    ],
    answer: ""
  },
  {
    id: "mbti-2",
    question: "When solving complex technical challenges, what is your default perspective?",
    options: [
      "Focusing on concrete data, existing facts, and practical step-by-step methods (Sensing - S)",
      "Exploring abstract concepts, future possibilities, and innovative big-picture frameworks (Intuition - N)"
    ],
    answer: ""
  },
  {
    id: "mbti-3",
    question: "How do you primarily make critical project decisions?",
    options: [
      "Analyzing objective logic, technical efficiency, and cause-and-effect criteria (Thinking - T)",
      "Evaluating human impact, team harmony, and personal/user values (Feeling - F)"
    ],
    answer: ""
  },
  {
    id: "mbti-4",
    question: "How do you prefer to manage project deadlines and workflows?",
    options: [
      "Following structured plans, clear schedules, and defined milestones (Judging - J)",
      "Staying flexible, adapting dynamically as requirements shift, and keeping options open (Perceiving - P)"
    ],
    answer: ""
  }
];

const defaultDiscQuestions: Question[] = [
  {
    id: "disc-1",
    question: "When facing a high-pressure project obstacle, what is your natural default reaction?",
    options: [
      "Take charge directly, drive immediate decisions, and push for results (Dominance - D)",
      "Rally the team, communicate enthusiastically, and inspire creative ideas (Influence - I)",
      "Maintain steady composure, support team members, and ensure stability (Steadiness - S)",
      "Analyze the root cause methodically, review specs, and ensure precision (Conscientiousness - C)"
    ],
    answer: ""
  },
  {
    id: "disc-2",
    question: "What is your primary motivation in a professional team environment?",
    options: [
      "Achieving ambitious goals and overcoming tough challenges (Dominance - D)",
      "Building strong relationships and engaging in collaborative teamwork (Influence - I)",
      "Creating a predictable, harmonious, and supportive environment (Steadiness - S)",
      "Delivering high-quality, accurate, and flawless craftsmanship (Conscientiousness - C)"
    ],
    answer: ""
  },
  {
    id: "disc-3",
    question: "How do you handle team communication and feedback?",
    options: [
      "Direct, concise, and to-the-point communication (Dominance - D)",
      "Persuasive, expressive, and optimistic dialogue (Influence - I)",
      "Patient, empathetic, and attentive listening (Steadiness - S)",
      "Detailed, structured, and evidence-based reporting (Conscientiousness - C)"
    ],
    answer: ""
  },
  {
    id: "disc-4",
    question: "What workspace atmosphere allows you to perform at your best?",
    options: [
      "Fast-paced with high autonomy and competitive challenges (Dominance - D)",
      "Dynamic, social, and creative collaborative environment (Influence - I)",
      "Reliable, cooperative team with clear mutual trust (Steadiness - S)",
      "Organized, systematic environment with high standards of quality (Conscientiousness - C)"
    ],
    answer: ""
  }
];

const mbtiTitles: Record<string, string> = {
  INTJ: "The Architect / Strategist",
  INTP: "The Logician / Innovator",
  ENTJ: "The Commander / Leader",
  ENTP: "The Debater / Visionary",
  INFJ: "The Advocate / Guide",
  INFP: "The Mediator / Idealist",
  ENFJ: "The Protagonist / Mentor",
  ENFP: "The Campaigner / Inspirer",
  ISTJ: "The Inspector / Administrator",
  ISFJ: "The Defender / Supporter",
  ESTJ: "The Executive / Manager",
  ESFJ: "The Consul / Collaborator",
  ISTP: "The Virtuoso / Craftsperson",
  ISFP: "The Adventurer / Artist",
  ESTP: "The Entrepreneur / Catalyst",
  ESFP: "The Entertainer / Facilitator"
};

export default function TalentAnalyzer(): React.ReactElement {
  const { supabase, profile, fetchProfile } = useSupabase();

  // Scored Quiz states
  const [frontendScore, setFrontendScore] = useState<number | null>(null);
  const [backendScore, setBackendScore] = useState<number | null>(null);
  const [aiScore, setAiScore] = useState<number | null>(null);
  const [englishScore, setEnglishScore] = useState<number | null>(null);
  const [iqScore, setIqScore] = useState<number | null>(null);

  // Personality & Behavior states
  const [mbtiResult, setMbtiResult] = useState<{ type: string; title: string } | null>(null);
  const [discResult, setDiscResult] = useState<{ trait: string; label: string } | null>(null);

  // Active quiz-taking states
  const [activeQuiz, setActiveQuiz] = useState<"frontend" | "backend" | "ai" | "english" | "iq" | "mbti" | "disc" | "interests" | null>(null);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});

  const [dbQuestions, setDbQuestions] = useState<{
    frontend: Question[];
    backend: Question[];
    ai: Question[];
    english: Question[];
    iq: Question[];
    mbti: Question[];
    disc: Question[];
  }>({
    frontend: [],
    backend: [],
    ai: [],
    english: defaultEnglishQuestions,
    iq: defaultIqQuestions,
    mbti: defaultMbtiQuestions,
    disc: defaultDiscQuestions,
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
          const english: Question[] = [];
          const iq: Question[] = [];
          const mbti: Question[] = [];
          const disc: Question[] = [];

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
            else if (q.category === "english") english.push(formatted);
            else if (q.category === "iq") iq.push(formatted);
            else if (q.category === "mbti") mbti.push(formatted);
            else if (q.category === "disc") disc.push(formatted);
          });

          setDbQuestions({
            frontend,
            backend,
            ai,
            english: english.length > 0 ? english : defaultEnglishQuestions,
            iq: iq.length > 0 ? iq : defaultIqQuestions,
            mbti: mbti.length > 0 ? mbti : defaultMbtiQuestions,
            disc: disc.length > 0 ? disc : defaultDiscQuestions,
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
      ai: aiScore !== null ? { score: aiScore } : undefined,
      english: englishScore !== null ? { score: englishScore } : undefined,
      iq: iqScore !== null ? { score: iqScore } : undefined,
      mbti: mbtiResult !== null ? { result: mbtiResult.type, title: mbtiResult.title } : undefined,
      disc: discResult !== null ? { trait: discResult.trait, label: discResult.label } : undefined,
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

  const hasTakenAnyQuiz = frontendScore !== null || backendScore !== null || aiScore !== null || englishScore !== null || iqScore !== null || mbtiResult !== null || discResult !== null;

  return (
    <div className="animate-fade-in">
      {activeQuiz === null ? (
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "2rem" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div className="glass-panel" style={{ padding: "2rem" }}>
              <h3>Skills & Interests Assessment</h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
                Complete technical, language, cognitive, and personality assessments to build your comprehensive candidate profile. Results enhance pgvector embedding precision for highly accurate Job Match alignment.
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

                {/* English Test Card */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--glass-border)", paddingBottom: "1rem" }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: "1.1rem" }}>English Proficiency Test</h4>
                    <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                      Evaluate grammar, vocabulary, and business communication. (5 Questions)
                    </p>
                  </div>
                  <div>
                    {englishScore !== null ? (
                      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                        <span className={`badge ${englishScore >= 3 ? "badge-emerald" : "badge-rose"}`} style={{ fontSize: "0.8rem" }}>
                          Score: {englishScore}/5 ({englishScore >= 3 ? "Passed" : "Fail"})
                        </span>
                        <button className="btn btn-secondary" style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem" }} onClick={() => { setActiveQuiz("english"); setCurrentQuestionIdx(0); setSelectedAnswers({}); }} id="btn-quiz-english-retake">
                          Retake
                        </button>
                      </div>
                    ) : (
                      <button className="btn btn-primary" style={{ padding: "0.5rem 1rem", fontSize: "0.85rem" }} onClick={() => { setActiveQuiz("english"); setCurrentQuestionIdx(0); setSelectedAnswers({}); }} id="btn-quiz-english-start">
                        Start Test
                      </button>
                    )}
                  </div>
                </div>

                {/* IQ Test Card */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--glass-border)", paddingBottom: "1rem" }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: "1.1rem" }}>Cognitive IQ Test</h4>
                    <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                      Test numerical series, logical deduction, and spatial reasoning. (5 Questions)
                    </p>
                  </div>
                  <div>
                    {iqScore !== null ? (
                      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                        <span className={`badge ${iqScore >= 3 ? "badge-emerald" : "badge-rose"}`} style={{ fontSize: "0.8rem" }}>
                          Score: {iqScore}/5 ({iqScore >= 3 ? "Passed" : "Fail"})
                        </span>
                        <button className="btn btn-secondary" style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem" }} onClick={() => { setActiveQuiz("iq"); setCurrentQuestionIdx(0); setSelectedAnswers({}); }} id="btn-quiz-iq-retake">
                          Retake
                        </button>
                      </div>
                    ) : (
                      <button className="btn btn-primary" style={{ padding: "0.5rem 1rem", fontSize: "0.85rem" }} onClick={() => { setActiveQuiz("iq"); setCurrentQuestionIdx(0); setSelectedAnswers({}); }} id="btn-quiz-iq-start">
                        Start Test
                      </button>
                    )}
                  </div>
                </div>

                {/* MBTI Test Card */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--glass-border)", paddingBottom: "1rem" }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: "1.1rem" }}>MBTI Personality Test</h4>
                    <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                      Discover your 4-letter Myers-Briggs personality style for team synergy. (4 Questions)
                    </p>
                  </div>
                  <div>
                    {mbtiResult !== null ? (
                      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                        <span className="badge badge-cyan" style={{ fontSize: "0.8rem" }}>
                          Type: {mbtiResult.type} ({mbtiResult.title})
                        </span>
                        <button className="btn btn-secondary" style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem" }} onClick={() => { setActiveQuiz("mbti"); setCurrentQuestionIdx(0); setSelectedAnswers({}); }} id="btn-quiz-mbti-retake">
                          Retake
                        </button>
                      </div>
                    ) : (
                      <button className="btn btn-primary" style={{ padding: "0.5rem 1rem", fontSize: "0.85rem" }} onClick={() => { setActiveQuiz("mbti"); setCurrentQuestionIdx(0); setSelectedAnswers({}); }} id="btn-quiz-mbti-start">
                        Start Test
                      </button>
                    )}
                  </div>
                </div>

                {/* DISC Test Card */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--glass-border)", paddingBottom: "1rem" }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: "1.1rem" }}>DISC Behavioral Assessment</h4>
                    <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                      Assess Dominance, Influence, Steadiness, and Conscientiousness. (4 Scenarios)
                    </p>
                  </div>
                  <div>
                    {discResult !== null ? (
                      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                        <span className="badge badge-emerald" style={{ fontSize: "0.8rem" }}>
                          {discResult.trait} ({discResult.label})
                        </span>
                        <button className="btn btn-secondary" style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem" }} onClick={() => { setActiveQuiz("disc"); setCurrentQuestionIdx(0); setSelectedAnswers({}); }} id="btn-quiz-disc-retake">
                          Retake
                        </button>
                      </div>
                    ) : (
                      <button className="btn btn-primary" style={{ padding: "0.5rem 1rem", fontSize: "0.85rem" }} onClick={() => { setActiveQuiz("disc"); setCurrentQuestionIdx(0); setSelectedAnswers({}); }} id="btn-quiz-disc-start">
                        Start Assessment
                      </button>
                    )}
                  </div>
                </div>

                {/* Career Preferences Card */}
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
              <h3>Generate Profile & Vectors for Job Match</h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "1.5rem" }}>
                Submit your combined technical scores, English proficiency, IQ, MBTI type, DISC profile, and preferences to build an enriched vector embedding (`skills_embedding`) for precision candidate matching in Job Match.
              </p>

              <button
                className="btn btn-success"
                style={{ width: "100%" }}
                onClick={() => runAIAnalysis()}
                disabled={analyzing || !hasTakenAnyQuiz}
                id="btn-submit-quiz-interests"
              >
                {analyzing ? "Generating Profile & Matching Embeddings..." : "Submit Assessments & Generate Job Match Profile"}
              </button>
              {!hasTakenAnyQuiz && (
                <p style={{ color: "var(--color-rose)", fontSize: "0.75rem", marginTop: "0.5rem", textAlign: "center" }}>
                  ⚠️ Please complete at least one assessment test before submitting.
                </p>
              )}
            </div>
          </div>

          {/* Analyzer Results (Right side) */}
          <div className="glass-panel" style={{ padding: "2rem" }}>
            <h3>Assessment & Profile Results</h3>
            {analyzing ? (
              <div style={{ padding: "3rem 0", textAlign: "center" }}>
                <p style={{ color: "var(--text-secondary)", marginBottom: "1rem" }}>Generating candidate biography, computing skill vectors, and indexing pgvector similarity...</p>
                <div className="badge badge-cyan">Processing AI Embedding...</div>
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
              <p style={{ color: "var(--text-secondary)" }}>Complete any assessment test and submit the form to generate your skill and interest profile for Job Match.</p>
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
        /* Assessment Test Taking Panel */
        (() => {
          const questions =
            activeQuiz === "frontend" ? dbQuestions.frontend :
            activeQuiz === "backend" ? dbQuestions.backend :
            activeQuiz === "ai" ? dbQuestions.ai :
            activeQuiz === "english" ? dbQuestions.english :
            activeQuiz === "iq" ? dbQuestions.iq :
            activeQuiz === "mbti" ? dbQuestions.mbti :
            dbQuestions.disc;

          if (!questions || questions.length === 0) {
            return (
              <div className="glass-panel animate-fade-in" style={{ padding: "2.5rem", maxWidth: "700px", margin: "0 auto", textAlign: "center" }}>
                <h3 style={{ marginBottom: "1rem" }}>Assessment Unavailable</h3>
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

          const getCategoryTitle = () => {
            if (activeQuiz === "frontend") return "Frontend Development Quiz";
            if (activeQuiz === "backend") return "Backend Development Quiz";
            if (activeQuiz === "ai") return "AI & Data Science Quiz";
            if (activeQuiz === "english") return "English Proficiency Test";
            if (activeQuiz === "iq") return "Cognitive IQ Test";
            if (activeQuiz === "mbti") return "MBTI Personality Test";
            if (activeQuiz === "disc") return "DISC Behavioral Assessment";
            return "Assessment";
          };

          return (
            <div className="glass-panel animate-fade-in" style={{ padding: "2.5rem", maxWidth: "700px", margin: "0 auto" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <span className="badge badge-cyan" style={{ textTransform: "uppercase" }}>
                  {getCategoryTitle()}
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
                      if (activeQuiz === "frontend" || activeQuiz === "backend" || activeQuiz === "ai" || activeQuiz === "english" || activeQuiz === "iq") {
                        let score = 0;
                        questions.forEach((q, idx) => {
                          if (selectedAnswers[idx] === q.answer) {
                            score++;
                          }
                        });
                        if (activeQuiz === "frontend") setFrontendScore(score);
                        if (activeQuiz === "backend") setBackendScore(score);
                        if (activeQuiz === "ai") setAiScore(score);
                        if (activeQuiz === "english") setEnglishScore(score);
                        if (activeQuiz === "iq") setIqScore(score);
                      } else if (activeQuiz === "mbti") {
                        // Compute MBTI
                        let eScore = 0, iScore = 0, sScore = 0, nScore = 0, tScore = 0, fScore = 0, jScore = 0, pScore = 0;
                        // Q1: E vs I
                        if (selectedAnswers[0]?.includes("Extraversion")) eScore++; else iScore++;
                        // Q2: S vs N
                        if (selectedAnswers[1]?.includes("Sensing")) sScore++; else nScore++;
                        // Q3: T vs F
                        if (selectedAnswers[2]?.includes("Thinking")) tScore++; else fScore++;
                        // Q4: J vs P
                        if (selectedAnswers[3]?.includes("Judging")) jScore++; else pScore++;

                        const typeStr = `${eScore >= iScore ? "E" : "I"}${nScore >= sScore ? "N" : "S"}${tScore >= fScore ? "T" : "F"}${jScore >= pScore ? "J" : "P"}`;
                        const titleStr = mbtiTitles[typeStr] || "The Strategist";
                        setMbtiResult({ type: typeStr, title: titleStr });
                      } else if (activeQuiz === "disc") {
                        // Compute DISC
                        let dCount = 0, iCount = 0, sCount = 0, cCount = 0;
                        Object.values(selectedAnswers).forEach((ans) => {
                          if (ans.includes("Dominance")) dCount++;
                          else if (ans.includes("Influence")) iCount++;
                          else if (ans.includes("Steadiness")) sCount++;
                          else if (ans.includes("Conscientiousness")) cCount++;
                        });
                        const maxCount = Math.max(dCount, iCount, sCount, cCount);
                        let trait = "High D";
                        let label = "Dominant / Result-Driven Leader";
                        if (maxCount === iCount) {
                          trait = "High I";
                          label = "Influential / Collaborative Communicator";
                        } else if (maxCount === sCount) {
                          trait = "High S";
                          label = "Steady / Supportive Team Player";
                        } else if (maxCount === cCount) {
                          trait = "High C";
                          label = "Conscientious / Precision Specialist";
                        }
                        setDiscResult({ trait, label });
                      }

                      setActiveQuiz(null);
                    }}
                    disabled={!selectedAnswers[currentQuestionIdx]}
                    id="btn-quiz-finish"
                  >
                    Finish Assessment
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
