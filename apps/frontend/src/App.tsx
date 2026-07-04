import React, { useState, useEffect } from "react";
import { useSupabase } from "./context/SupabaseContext";
import LandingPage from "./pages/LandingPage";
import AuthPage from "./pages/AuthPage";
import RoleOnboarding from "./pages/RoleOnboarding";
import TalentDashboard from "./pages/TalentDashboard";
import PartnerDashboard from "./pages/PartnerDashboard";

export default function App(): React.ReactElement {
  const { session, profile, loading } = useSupabase();
  const [currentPath, setCurrentPath] = useState<string>(window.location.hash || "#/");

  // Sync state with browser hash changes
  useEffect(() => {
    const handleHashChange = () => {
      setCurrentPath(window.location.hash || "#/");
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const navigateTo = (path: string): void => {
    window.location.hash = path.startsWith("#") ? path : `#/${path}`;
  };

  // 1. Loading Screen
  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", flexDirection: "column", gap: "1rem" }}>
        <div style={{
          width: "48px",
          height: "48px",
          border: "4px solid var(--glass-border)",
          borderTopColor: "var(--color-cyan)",
          borderRadius: "50%",
          animation: "spin 1s linear infinite"
        }} />
        <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>Initializing EdgeTalent...</p>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // 2. Unauthenticated Routes
  if (!session) {
    if (currentPath === "#/auth") {
      return <AuthPage onBack={() => navigateTo("/")} />;
    }
    return <LandingPage onNavigate={navigateTo} />;
  }

  // 3. Authenticated Routes - Role Onboarding Required
  if (!profile || !profile.role) {
    return <RoleOnboarding />;
  }

  // 4. Authenticated Routes - Dynamic Dashboard
  if (profile.role === "talent") {
    return <TalentDashboard />;
  }

  if (profile.role === "partner") {
    return <PartnerDashboard />;
  }

  // Fallback / Admin
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", flexDirection: "column", gap: "1.5rem" }}>
      <div className="glass-panel" style={{ padding: "3rem", textAlign: "center", maxWidth: "450px" }}>
        <h3 style={{ color: "var(--color-rose)", marginBottom: "1rem" }}>Access Restricted</h3>
        <p style={{ color: "var(--text-secondary)", marginBottom: "2rem" }}>
          Your profile role is set to "{profile.role}". Standard dashboards are only available for Talent and Partner roles.
        </p>
        <button className="btn btn-secondary" onClick={() => navigateTo("/")}>
          Return Home
        </button>
      </div>
    </div>
  );
}
