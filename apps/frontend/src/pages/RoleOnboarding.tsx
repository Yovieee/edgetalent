import React, { useState } from "react";
import { useSupabase } from "../context/SupabaseContext";
import { User, Briefcase } from "lucide-react";

export default function RoleOnboarding(): React.ReactElement {
  const { supabase, profile, fetchProfile } = useSupabase();
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");

  const handleRoleSelection = async (selectedRole: "talent" | "partner") => {
    if (!profile) return;
    setLoading(true);
    setErrorMsg("");

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ role: selectedRole })
        .eq("id", profile.id);

      if (error) throw error;

      // Refresh context profile details
      await fetchProfile(profile.id);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to update role profile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh", padding: "2rem" }}>
      <div style={{ maxWidth: "800px", width: "100%", textAlign: "center" }}>
        <h2 style={{ fontSize: "2rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.75rem" }}>
          Select Your Persona
        </h2>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", marginBottom: "2.5rem" }}>
          Choose how you will engage with the EdgeTalent ecosystem. This determines your dashboard interface.
        </p>

        {errorMsg && (
          <div className="badge badge-rose" style={{ display: "inline-block", padding: "0.6rem 1.25rem", borderRadius: "var(--radius-sm)", marginBottom: "2rem" }}>
            {errorMsg}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "2rem" }}>
          {/* Option 1: Talent */}
          <div 
            className="glass-panel" 
            style={{ padding: "2.5rem 2rem", cursor: "pointer", transition: "all 0.25s ease", position: "relative", overflow: "hidden", textAlign: "left" }}
            onClick={() => !loading && handleRoleSelection("talent")}
          >
            <div style={{ position: "absolute", top: "0", left: "0", width: "100%", height: "2px", background: "var(--color-emerald)" }} />
            
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "#ecfdf5", display: "flex", alignItems: "center", justifyBox: "center", justifyContent: "center", color: "var(--color-emerald)", border: "1px solid #d1fae5" }}>
                <User size={18} />
              </div>
              <span className="badge badge-emerald">Individual Growth</span>
            </div>

            <h3 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "0.75rem" }}>I am a Talent</h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", lineHeight: "1.5", marginBottom: "2rem" }}>
              Looking to level up my tech skills, analyze my coding gaps, explore learning paths, and match into commercial industrial projects.
            </p>
            <button className="btn btn-success" style={{ width: "100%" }} disabled={loading}>
              Select Talent Profile
            </button>
          </div>

          {/* Option 2: Partner */}
          <div 
            className="glass-panel" 
            style={{ padding: "2.5rem 2rem", cursor: "pointer", transition: "all 0.25s ease", position: "relative", overflow: "hidden", textAlign: "left" }}
            onClick={() => !loading && handleRoleSelection("partner")}
          >
            <div style={{ position: "absolute", top: "0", left: "0", width: "100%", height: "2px", background: "var(--color-cyan)" }} />
            
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "#eff6ff", display: "flex", alignItems: "center", justifyBox: "center", justifyContent: "center", color: "var(--color-cyan)", border: "1px solid #dbeafe" }}>
                <Briefcase size={18} />
              </div>
              <span className="badge badge-cyan">Enterprise Execution</span>
            </div>

            <h3 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "0.75rem" }}>I am a Partner / Company</h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", lineHeight: "1.5", marginBottom: "2rem" }}>
              Looking to outsource industrial project deliverables, post job descriptions, and leverage AI vector similarity to source elite talent.
            </p>
            <button className="btn btn-primary" style={{ width: "100%" }} disabled={loading}>
              Select Partner Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
