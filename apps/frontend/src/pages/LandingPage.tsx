import React, { useState, useEffect, useRef } from "react";

interface LandingPageProps {
  onNavigate: (path: string) => void;
}

export default function LandingPage({ onNavigate }: LandingPageProps): React.ReactElement {
  const [activeTab, setActiveTab] = useState<"talent" | "partner">("talent");

  // Talent Simulator State
  const [talentPreset, setTalentPreset] = useState<"frontend" | "backend" | "ai">("frontend");
  const [isRunningAnalysis, setIsRunningAnalysis] = useState<boolean>(false);
  const [talentLogs, setTalentLogs] = useState<string[]>([]);
  const [analysisResult, setAnalysisResult] = useState<{
    skills: string[];
    skillGaps: string[];
    courses: string[];
  } | null>(null);

  // Partner Simulator State
  const [searchPreset, setSearchPreset] = useState<string>("Python developer for AI embedding pipeline");
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [matchResults, setMatchResults] = useState<Array<{
    name: string;
    role: string;
    score: number;
    overlap: string[];
    avatar: string;
    bio: string;
  }>>([]);

  // FAQ State
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const terminalRef = useRef<HTMLDivElement>(null);

  // Scroll terminal to bottom on log updates
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [talentLogs]);

  // Presets mapping for Talent
  const talentPresetData = {
    frontend: {
      input: "React developer, strong CSS and JS, needs to learn TypeScript and cloud tools",
      skills: ["HTML5 & CSS3", "JavaScript (ES6+)", "React Framework", "Responsive Design"],
      skillGaps: ["TypeScript Integration", "AWS Cloud Deployments", "Real-time WebSockets"],
      courses: [
        "TypeScript Production Guide (EdgeTalent Academy)",
        "AWS Cloud Practitioner Suite (Cloud Academy)",
        "WebSockets & Socket.io for Real-Time Apps (EdgeTalent Hub)"
      ]
    },
    backend: {
      input: "Python coder, built small Flask APIs, needs to learn PostgreSQL, pgvector, Docker",
      skills: ["Python Programming", "Flask APIs", "SQL Basics", "Git Version Control"],
      skillGaps: ["PostgreSQL & pgvector", "Docker Containerization", "Distributed Systems Architecture"],
      courses: [
        "pgvector & Semantic Search in Postgres (EdgeTalent Academy)",
        "Docker & Kubernetes Container Course (Udemy Business)",
        "Building High-Availability APIs (EdgeTalent Premium)"
      ]
    },
    ai: {
      input: "Mathematical background, knows basic numpy/pandas, wants to learn PyTorch, prompt engineering",
      skills: ["Python Basics", "NumPy & Pandas Dataframes", "Linear Algebra & Calculus", "Stats Modeling"],
      skillGaps: ["PyTorch Deep Learning", "LLM Prompt Architecture", "Vector Embeddings & Search"],
      courses: [
        "Deep Learning Foundations with PyTorch (Fast.ai)",
        "Advanced Prompt Engineering & Agent Workflows (DeepLearning.AI)",
        "Vector Embeddings & Semantic Search Architectures (EdgeTalent Academy)"
      ]
    }
  };

  const handleRunAnalysis = () => {
    setIsRunningAnalysis(true);
    setTalentLogs([]);
    setAnalysisResult(null);

    const logMessages = [
      { text: "Connecting to EdgeTalent Deno Edge Function...", delay: 0 },
      { text: "Reading profile context... Preset selected: " + talentPreset.toUpperCase(), delay: 600 },
      { text: "Invoking OpenRouter AI Engine (model: google/gemini-2.5-flash)...", delay: 1200 },
      { text: "Comparing profile against 140+ industry-standard curriculum mappings...", delay: 1800 },
      { text: "Calculating vector distance skill-gaps...", delay: 2400 },
      { text: "Generating 1536-dimensional skills embedding (openai/text-embedding-3-small)...", delay: 3000 },
      { text: "Writing updated skills data to public.profiles schema...", delay: 3600 },
      { text: "Success! Profile fully analyzed and indexed in pgvector.", delay: 4100 }
    ];

    logMessages.forEach((msg) => {
      setTimeout(() => {
        setTalentLogs((prev) => [...prev, msg.text]);
      }, msg.delay);
    });

    setTimeout(() => {
      setIsRunningAnalysis(false);
      setAnalysisResult({
        skills: talentPresetData[talentPreset].skills,
        skillGaps: talentPresetData[talentPreset].skillGaps,
        courses: talentPresetData[talentPreset].courses
      });
    }, 4500);
  };

  const handleRunSearch = () => {
    setIsSearching(true);
    setMatchResults([]);

    setTimeout(() => {
      setIsSearching(false);
      if (searchPreset.includes("React")) {
        setMatchResults([
          {
            name: "Jane Doe",
            role: "Senior Frontend Engineer",
            score: 98,
            overlap: ["React", "TypeScript", "AWS", "CSS Grid"],
            avatar: "JD",
            bio: "Specializes in building high-fidelity glassmorphic React portals. Extensive experience with TypeScript and cloud infrastructure."
          },
          {
            name: "John Smith",
            role: "Frontend Developer",
            score: 91,
            overlap: ["React", "JavaScript", "Responsive Design"],
            avatar: "JS",
            bio: "Vibrant UI designer turned developer. Focused on animations and smooth micro-interactions in React."
          },
          {
            name: "Alex Wong",
            role: "UI Engineer",
            score: 84,
            overlap: ["HTML5 & CSS3", "React"],
            avatar: "AW",
            bio: "Experienced stylesheet expert. Enjoys building clean design systems and responsive layouts."
          }
        ]);
      } else if (searchPreset.includes("Python")) {
        setMatchResults([
          {
            name: "Sam Chen",
            role: "AI Integration Specialist",
            score: 99,
            overlap: ["Python", "pgvector", "Docker", "Flask"],
            avatar: "SC",
            bio: "AI Engineer specializing in vector search, similarity queries, and custom LLM agent systems built with pgvector and Supabase."
          },
          {
            name: "Sarah Lin",
            role: "Backend Engineer",
            score: 88,
            overlap: ["Python", "Flask", "Git"],
            avatar: "SL",
            bio: "Database developer with strong knowledge of API design, PostgreSQL schemas, and version control processes."
          },
          {
            name: "Michael Kim",
            role: "Data Programmer",
            score: 76,
            overlap: ["Python", "SQL Basics"],
            avatar: "MK",
            bio: "Junior backend enthusiast looking to expand into deep learning and vector databases."
          }
        ]);
      } else {
        setMatchResults([
          {
            name: "Emily Taylor",
            role: "Fullstack Designer",
            score: 96,
            overlap: ["React Framework", "HTML5 & CSS3", "Figma Design"],
            avatar: "ET",
            bio: "Bridging the gap between beautiful layouts and robust client logic. Extensive history of custom component design."
          },
          {
            name: "Carlos Ruiz",
            role: "UI/UX Developer",
            score: 89,
            overlap: ["React Framework", "CSS Grid"],
            avatar: "CR",
            bio: "Frontend engineer with a keen eye for color theory, alignment, and modern aesthetics."
          },
          {
            name: "Lisa Wang",
            role: "Creative Coder",
            score: 81,
            overlap: ["HTML5 & CSS3", "JavaScript (ES6+)"],
            avatar: "LW",
            bio: "Enthusiastic developer focused on styling patterns, component usability, and responsive viewports."
          }
        ]);
      }
    }, 1500);
  };

  // Run initial search to show user some output right away when they open Partner tab
  useEffect(() => {
    if (activeTab === "partner" && matchResults.length === 0) {
      handleRunSearch();
    }
  }, [activeTab]);

  const faqs = [
    {
      q: "What is EdgeTalent?",
      a: "EdgeTalent is a comprehensive digital ecosystem dividing career growth into two pipelines: Upstream (EdgeTalent Foundation) which focuses on AI skill-gap assessment and courses, and Downstream (EdgeTalent Group) which matches talented candidates to corporate client projects."
    },
    {
      q: "How does the AI Skill-Gap Analyzer work?",
      a: "We feed your CV or profile details to the google/gemini-2.5-flash model via the OpenRouter API. The model analyzes your skills against current market needs and identifies gaps. We then recommend specific upskilling courses from our database."
    },
    {
      q: "What is pgvector and how is semantic search used?",
      a: "pgvector is a Postgres extension that stores mathematical vector representations (embeddings) of text. We generate 1536-dimensional embeddings of your talent bio and project description. We then compute cosine similarities using a database RPC query to identify high-accuracy compatibility matches."
    },
    {
      q: "How can I join the ecosystem?",
      a: "Simply click 'Get Started' or 'Login / Register'. Once signed up, our Role Onboarding screen will guide you to select your path: 'Talent' (to access upskilling and apply to projects) or 'Partner' (to post project scopes and semantic search for talent)."
    }
  ];

  return (
    <div className="landing-wrapper" style={{ position: "relative", overflow: "hidden" }}>
      {/* Decorative Blur Ambient Elements */}
      <div className="ambient-glow glow-cyan-left"></div>
      <div className="ambient-glow glow-purple-right"></div>

      {/* Modern Sticky Navigation */}
      <nav className="navbar animate-fade-in" id="landing-nav">
        <div className="navbar-brand" onClick={() => onNavigate("/")} id="logo-brand">
          <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: "0.25rem" }}>
            <rect x="2" y="2" width="28" height="28" rx="8" fill="url(#logo-gradient)" />
            <path d="M10 22V10L16 16L22 10V22" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            <defs>
              <linearGradient id="logo-gradient" x1="2" y1="2" x2="30" y2="30" gradientUnits="userSpaceOnUse">
                <stop stopColor="#0891b2" />
                <stop offset="1" stopColor="#7c3aed" />
              </linearGradient>
            </defs>
          </svg>
          EdgeTalent
        </div>
        <div className="navbar-tabs" style={{ gap: "1.5rem" }}>
          <a href="#features" className="nav-tab" style={{ border: "none" }}>Features</a>
          <a href="#pillars" className="nav-tab" style={{ border: "none" }}>Ecosystem Pillars</a>
          <a href="#stats" className="nav-tab" style={{ border: "none" }}>Platform Metrics</a>
          <a href="#faqs" className="nav-tab" style={{ border: "none" }}>FAQs</a>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button className="btn btn-secondary" onClick={() => onNavigate("auth")} id="nav-btn-login">
            Login
          </button>
          <button className="btn btn-primary" onClick={() => onNavigate("auth")} id="nav-btn-register">
            Get Started
          </button>
        </div>
      </nav>

      {/* Main Container */}
      <div className="landing-container animate-fade-in" style={{ maxWidth: "1200px", margin: "0 auto", padding: "1rem 2rem 4rem 2rem", position: "relative", zIndex: 1 }}>
        
        {/* Hero Section */}
        <header className="landing-grid" style={{ marginBottom: "6rem", minHeight: "60vh" }}>
          <div className="hero-text-block">
            <div style={{ display: "inline-flex", gap: "0.5rem", alignItems: "center", marginBottom: "1.5rem" }}>
              <span className="badge badge-cyan" style={{ fontSize: "0.85rem", padding: "0.4rem 0.9rem" }}>AI-Driven Platform</span>
              <span className="badge badge-purple" style={{ fontSize: "0.85rem", padding: "0.4rem 0.9rem" }}>v2.0 Launched</span>
            </div>
            <h1 style={{ fontSize: "3.75rem", lineHeight: "1.15", marginBottom: "1.5rem", fontWeight: 800, letterSpacing: "-0.03em" }}>
              Bridging <span style={{ background: "var(--grad-cyan-purple)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Talent Development</span> & Industrial Demand
            </h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "1.2rem", marginBottom: "2.5rem", lineHeight: "1.65", maxWidth: "560px" }}>
              Accelerate your professional career with AI-guided roadmap diagnostics or hire elite vetted candidates matched using semantic pgvector vector similarity searches.
            </p>
            <div style={{ display: "flex", gap: "1rem" }}>
              <button className="btn btn-primary" onClick={() => onNavigate("auth")} style={{ padding: "0.85rem 1.8rem" }} id="hero-btn-talent">
                Join as Talent
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
              </button>
              <button className="btn btn-secondary" onClick={() => onNavigate("auth")} style={{ padding: "0.85rem 1.8rem" }} id="hero-btn-partner">
                Hire Elite Teams
              </button>
            </div>
          </div>

          {/* Floating Simulated Dashboard Mockup */}
          <div className="hero-mockup-block animate-float" style={{ position: "relative" }}>
            <div className="glass-panel" style={{ padding: "1.5rem", width: "100%", maxWidth: "480px", margin: "0 auto", border: "1px solid rgba(255,255,255,0.15)", position: "relative" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", borderBottom: "1px solid var(--glass-border)", paddingBottom: "0.75rem" }}>
                <div style={{ display: "flex", gap: "0.4rem" }}>
                  <span style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#ef4444" }}></span>
                  <span style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#eab308" }}></span>
                  <span style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#22c55e" }}></span>
                </div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontFamily: "monospace" }}>talent_matrix_diagnostics.exe</div>
              </div>

              {/* Mock Dashboard Widgets */}
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div style={{ display: "flex", gap: "1rem" }}>
                  <div className="glass-panel" style={{ flex: 1, padding: "1rem", background: "rgba(255,255,255,0.4)" }}>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>AI Match Accuracy</div>
                    <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--color-cyan)", marginTop: "0.25rem" }}>98.7%</div>
                  </div>
                  <div className="glass-panel" style={{ flex: 1, padding: "1rem", background: "rgba(255,255,255,0.4)" }}>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Skills Vector</div>
                    <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--color-purple)", marginTop: "0.25rem" }}>1,536d</div>
                  </div>
                </div>

                <div className="glass-panel" style={{ padding: "1rem", background: "rgba(255,255,255,0.4)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                    <span style={{ fontSize: "0.8rem", fontWeight: 700 }}>Upskilling Progress</span>
                    <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--color-emerald)" }}>80% Done</span>
                  </div>
                  <div style={{ height: "6px", background: "rgba(0,0,0,0.08)", borderRadius: "999px", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: "80%", background: "var(--grad-emerald-cyan)", borderRadius: "999px" }}></div>
                  </div>
                </div>

                <div className="glass-panel" style={{ padding: "1rem", background: "rgba(255,255,255,0.4)", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#22c55e", animation: "ping 1.5s infinite" }}></div>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                    <strong>Partner Search:</strong> Matched 8 talents for "Python/AI Developer"
                  </div>
                </div>
              </div>
            </div>

            {/* Behind Ambient Glow Card */}
            <div className="glass-panel animate-float-delayed" style={{ position: "absolute", top: "40px", right: "-20px", width: "160px", padding: "1rem", background: "var(--glass-bg)", zIndex: -1, opacity: 0.85, border: "1px solid rgba(255,255,255,0.2)" }}>
              <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Talent Earnings</div>
              <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "#10b981", margin: "0.25rem 0" }}>+$12,450</div>
              <span className="badge badge-emerald" style={{ scale: "0.8" }}>Contract Paid</span>
            </div>
          </div>
        </header>

        {/* Interactive Feature Showcase Section */}
        <section id="features" className="showcase-container">
          <div style={{ textAlign: "center", marginBottom: "4rem" }}>
            <span className="badge badge-cyan" style={{ marginBottom: "1rem", padding: "0.4rem 0.9rem" }}>Live Playground</span>
            <h2 style={{ fontSize: "2.75rem", marginBottom: "1rem" }}>Experience EdgeTalent in Action</h2>
            <p style={{ color: "var(--text-secondary)", maxWidth: "600px", margin: "0 auto" }}>
              Interact with our simulated core interfaces to see how we parse skill-gaps and compute vector-similarity matches.
            </p>
          </div>

          {/* Selector Tabs */}
          <div className="showcase-tabs">
            <button
              className={`showcase-tab-btn ${activeTab === "talent" ? "active-talent" : ""}`}
              onClick={() => setActiveTab("talent")}
              id="tab-btn-talent"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
              Talent Skill-Gap Analyzer
            </button>
            <button
              className={`showcase-tab-btn ${activeTab === "partner" ? "active-partner" : ""}`}
              onClick={() => setActiveTab("partner")}
              id="tab-btn-partner"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect><rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect><line x1="6" y1="6" x2="6.01" y2="6"></line><line x1="6" y1="18" x2="6.01" y2="18"></line></svg>
              Semantic pgvector Matcher
            </button>
          </div>

          {/* Interactive Panels */}
          <div className="glass-panel" style={{ padding: "2.5rem", minHeight: "450px" }}>
            
            {/* 1. TALENT ANALYZER PLAYGROUND */}
            {activeTab === "talent" && (
              <div className="showcase-panel">
                <div>
                  <h3 style={{ fontSize: "1.75rem", marginBottom: "1rem", color: "var(--text-primary)" }}>
                    AI Skill-Gap Diagnostics
                  </h3>
                  <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem", lineHeight: "1.6" }}>
                    Select a target profile direction below. The simulator will pass the details to a mock Deno Edge Function client to index the skills and identify gaps.
                  </p>

                  <div className="form-group" style={{ marginBottom: "1.5rem" }}>
                    <label style={{ fontWeight: 700, fontSize: "0.8rem" }}>Choose Target Role Preset:</label>
                    <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
                      {(["frontend", "backend", "ai"] as const).map((role) => (
                        <button
                          key={role}
                          onClick={() => {
                            if (!isRunningAnalysis) setTalentPreset(role);
                          }}
                          className={`btn ${talentPreset === role ? "btn-primary" : "btn-secondary"}`}
                          style={{ fontSize: "0.85rem", padding: "0.5rem 1rem", textTransform: "capitalize" }}
                          disabled={isRunningAnalysis}
                          id={`preset-btn-${role}`}
                        >
                          {role === "ai" ? "AI Engineer" : role + "end"}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: "2rem" }}>
                    <label style={{ fontWeight: 700, fontSize: "0.8rem" }}>Simulated CV / Description Input:</label>
                    <textarea
                      className="form-textarea"
                      style={{ height: "90px", resize: "none", fontSize: "0.85rem", background: "rgba(0,0,0,0.02)" }}
                      value={talentPresetData[talentPreset].input}
                      readOnly
                    />
                  </div>

                  <button
                    className="btn btn-success"
                    onClick={handleRunAnalysis}
                    disabled={isRunningAnalysis}
                    style={{ width: "100%", padding: "0.8rem", justifyContent: "center" }}
                    id="btn-run-analysis"
                  >
                    {isRunningAnalysis ? (
                      <>
                        <span className="spinner" style={{
                          display: "inline-block",
                          width: "14px",
                          height: "14px",
                          border: "2px solid rgba(255,255,255,0.3)",
                          borderTopColor: "white",
                          borderRadius: "50%",
                          animation: "spin 0.8s linear infinite"
                        }}></span>
                        Running Diagnostics...
                      </>
                    ) : (
                      <>
                        Run AI Skill Analysis
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
                      </>
                    )}
                  </button>
                </div>

                {/* Right Side Terminal & Results */}
                <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                  <div className="form-group">
                    <label style={{ fontWeight: 700, fontSize: "0.8rem", color: "var(--text-muted)" }}>Edge Execution Console Logs:</label>
                    <div className="sim-terminal" ref={terminalRef} id="talent-terminal-logs">
                      {talentLogs.length === 0 && (
                        <div style={{ color: "var(--text-muted)", fontStyle: "italic" }}>
                          Waiting for execution... Press "Run AI Skill Analysis" to begin.
                        </div>
                      )}
                      {talentLogs.map((log, idx) => {
                        let statusClass = "";
                        if (log.includes("Success!") || log.includes("Complete!")) statusClass = "success";
                        if (log.includes("Invoking") || log.includes("Connecting")) statusClass = "warning";
                        return (
                          <div key={idx} className={`sim-terminal-line ${statusClass}`}>
                            &gt; {log}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Diagnostic Output */}
                  {analysisResult && (
                    <div className="glass-panel animate-fade-in" style={{ padding: "1.25rem", background: "rgba(255,255,255,0.4)" }} id="talent-analysis-results">
                      <h4 style={{ fontSize: "1rem", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#10b981" }}></span>
                        Diagnostic Mapping Complete
                      </h4>
                      <div className="sim-skills-grid">
                        <div className="sim-skill-bar-container">
                          <div className="sim-skill-label">
                            <span>Target Role Alignment</span>
                            <span>65% Match</span>
                          </div>
                          <div className="sim-skill-bar-bg">
                            <div className="sim-skill-bar-fill fill-cyan" style={{ width: "65%" }}></div>
                          </div>
                        </div>

                        <div>
                          <div style={{ fontSize: "0.8rem", fontWeight: 700, marginBottom: "0.25rem", color: "var(--text-secondary)" }}>Identified Skill Gaps:</div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                            {analysisResult.skillGaps.map((gap, i) => (
                              <span key={i} className="badge badge-rose" style={{ fontSize: "0.7rem" }}>{gap}</span>
                            ))}
                          </div>
                        </div>

                        <div style={{ borderTop: "1px solid var(--glass-border)", paddingTop: "0.75rem" }}>
                          <div style={{ fontSize: "0.8rem", fontWeight: 700, marginBottom: "0.4rem", color: "var(--text-secondary)" }}>Recommended Pathways:</div>
                          <ul style={{ fontSize: "0.8rem", paddingLeft: "1.1rem", color: "var(--text-secondary)", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                            {analysisResult.courses.map((course, i) => (
                              <li key={i}>{course}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 2. PARTNER SIMILARITY SEARCH PLAYGROUND */}
            {activeTab === "partner" && (
              <div className="showcase-panel">
                <div>
                  <h3 style={{ fontSize: "1.75rem", marginBottom: "1rem", color: "var(--text-primary)" }}>
                    pgvector Vector Similarity search
                  </h3>
                  <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem", lineHeight: "1.6" }}>
                    Post a project scope or type a search query. The database will perform a high-speed cosine vector match query to rank candidates.
                  </p>

                  <div className="form-group" style={{ marginBottom: "1.5rem" }}>
                    <label style={{ fontWeight: 700, fontSize: "0.8rem" }}>Select Semantic Query Preset:</label>
                    <select
                      className="form-select"
                      value={searchPreset}
                      onChange={(e) => setSearchPreset(e.target.value)}
                      disabled={isSearching}
                      id="select-search-query"
                    >
                      <option value="Senior React Developer with cloud skills">React UI Developer + Cloud</option>
                      <option value="Python developer for AI embedding pipeline">Python Backend & Vector Databases</option>
                      <option value="Fullstack designer with React and Figma">UI Designer with Front-end Coding</option>
                    </select>
                  </div>

                  <button
                    className="btn btn-primary"
                    onClick={handleRunSearch}
                    disabled={isSearching}
                    style={{ width: "100%", padding: "0.8rem", justifyContent: "center" }}
                    id="btn-run-search"
                  >
                    {isSearching ? (
                      <>
                        <span className="spinner" style={{
                          display: "inline-block",
                          width: "14px",
                          height: "14px",
                          border: "2px solid rgba(255,255,255,0.3)",
                          borderTopColor: "white",
                          borderRadius: "50%",
                          animation: "spin 0.8s linear infinite"
                        }}></span>
                        Searching Vector Space...
                      </>
                    ) : (
                      <>
                        Search Talents Semantically
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                      </>
                    )}
                  </button>
                </div>

                {/* Right Side Match Cards */}
                <div>
                  <div className="form-group">
                    <label style={{ fontWeight: 700, fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>
                      pgvector Match Rankings (Cosine Distance &lt;=&gt;):
                    </label>
                    
                    {isSearching ? (
                      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "200px", flexDirection: "column", gap: "0.5rem" }}>
                        <div style={{
                          width: "36px",
                          height: "36px",
                          border: "3px solid var(--glass-border)",
                          borderTopColor: "var(--color-purple)",
                          borderRadius: "50%",
                          animation: "spin 1s linear infinite"
                        }} />
                        <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Scanning embeddings index...</p>
                      </div>
                    ) : (
                      <div className="match-card-list" id="match-card-results-list">
                        {matchResults.map((candidate, idx) => (
                          <div
                            key={idx}
                            className="match-card"
                            style={{ animationDelay: `${idx * 150}ms` }}
                          >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                              <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                                <div className="avatar-badge" style={{ width: "32px", height: "32px", fontSize: "0.8rem" }}>
                                  {candidate.avatar}
                                </div>
                                <div>
                                  <div style={{ fontSize: "0.9rem", fontWeight: 700 }}>{candidate.name}</div>
                                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{candidate.role}</div>
                                </div>
                              </div>
                              <span className="badge badge-emerald" style={{ fontSize: "0.7rem", padding: "0.3rem 0.6rem" }}>
                                {candidate.score}% Match
                              </span>
                            </div>
                            <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "0.5rem", lineHeight: "1.4" }}>
                              {candidate.bio}
                            </div>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem" }}>
                              {candidate.overlap.map((skill, i) => (
                                <span key={i} className="badge badge-cyan" style={{ scale: "0.9", padding: "0.1rem 0.5rem" }}>
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

          </div>
        </section>

        {/* Pillars Section */}
        <section id="pillars" style={{ margin: "6rem 0" }}>
          <div style={{ textAlign: "center", marginBottom: "4rem" }}>
            <span className="badge badge-purple" style={{ marginBottom: "1rem", padding: "0.4rem 0.9rem" }}>Ecosystem Blueprint</span>
            <h2 style={{ fontSize: "2.75rem", marginBottom: "1rem" }}>The Double-Sided EdgeTalent Network</h2>
            <p style={{ color: "var(--text-secondary)", maxWidth: "600px", margin: "0 auto" }}>
              Our platform bridges talent growth pathways with actual market delivery structures for seamless matching.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "3rem" }}>
            {/* Pillar 1: Upstream */}
            <div className="glass-panel" style={{ padding: "3rem 2.5rem", textAlign: "left", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: "0", left: "0", width: "100%", height: "4px", background: "var(--grad-emerald-cyan)" }} />
              
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem" }}>
                <span className="badge badge-emerald" style={{ fontSize: "0.8rem", padding: "0.4rem 0.8rem" }}>Pillar 1: Upstream</span>
                <div style={{ background: "rgba(16, 185, 129, 0.08)", padding: "0.75rem", borderRadius: "12px", border: "1px solid rgba(16, 185, 129, 0.2)" }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12.5V16a6 6 0 0 0 12 0v-3.5"></path></svg>
                </div>
              </div>

              <h3 style={{ fontSize: "1.8rem", marginBottom: "1rem", color: "var(--text-primary)" }}>EdgeTalent Foundation</h3>
              <p style={{ color: "var(--text-secondary)", lineHeight: "1.65", marginBottom: "2rem" }}>
                Dedicated to upskilling, mentorship, customized structured courses, and career diagnostics. Upload your CV to extract missing concepts and target top pathways.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem", borderTop: "1px solid var(--glass-border)", paddingTop: "1.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.9rem", color: "var(--text-secondary)" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  AI Skill Gap Roadmapping
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.9rem", color: "var(--text-secondary)" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  Custom Training & Course Maps
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.9rem", color: "var(--text-secondary)" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  Incubation & Venture Mentorship
                </div>
              </div>
            </div>

            {/* Pillar 2: Downstream */}
            <div className="glass-panel" style={{ padding: "3rem 2.5rem", textAlign: "left", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: "0", left: "0", width: "100%", height: "4px", background: "var(--grad-cyan-purple)" }} />
              
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem" }}>
                <span className="badge badge-cyan" style={{ fontSize: "0.8rem", padding: "0.4rem 0.8rem" }}>Pillar 2: Downstream</span>
                <div style={{ background: "rgba(8, 145, 178, 0.08)", padding: "0.75rem", borderRadius: "12px", border: "1px solid rgba(8, 145, 178, 0.2)" }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0891b2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
                </div>
              </div>

              <h3 style={{ fontSize: "1.8rem", marginBottom: "1rem", color: "var(--text-primary)" }}>EdgeTalent Group</h3>
              <p style={{ color: "var(--text-secondary)", lineHeight: "1.65", marginBottom: "2rem" }}>
                Designed for enterprises and commercial partnerships. We pair corporate requirements with talents using semantic queries. Includes dashboard panels to monitor contract milestones.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem", borderTop: "1px solid var(--glass-border)", paddingTop: "1.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.9rem", color: "var(--text-secondary)" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0891b2" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  Semantic Talent Match Engine
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.9rem", color: "var(--text-secondary)" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0891b2" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  Project Manager Posting Portal
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.9rem", color: "var(--text-secondary)" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0891b2" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  Milestone tracking & Escrow Contracts
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Platform Metrics Section */}
        <section id="stats" className="stats-grid">
          <div className="glass-panel stat-card">
            <div className="stat-number cyan">10,000+</div>
            <div className="stat-label">Talents Trained</div>
          </div>
          <div className="glass-panel stat-card">
            <div className="stat-number emerald">150+</div>
            <div className="stat-label">Corporate Partners</div>
          </div>
          <div className="glass-panel stat-card">
            <div className="stat-number purple" style={{ background: "var(--grad-cyan-purple)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>98%</div>
            <div className="stat-label">Match Accuracy</div>
          </div>
          <div className="glass-panel stat-card">
            <div className="stat-number amber">$1.5M+</div>
            <div className="stat-label">Talent Paid</div>
          </div>
        </section>

        {/* User Testimonials Grid */}
        <section style={{ margin: "6rem 0" }}>
          <div style={{ textAlign: "center", marginBottom: "4rem" }}>
            <span className="badge badge-amber" style={{ marginBottom: "1rem", padding: "0.4rem 0.9rem" }}>Ecosystem Success</span>
            <h2 style={{ fontSize: "2.75rem", marginBottom: "1rem" }}>Trusted by Talents and Enterprises</h2>
            <p style={{ color: "var(--text-secondary)", maxWidth: "600px", margin: "0 auto" }}>
              Hear from developers who advanced their skillsets and team leads who automated their recruitment search loops.
            </p>
          </div>

          <div className="testimonials-grid">
            <div className="glass-panel testimonial-card">
              <div style={{ display: "flex", gap: "0.25rem", marginBottom: "1.25rem" }}>
                {[...Array(5)].map((_, i) => (
                  <svg key={i} width="16" height="16" viewBox="0 0 24 24" fill="#fbbf24" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                ))}
              </div>
              <p className="testimonial-quote">
                "The AI Skill-Gap Analyzer completely changed my roadmap. I was struggling to land frontend jobs until the platform highlighted that I lacked TypeScript and WebSockets expertise, recommending the precise modules to resolve the gaps."
              </p>
              <div className="testimonial-user">
                <div className="testimonial-avatar">SL</div>
                <div>
                  <div style={{ fontSize: "0.95rem", fontWeight: 700 }}>Sarah Lin</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Junior Fullstack Dev, formerly Self-Taught</div>
                </div>
              </div>
            </div>

            <div className="glass-panel testimonial-card">
              <div style={{ display: "flex", gap: "0.25rem", marginBottom: "1.25rem" }}>
                {[...Array(5)].map((_, i) => (
                  <svg key={i} width="16" height="16" viewBox="0 0 24 24" fill="#fbbf24" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                ))}
              </div>
              <p className="testimonial-quote">
                "Hiring engineers used to take weeks of keyword filtering. With EdgeTalent's pgvector similarity search, we posted our technical description and instantly matched three engineers with the exact vector requirements. Highly recommended."
              </p>
              <div className="testimonial-user">
                <div className="testimonial-avatar emerald">DK</div>
                <div>
                  <div style={{ fontSize: "0.95rem", fontWeight: 700 }}>David Kross</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>VP of Engineering at CloudVent</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQs Accordion */}
        <section id="faqs" className="faq-section">
          <h2 className="faq-title">Frequently Asked Questions</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {faqs.map((faq, idx) => (
              <div key={idx} className="collapsible-details">
                <div
                  className="collapsible-summary"
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  id={`faq-summary-${idx}`}
                >
                  <span>{faq.q}</span>
                  <span style={{
                    transform: openFaq === idx ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 0.25s ease",
                    display: "inline-block",
                    fontSize: "1.2rem",
                    fontWeight: "bold"
                  }}>
                    ▾
                  </span>
                </div>
                {openFaq === idx && (
                  <div className="collapsible-content animate-fade-in" id={`faq-content-${idx}`}>
                    <p style={{ lineHeight: "1.6", color: "var(--text-secondary)" }}>
                      {faq.a}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Bottom CTA Banner */}
        <section className="bottom-cta">
          <div className="bottom-cta-bg"></div>
          <div className="bottom-cta-content">
            <h2 style={{ fontSize: "2.5rem", marginBottom: "1rem", fontWeight: 800 }}>
              Ready to Accelerate Your Career or Project Pipeline?
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "1.1rem", marginBottom: "2.5rem", maxWidth: "600px", margin: "0 auto 2.5rem auto" }}>
              Sign up today to test your skill profile against market demands or publish your projects for high-fidelity pgvector matching.
            </p>
            <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
              <button className="btn btn-primary" onClick={() => onNavigate("auth")} style={{ padding: "0.85rem 2rem" }} id="bottom-btn-talent">
                Get Started Now
              </button>
              <button className="btn btn-secondary" onClick={() => onNavigate("auth")} style={{ padding: "0.85rem 2rem" }} id="bottom-btn-partner">
                Contact Enterprise Sales
              </button>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer style={{ color: "var(--text-muted)", fontSize: "0.85rem", borderTop: "1px solid var(--glass-border)", paddingTop: "2.5rem", textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "center", gap: "1.5rem", marginBottom: "1.5rem" }}>
            <a href="#features" style={{ color: "var(--text-muted)" }}>Features</a>
            <a href="#pillars" style={{ color: "var(--text-muted)" }}>Pillars</a>
            <a href="#stats" style={{ color: "var(--text-muted)" }}>Metrics</a>
            <a href="#faqs" style={{ color: "var(--text-muted)" }}>FAQs</a>
          </div>
          <p style={{ marginBottom: "0.5rem" }}>
            © {new Date().getFullYear()} EdgeTalent Ecosystem. All rights reserved.
          </p>
          <p style={{ fontSize: "0.75rem", opacity: 0.8 }}>
            Built using React, Vite, Supabase Postgres Database (pgvector), and Deno Edge Functions with OpenRouter models.
          </p>
        </footer>

      </div>
    </div>
  );
}
