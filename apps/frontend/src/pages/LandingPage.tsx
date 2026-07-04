import React from "react";

interface LandingPageProps {
  onNavigate: (path: string) => void;
}

export default function LandingPage({ onNavigate }: LandingPageProps): React.ReactElement {
  return (
    <div className="landing-container animate-fade-in" style={{ maxWidth: "1200px", margin: "0 auto", padding: "4rem 2rem", textAlign: "center" }}>
      <header style={{ marginBottom: "5rem" }}>
        <div style={{ display: "inline-flex", gap: "0.5rem", alignItems: "center", marginBottom: "1.5rem" }}>
          <span className="badge badge-cyan" style={{ fontSize: "0.9rem", padding: "0.5rem 1rem" }}>EdgeTalent Ecosystem</span>
        </div>
        <h1 style={{ fontSize: "3.5rem", lineHeight: "1.2", marginBottom: "1.5rem", background: "var(--grad-cyan-purple)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          Bridging Talent Development & Industrial Demand
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "1.25rem", maxWidth: "800px", margin: "0 auto 2.5rem auto", lineHeight: "1.6" }}>
          An end-to-end digital ecosystem designed to scale professional careers and streamline corporate project pipelines.
        </p>
        <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
          <button className="btn btn-primary" onClick={() => onNavigate("auth")}>
            Get Started
          </button>
          <a href="#pillars" className="btn btn-secondary">
            Explore Pillars
          </a>
        </div>
      </header>

      <section id="pillars" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "2.5rem", padding: "2rem 0", marginBottom: "6rem" }}>
        {/* Pillar 1: Upstream */}
        <div className="glass-panel" style={{ padding: "3rem 2rem", textAlign: "left", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: "0", left: "0", width: "100%", height: "4px", background: "var(--grad-emerald-cyan)" }} />
          <span className="badge badge-emerald" style={{ marginBottom: "1.5rem" }}>Pillar 1: Upstream</span>
          <h2 style={{ fontSize: "1.8rem", marginBottom: "1rem", color: "var(--text-primary)" }}>EdgeTalent Foundation</h2>
          <p style={{ color: "var(--text-secondary)", lineHeight: "1.6", marginBottom: "2rem" }}>
            Focused on upskilling, guided training paths, entrepreneurship incubation, and community growth. Get analyzed by AI to map out your skill-gaps and access personalized bootcamps.
          </p>
          <ul style={{ color: "var(--text-secondary)", paddingLeft: "1.2rem", marginBottom: "2rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <li>AI Skill-Gap Analyzer</li>
            <li>Customized Learning & Courses</li>
            <li>Entrepreneurship Incubation</li>
          </ul>
        </div>

        {/* Pillar 2: Downstream */}
        <div className="glass-panel" style={{ padding: "3rem 2rem", textAlign: "left", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: "0", left: "0", width: "100%", height: "4px", background: "var(--grad-cyan-purple)" }} />
          <span className="badge badge-cyan" style={{ marginBottom: "1.5rem" }}>Pillar 2: Downstream</span>
          <h2 style={{ fontSize: "1.8rem", marginBottom: "1rem", color: "var(--text-primary)" }}>EdgeTalent Group</h2>
          <p style={{ color: "var(--text-secondary)", lineHeight: "1.6", marginBottom: "2rem" }}>
            Targeted at industrial pipelines, commercial project management, and high-match job placement. We leverage AI vector similarity searching to pair top candidates with demanding enterprise scopes.
          </p>
          <ul style={{ color: "var(--text-secondary)", paddingLeft: "1.2rem", marginBottom: "2rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <li>Project Manager Portal</li>
            <li>Semantic pgvector Talent Matcher</li>
            <li>Real-time Milestones & Contracts</li>
          </ul>
        </div>
      </section>

      <footer style={{ color: "var(--text-muted)", fontSize: "0.9rem", borderTop: "1px solid var(--glass-border)", paddingTop: "2rem" }}>
        © {new Date().getFullYear()} EdgeTalent. All rights reserved. Built with Supabase & Deno Edge Functions.
      </footer>
    </div>
  );
}
