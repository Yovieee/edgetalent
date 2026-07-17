import React, { useState, useEffect } from "react";
import { useSupabase } from "../../context/SupabaseContext";
import { PortfolioLinksSchema } from "@edgetalent/shared";

export default function TalentProfile(): React.ReactElement {
  const { supabase, profile, fetchProfile } = useSupabase();

  const [fullName, setFullName] = useState<string>(profile?.full_name || "");
  const [bio, setBio] = useState<string>(profile?.bio || "");
  const [githubUrl, setGithubUrl] = useState<string>("");
  const [linkedinUrl, setLinkedinUrl] = useState<string>("");
  const [websiteUrl, setWebsiteUrl] = useState<string>("");
  
  const [savingProfile, setSavingProfile] = useState<boolean>(false);
  const [profileMsg, setProfileMsg] = useState<string>("");

  const profileId = profile?.id;

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setBio(profile.bio || "");
      const links = profile.portfolio_links || {};
      setGithubUrl(links.github || "");
      setLinkedinUrl(links.linkedin || "");
      setWebsiteUrl(links.website || "");
    }
  }, [profile]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileId) return;
    setSavingProfile(true);
    setProfileMsg("");

    try {
      const payloadLinks = {
        github: githubUrl.trim(),
        linkedin: linkedinUrl.trim(),
        website: websiteUrl.trim()
      };

      const validation = PortfolioLinksSchema.safeParse(payloadLinks);
      if (!validation.success) {
        throw new Error("Invalid URL format. Links must start with http:// or https://");
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName,
          bio,
          portfolio_links: validation.data,
          updated_at: new Date().toISOString()
        })
        .eq("id", profileId);

      if (error) throw error;
      setProfileMsg("Profile updated successfully!");
      await fetchProfile(profileId);
    } catch (err: any) {
      setProfileMsg("Error: " + err.message);
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <div className="animate-fade-in glass-panel" style={{ padding: "2rem", maxWidth: "600px", margin: "0 auto" }}>
      <h3>Profile Builder</h3>
      <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
        Manually update your name, biography, and web portfolio links.
      </p>

      {profileMsg && (
        <div className={`badge ${profileMsg.startsWith("Error") || profileMsg.startsWith("Invalid") ? "badge-rose" : "badge-emerald"}`} style={{ display: "block", padding: "0.8rem", textAlign: "center", marginBottom: "1.5rem" }}>
          {profileMsg}
        </div>
      )}

      <form onSubmit={handleSaveProfile}>
        <div className="form-group">
          <label>Full Name</label>
          <input type="text" className="form-input" placeholder="Your Name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        </div>

        <div className="form-group">
          <label>Biography Summary</label>
          <textarea className="form-input" style={{ height: "100px" }} placeholder="Tell us about yourself..." value={bio} onChange={(e) => setBio(e.target.value)} />
        </div>

        <div className="form-group">
          <label>GitHub Profile URL</label>
          <input type="url" className="form-input" placeholder="https://github.com/your-username" value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} />
        </div>

        <div className="form-group">
          <label>LinkedIn Profile URL</label>
          <input type="url" className="form-input" placeholder="https://linkedin.com/in/your-profile" value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} />
        </div>

        <div className="form-group">
          <label>Personal Website URL</label>
          <input type="url" className="form-input" placeholder="https://yourportfolio.com" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} />
        </div>

        <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: "1rem" }} disabled={savingProfile}>
          {savingProfile ? "Saving Details..." : "Update Profile"}
        </button>
      </form>
    </div>
  );
}
