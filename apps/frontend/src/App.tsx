import React from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useSupabase } from "./context/SupabaseContext";

import LandingPage from "./pages/LandingPage";
import AuthPage from "./pages/AuthPage";
import RoleOnboarding from "./pages/RoleOnboarding";
import CertificateVerificationPage from "./pages/CertificateVerificationPage";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleGuard from "./components/RoleGuard";

// Talent Pages
import TalentLayout from "./pages/talent/TalentLayout";
import TalentOverview from "./pages/talent/TalentOverview";
import TalentAnalyzer from "./pages/talent/TalentAnalyzer";
import TalentUpskilling from "./pages/talent/TalentUpskilling";
import TalentMarketplace from "./pages/talent/TalentMarketplace";
import TalentGigs from "./pages/talent/TalentGigs";
import TalentCertificates from "./pages/talent/TalentCertificates";
import TalentEvents from "./pages/talent/TalentEvents";
import TalentProfile from "./pages/talent/TalentProfile";

// Partner Pages
import PartnerLayout from "./pages/partner/PartnerLayout";
import PartnerDashboardView from "./pages/partner/PartnerDashboardView";
import PartnerProjects from "./pages/partner/PartnerProjects";
import PartnerHiring from "./pages/partner/PartnerHiring";
import PartnerAcademy from "./pages/partner/PartnerAcademy";
import PartnerFunding from "./pages/partner/PartnerFunding";
import PartnerEvents from "./pages/partner/PartnerEvents";
import PartnerProfile from "./pages/partner/PartnerProfile";

// Admin Pages
import AdminLayout from "./pages/admin/AdminLayout";
import AdminOverview from "./pages/admin/AdminOverview";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminCourses from "./pages/admin/AdminCourses";
import AdminProjects from "./pages/admin/AdminProjects";
import AdminQuizzes from "./pages/admin/AdminQuizzes";
import AdminFunding from "./pages/admin/AdminFunding";
import AdminEvents from "./pages/admin/AdminEvents";

function LoadingSpinner(): React.ReactElement {
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

export default function App(): React.ReactElement {
  const { session, profile, loading } = useSupabase();
  const navigate = useNavigate();

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Routes>
      {/* Public Pages */}
      <Route 
        path="/" 
        element={
          session && profile?.role ? (
            <Navigate to={`/${profile.role}`} replace />
          ) : (
            <LandingPage onNavigate={navigate} />
          )
        } 
      />
      <Route 
        path="/auth" 
        element={
          session && profile?.role ? (
            <Navigate to={`/${profile.role}`} replace />
          ) : (
            <AuthPage onBack={() => navigate("/")} />
          )
        } 
      />
      <Route path="/verify" element={<CertificateVerificationPage />} />
      <Route path="/verify/:credentialId" element={<CertificateVerificationPage />} />

      {/* Onboarding */}
      <Route 
        path="/onboarding" 
        element={
          !session ? (
            <Navigate to="/auth" replace />
          ) : profile?.role ? (
            <Navigate to={`/${profile.role}`} replace />
          ) : (
            <RoleOnboarding />
          )
        } 
      />

      {/* Talent Dashboard */}
      <Route element={<ProtectedRoute />}>
        <Route 
          path="/talent" 
          element={
            <RoleGuard allowedRoles={["talent"]}>
              <TalentLayout />
            </RoleGuard>
          }
        >
          <Route index element={<Navigate to="overview" replace />} />
          <Route path="overview" element={<TalentOverview />} />
          <Route path="analyzer" element={<TalentAnalyzer />} />
          <Route path="upskilling" element={<TalentUpskilling />} />
          <Route path="marketplace" element={<TalentMarketplace />} />
          <Route path="gigs" element={<TalentGigs />} />
          <Route path="certificates" element={<TalentCertificates />} />
          <Route path="events" element={<TalentEvents />} />
          <Route path="profile" element={<TalentProfile />} />
        </Route>
      </Route>

      {/* Partner Dashboard */}
      <Route element={<ProtectedRoute />}>
        <Route 
          path="/partner" 
          element={
            <RoleGuard allowedRoles={["partner"]}>
              <PartnerLayout />
            </RoleGuard>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<PartnerDashboardView />} />
          <Route path="projects" element={<PartnerProjects />} />
          <Route path="hiring" element={<PartnerHiring />} />
          <Route path="academy" element={<PartnerAcademy />} />
          <Route path="funding" element={<PartnerFunding />} />
          <Route path="events" element={<PartnerEvents />} />
          <Route path="profile" element={<PartnerProfile />} />
        </Route>
      </Route>

      {/* Admin Dashboard */}
      <Route element={<ProtectedRoute />}>
        <Route 
          path="/admin" 
          element={
            <RoleGuard allowedRoles={["admin"]}>
              <AdminLayout />
            </RoleGuard>
          }
        >
          <Route index element={<Navigate to="overview" replace />} />
          <Route path="overview" element={<AdminOverview />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="courses" element={<AdminCourses />} />
          <Route path="marketplace" element={<AdminProjects />} />
          <Route path="quizzes" element={<AdminQuizzes />} />
          <Route path="funding" element={<AdminFunding />} />
          <Route path="events" element={<AdminEvents />} />
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
