import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useSupabase } from "../../context/SupabaseContext";
import {
  Sparkles,
  Briefcase,
  GraduationCap,
  Award,
  TrendingUp,
  CheckCircle2,
  ArrowRight,
  ChevronRight,
  Zap,
  Target,
  Building2,
  ExternalLink
} from "lucide-react";

export default function TalentOverview(): React.ReactElement {
  const { supabase, profile } = useSupabase();
  const navigate = useNavigate();

  const [applications, setApplications] = useState<any[]>([]);
  const [recommendedProjects, setRecommendedProjects] = useState<any[]>([]);
  const [recommendedCourses, setRecommendedCourses] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Status Filter state for applications
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const profileId = profile?.id;
  const userSkills = profile?.skills || [];
  const userGaps = profile?.skill_gaps || [];

  // Calculate career readiness score dynamically
  const readinessScore = useMemo(() => {
    let score = 30; // base score for registering
    if (profile?.full_name) score += 10;
    if (profile?.bio) score += 10;
    if (userSkills.length > 0) score += Math.min(25, userSkills.length * 5);
    if (certificates.length > 0) score += Math.min(15, certificates.length * 5);
    if (applications.length > 0) score += 10;
    return Math.min(100, score);
  }, [profile, userSkills, certificates, applications]);

  const loadOverviewData = useCallback(async () => {
    if (!profileId) return;
    setLoading(true);
    try {
      // 1. Fetch user applications
      const { data: appData } = await supabase
        .from("applications")
        .select("*, projects(*, profiles(full_name, email))")
        .eq("talent_id", profileId)
        .order("applied_at", { ascending: false });

      if (appData) setApplications(appData);

      // 2. Fetch recommended projects
      if (profile?.skills_embedding) {
        const { data: matched } = await supabase.rpc("match_projects_for_talent", {
          p_talent_id: profileId,
          p_match_limit: 3
        });
        if (matched && matched.length > 0) {
          setRecommendedProjects(matched);
        } else {
          // Fallback to top projects
          const { data: rawProjs } = await supabase.from("projects").select("*").limit(3);
          if (rawProjs) setRecommendedProjects(rawProjs);
        }
      } else {
        const { data: rawProjs } = await supabase.from("projects").select("*").limit(3);
        if (rawProjs) setRecommendedProjects(rawProjs);
      }

      // 3. Fetch courses targeting skill gaps or top courses
      const { data: courseData } = await supabase.from("courses").select("*").limit(3);
      if (courseData) setRecommendedCourses(courseData);

      // 4. Fetch digital certificates / enrollments
      const { data: certData } = await supabase
        .from("course_enrollments")
        .select("*, courses(*)")
        .eq("user_id", profileId);
      if (certData) setCertificates(certData);
    } catch (e) {
      console.error("Error loading talent overview:", e);
    } finally {
      setLoading(false);
    }
  }, [profileId, profile?.skills_embedding, supabase]);

  useEffect(() => {
    loadOverviewData();
  }, [loadOverviewData]);

  // Filter applications by tab
  const filteredApplications = useMemo(() => {
    if (statusFilter === "all") return applications;
    return applications.filter((app) => app.status === statusFilter);
  }, [applications, statusFilter]);

  // Status counters
  const statusCounts = useMemo(() => {
    const counts = { all: applications.length, shortlisted: 0, accepted: 0, applied: 0, reviewing: 0 };
    applications.forEach((app) => {
      if (app.status === "shortlisted") counts.shortlisted++;
      else if (app.status === "accepted") counts.accepted++;
      else if (app.status === "applied") counts.applied++;
      else if (app.status === "reviewing") counts.reviewing++;
    });
    return counts;
  }, [applications]);

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      
      {/* Dynamic Header & AI Readiness Banner */}
      <div 
        className="glass-panel" 
        style={{ 
          padding: "2.25rem", 
          borderRadius: "var(--radius-lg)",
          background: "linear-gradient(135deg, rgba(79, 70, 229, 0.08) 0%, rgba(37, 99, 235, 0.05) 50%, rgba(16, 185, 129, 0.04) 100%)",
          border: "1px solid rgba(79, 70, 229, 0.15)",
          position: "relative",
          overflow: "hidden"
        }}
      >
        <div style={{ position: "relative", zIndex: 1, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1.5rem" }}>
          <div style={{ maxWidth: "600px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
              <span className="badge badge-purple" style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
                <Sparkles size={12} /> EdgeTalent Talent Portal
              </span>
              <span className="badge badge-emerald" style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
                <Zap size={12} /> AI Vector Matching Active
              </span>
            </div>
            <h2 style={{ fontSize: "2rem", fontWeight: "700", letterSpacing: "-0.03em", marginBottom: "0.5rem" }}>
              Welcome back, <span style={{ color: "var(--color-purple)" }}>{profile?.full_name || "Talent Member"}</span> 👋
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", lineHeight: "1.5", margin: 0 }}>
              Track your career readiness, view AI-matched project scopes, bridge critical skill gaps, and manage active client applications.
            </p>

            <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.25rem", flexWrap: "wrap" }}>
              <button 
                className="btn btn-primary" 
                onClick={() => navigate("/talent/analyzer")}
                style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}
              >
                <Sparkles size={16} /> Analyze Skills & Gap
              </button>
              <button 
                className="btn btn-secondary" 
                onClick={() => navigate("/talent/marketplace")}
                style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}
              >
                <Briefcase size={16} /> Find Job Matches
              </button>
            </div>
          </div>

          {/* AI Career Readiness Card */}
          <div 
            style={{ 
              background: "var(--bg-secondary)", 
              padding: "1.5rem", 
              borderRadius: "var(--radius-md)", 
              border: "1px solid var(--glass-border)",
              boxShadow: "var(--shadow-card)",
              minWidth: "260px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center"
            }}
          >
            <span style={{ fontSize: "0.8rem", textTransform: "uppercase", fontWeight: "600", color: "var(--text-muted)", letterSpacing: "0.05em", marginBottom: "0.75rem" }}>
              AI Career Readiness
            </span>
            <div style={{ position: "relative", width: "90px", height: "90px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="90" height="90" viewBox="0 0 36 36" style={{ transform: "rotate(-90deg)" }}>
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#e4e4e7"
                  strokeWidth="3.5"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="var(--color-purple)"
                  strokeWidth="3.5"
                  strokeDasharray={`${readinessScore}, 100`}
                  strokeLinecap="round"
                  style={{ transition: "stroke-dasharray 1s ease" }}
                />
              </svg>
              <div style={{ position: "absolute", display: "flex", flexDirection: "column", alignItems: "center" }}>
                <span style={{ fontSize: "1.3rem", fontWeight: "800", color: "var(--text-primary)", lineHeight: 1 }}>
                  {readinessScore}%
                </span>
                <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", fontWeight: "500", marginTop: "2px" }}>
                  Match Score
                </span>
              </div>
            </div>
            <div style={{ marginTop: "0.75rem", fontSize: "0.8rem", color: readinessScore >= 80 ? "var(--color-emerald)" : "var(--color-amber)", fontWeight: "600", display: "flex", alignItems: "center", gap: "0.35rem" }}>
              <TrendingUp size={14} />
              {readinessScore >= 80 ? "High Market Alignment" : "Skill Bridge Recommended"}
            </div>
          </div>
        </div>
      </div>

      {/* 4 Core Stat Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: "1.25rem" }}>
        
        {/* Card 1: Verified Skills */}
        <div className="glass-panel" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
              <span style={{ color: "var(--text-secondary)", fontSize: "0.8rem", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                Verified Skills
              </span>
              <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "rgba(16, 185, 129, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-emerald)" }}>
                <CheckCircle2 size={18} />
              </div>
            </div>
            <div style={{ fontSize: "2rem", fontWeight: "800", color: "var(--text-primary)" }}>
              {userSkills.length} <span style={{ fontSize: "0.9rem", color: "var(--color-emerald)", fontWeight: "600" }}>Verified</span>
            </div>
          </div>
          <div style={{ marginTop: "1rem", display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
            {userSkills.length > 0 ? (
              userSkills.slice(0, 3).map((sk: string, idx: number) => (
                <span key={idx} className="badge badge-emerald" style={{ fontSize: "0.7rem" }}>
                  {sk}
                </span>
              ))
            ) : (
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>No skills listed yet</span>
            )}
            {userSkills.length > 3 && (
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", alignSelf: "center" }}>
                +{userSkills.length - 3} more
              </span>
            )}
          </div>
        </div>

        {/* Card 2: Skill Gaps */}
        <div className="glass-panel" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
              <span style={{ color: "var(--text-secondary)", fontSize: "0.8rem", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                Skill Gaps
              </span>
              <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "rgba(239, 68, 68, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-rose)" }}>
                <Target size={18} />
              </div>
            </div>
            <div style={{ fontSize: "2rem", fontWeight: "800", color: "var(--text-primary)" }}>
              {userGaps.length} <span style={{ fontSize: "0.9rem", color: "var(--color-rose)", fontWeight: "600" }}>Identified</span>
            </div>
          </div>
          <div style={{ marginTop: "1rem" }}>
            {userGaps.length > 0 ? (
              <button 
                onClick={() => navigate("/talent/upskilling")}
                style={{ background: "transparent", border: "none", color: "var(--color-purple)", fontSize: "0.825rem", fontWeight: "600", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "0.25rem", padding: 0 }}
              >
                Upskill to close gaps <ArrowRight size={14} />
              </button>
            ) : (
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Run AI analyzer to check gaps</span>
            )}
          </div>
        </div>

        {/* Card 3: Active Applications */}
        <div className="glass-panel" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
              <span style={{ color: "var(--text-secondary)", fontSize: "0.8rem", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                Active Applications
              </span>
              <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "rgba(79, 70, 229, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-purple)" }}>
                <Briefcase size={18} />
              </div>
            </div>
            <div style={{ fontSize: "2rem", fontWeight: "800", color: "var(--text-primary)" }}>
              {applications.length} <span style={{ fontSize: "0.9rem", color: "var(--color-purple)", fontWeight: "600" }}>Submitted</span>
            </div>
          </div>
          <div style={{ marginTop: "1rem", display: "flex", gap: "0.5rem" }}>
            <span className="badge badge-emerald" style={{ fontSize: "0.65rem" }}>{statusCounts.accepted} Accepted</span>
            <span className="badge badge-amber" style={{ fontSize: "0.65rem" }}>{statusCounts.shortlisted} Shortlisted</span>
          </div>
        </div>

        {/* Card 4: Credentials & Certs */}
        <div className="glass-panel" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
              <span style={{ color: "var(--text-secondary)", fontSize: "0.8rem", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                Digital Credentials
              </span>
              <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "rgba(37, 99, 235, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-cyan)" }}>
                <Award size={18} />
              </div>
            </div>
            <div style={{ fontSize: "2rem", fontWeight: "800", color: "var(--text-primary)" }}>
              {certificates.length} <span style={{ fontSize: "0.9rem", color: "var(--color-cyan)", fontWeight: "600" }}>Certificates</span>
            </div>
          </div>
          <div style={{ marginTop: "1rem" }}>
            <button 
              onClick={() => navigate("/talent/certificates")}
              style={{ background: "transparent", border: "none", color: "var(--color-cyan)", fontSize: "0.825rem", fontWeight: "600", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "0.25rem", padding: 0 }}
            >
              View Verified Badges <ChevronRight size={14} />
            </button>
          </div>
        </div>

      </div>

      {/* Main 2-Column Section: Recommended Jobs & Upskilling */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem" }}>
        
        {/* Left Column: Top AI Job Matches */}
        <div className="glass-panel" style={{ padding: "1.75rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h3 style={{ fontSize: "1.2rem", fontWeight: "700", margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Sparkles size={18} style={{ color: "var(--color-purple)" }} /> Top AI Job Matches
              </h3>
              <p style={{ fontSize: "0.825rem", color: "var(--text-secondary)", margin: "0.25rem 0 0 0" }}>
                Projects selected by vector similarity to your profile
              </p>
            </div>
            <button 
              className="btn btn-secondary" 
              onClick={() => navigate("/talent/marketplace")}
              style={{ padding: "0.4rem 0.75rem", fontSize: "0.8rem" }}
            >
              View All
            </button>
          </div>

          {loading ? (
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Loading job matches...</p>
          ) : recommendedProjects.length === 0 ? (
            <div style={{ textAlign: "center", padding: "2rem 0", color: "var(--text-secondary)" }}>
              <p style={{ fontSize: "0.9rem", margin: "0 0 1rem 0" }}>No projects posted yet.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {recommendedProjects.map((proj) => (
                <div 
                  key={proj.id || proj.project_id}
                  style={{
                    padding: "1.25rem",
                    border: "1px solid var(--glass-border)",
                    borderRadius: "var(--radius-md)",
                    background: "var(--bg-primary)",
                    transition: "all 0.2s ease"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
                    <div>
                      <h4 style={{ fontSize: "1rem", fontWeight: "600", margin: "0 0 0.25rem 0" }}>
                        {proj.title}
                      </h4>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                          <Building2 size={13} /> {proj.profiles?.full_name || "Enterprise Partner"}
                        </span>
                        <span>•</span>
                        <span><b>${proj.budget || "Negotiable"}</b></span>
                      </div>
                    </div>
                    {proj.similarity ? (
                      <span className="badge badge-cyan" style={{ fontWeight: "700" }}>
                        {Math.round(proj.similarity * 100)}% Match
                      </span>
                    ) : (
                      <span className="badge badge-purple" style={{ fontSize: "0.7rem" }}>
                        {proj.scope || "Project"}
                      </span>
                    )}
                  </div>

                  <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "0.75rem", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {proj.description}
                  </p>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1rem" }}>
                    <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
                      {(proj.required_skills || []).slice(0, 3).map((sk: string, i: number) => (
                        <span key={i} className="badge badge-purple" style={{ fontSize: "0.65rem", padding: "0.15rem 0.4rem" }}>
                          {sk}
                        </span>
                      ))}
                    </div>
                    <button 
                      className="btn btn-primary" 
                      onClick={() => navigate("/talent/marketplace")}
                      style={{ padding: "0.35rem 0.85rem", fontSize: "0.8rem" }}
                    >
                      Apply Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Targeted Upskilling */}
        <div className="glass-panel" style={{ padding: "1.75rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h3 style={{ fontSize: "1.2rem", fontWeight: "700", margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <GraduationCap size={18} style={{ color: "var(--color-cyan)" }} /> Targeted Upskilling
              </h3>
              <p style={{ fontSize: "0.825rem", color: "var(--text-secondary)", margin: "0.25rem 0 0 0" }}>
                Courses tailored to bridge your skill gaps
              </p>
            </div>
            <button 
              className="btn btn-secondary" 
              onClick={() => navigate("/talent/upskilling")}
              style={{ padding: "0.4rem 0.75rem", fontSize: "0.8rem" }}
            >
              Browse All
            </button>
          </div>

          {loading ? (
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Loading courses...</p>
          ) : recommendedCourses.length === 0 ? (
            <div style={{ textAlign: "center", padding: "2rem 0", color: "var(--text-secondary)" }}>
              <p style={{ fontSize: "0.9rem" }}>No courses available currently.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {recommendedCourses.map((crs) => (
                <div 
                  key={crs.id}
                  style={{
                    padding: "1.25rem",
                    border: "1px solid var(--glass-border)",
                    borderRadius: "var(--radius-md)",
                    background: "var(--bg-primary)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.5rem"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <h4 style={{ fontSize: "0.975rem", fontWeight: "600", margin: 0 }}>
                      {crs.title}
                    </h4>
                    <span className="badge badge-emerald" style={{ fontSize: "0.65rem" }}>
                      {crs.provider || "EdgeTalent Academy"}
                    </span>
                  </div>

                  <p style={{ fontSize: "0.825rem", color: "var(--text-secondary)", margin: 0, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {crs.description}
                  </p>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.5rem" }}>
                    <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
                      {(crs.skills_taught || []).slice(0, 3).map((sk: string, i: number) => (
                        <span key={i} className="badge badge-cyan" style={{ fontSize: "0.65rem", padding: "0.15rem 0.4rem" }}>
                          +{sk}
                        </span>
                      ))}
                    </div>
                    <button 
                      className="btn btn-secondary"
                      onClick={() => navigate("/talent/upskilling")}
                      style={{ padding: "0.35rem 0.75rem", fontSize: "0.775rem", display: "inline-flex", alignItems: "center", gap: "0.25rem" }}
                    >
                      Enroll <ExternalLink size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Interactive Applications Tracker */}
      <div className="glass-panel" style={{ padding: "2rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", marginBottom: "1.5rem" }}>
          <div>
            <h3 style={{ fontSize: "1.3rem", fontWeight: "700", margin: 0 }}>My Application Pipeline</h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", margin: "0.25rem 0 0 0" }}>
              Track submission status and communication with enterprise partners
            </p>
          </div>

          {/* Status Filter Tabs */}
          <div style={{ display: "flex", gap: "0.35rem", background: "var(--bg-tertiary)", padding: "0.25rem", borderRadius: "var(--radius-sm)" }}>
            {[
              { id: "all", label: `All (${statusCounts.all})` },
              { id: "shortlisted", label: `Shortlisted (${statusCounts.shortlisted})` },
              { id: "accepted", label: `Accepted (${statusCounts.accepted})` },
              { id: "applied", label: `Pending (${statusCounts.applied})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                style={{
                  padding: "0.4rem 0.85rem",
                  fontSize: "0.8rem",
                  fontWeight: "600",
                  borderRadius: "var(--radius-sm)",
                  border: "none",
                  cursor: "pointer",
                  background: statusFilter === tab.id ? "var(--bg-secondary)" : "transparent",
                  color: statusFilter === tab.id ? "var(--text-primary)" : "var(--text-secondary)",
                  boxShadow: statusFilter === tab.id ? "var(--glow-purple)" : "none",
                  transition: "all 0.15s ease"
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <p style={{ color: "var(--text-secondary)" }}>Loading application pipeline...</p>
        ) : filteredApplications.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem 1rem", border: "1px dashed var(--glass-border)", borderRadius: "var(--radius-md)" }}>
            <Briefcase size={36} style={{ color: "var(--text-muted)", marginBottom: "0.75rem" }} />
            <h4 style={{ fontSize: "1.1rem", marginBottom: "0.25rem" }}>No applications in this category</h4>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginBottom: "1.25rem" }}>
              {statusFilter === "all" 
                ? "You haven't submitted any project applications yet." 
                : `No applications with status "${statusFilter}".`}
            </p>
            <button className="btn btn-primary" onClick={() => navigate("/talent/marketplace")}>
              Browse Open Positions
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {filteredApplications.map((app) => (
              <div 
                key={app.id} 
                style={{ 
                  display: "flex", 
                  justifyContent: "space-between", 
                  alignItems: "center", 
                  padding: "1.25rem",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--glass-border)",
                  background: "var(--bg-secondary)",
                  flexWrap: "wrap",
                  gap: "1rem"
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <h4 style={{ fontSize: "1.05rem", fontWeight: "600", margin: 0 }}>
                      {app.projects?.title || "Untitled Project"}
                    </h4>
                    {app.match_percentage && (
                      <span className="badge badge-cyan" style={{ fontSize: "0.75rem" }}>
                        {app.match_percentage}% Match
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginTop: "0.35rem", fontSize: "0.825rem", color: "var(--text-secondary)" }}>
                    <span>Partner: <b>{app.projects?.profiles?.full_name || "Enterprise Client"}</b></span>
                    <span>•</span>
                    <span>Applied on {new Date(app.applied_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <span className={`badge ${
                    app.status === "accepted" ? "badge-emerald" : 
                    app.status === "rejected" ? "badge-rose" : 
                    app.status === "shortlisted" ? "badge-amber" : "badge-purple"
                  }`} style={{ padding: "0.35rem 0.75rem", fontSize: "0.8rem", textTransform: "capitalize" }}>
                    {app.status}
                  </span>
                  <button 
                    className="btn btn-secondary" 
                    onClick={() => navigate("/talent/gigs")}
                    style={{ padding: "0.4rem 0.85rem", fontSize: "0.8rem" }}
                  >
                    Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
