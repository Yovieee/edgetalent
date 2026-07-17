import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useSupabase } from "../context/SupabaseContext";

export default function ProtectedRoute(): React.ReactElement {
  const { session, profile, loading } = useSupabase();
  const location = useLocation();

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

  if (!session) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // If role onboarding is required
  const needsOnboarding = !profile || !profile.role;
  
  if (needsOnboarding && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }

  if (!needsOnboarding && location.pathname === "/onboarding") {
    // If they already have a role, redirect to root
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
