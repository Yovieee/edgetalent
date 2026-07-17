import React, { useState, useEffect } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useSupabase } from "../../context/SupabaseContext";
import { 
  LayoutDashboard, Activity, GraduationCap, Briefcase, CheckSquare, 
  Award, DollarSign, Calendar, User, LogOut, Menu, X 
} from "lucide-react";
import logo from "../../assets/logo.png";

export default function PartnerLayout(): React.ReactElement {
  const { profile, signOut } = useSupabase();
  const navigate = useNavigate();
  const location = useLocation();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState<boolean>(false);

  const toggleSidebar = () => {
    if (window.innerWidth <= 768) {
      setIsMobileOpen(!isMobileOpen);
    } else {
      setIsSidebarCollapsed(!isSidebarCollapsed);
    }
  };

  useEffect(() => {
    setIsMobileOpen(false);
    setIsProfileMenuOpen(false);
  }, [location.pathname]);

  const menuItems = [
    { to: "/partner/dashboard", label: "Dashboard", icon: <LayoutDashboard size={20} /> },
    { to: "/partner/projects", label: "Manage Projects", icon: <Briefcase size={20} /> },
    { to: "/partner/hiring", label: "Hiring Desk", icon: <CheckSquare size={20} /> },
    { to: "/partner/academy", label: "Academy", icon: <GraduationCap size={20} /> },
    { to: "/partner/funding", label: "Funding Opportunities", icon: <DollarSign size={20} /> },
    { to: "/partner/events", label: "Events Hub", icon: <Calendar size={20} /> }
  ];

  const getHeaderTitle = () => {
    const path = location.pathname;
    if (path.includes("dashboard")) return "Dashboard";
    if (path.includes("projects")) return "Manage Projects";
    if (path.includes("hiring")) return "Hiring Desk";
    if (path.includes("academy")) return "Entrepreneur Academy";
    if (path.includes("funding")) return "Funding Opportunities";
    if (path.includes("events")) return "Events Hub";
    if (path.includes("profile")) return "My Profile";
    return "Partner Dashboard";
  };

  return (
    <div className="dashboard-layout">
      {/* Backdrop for mobile drawer */}
      <div className={`sidebar-overlay ${isMobileOpen ? "active" : ""}`} onClick={() => setIsMobileOpen(false)} />

      {/* Sidebar Navigation */}
      <aside className={`sidebar ${isSidebarCollapsed ? "collapsed" : ""} ${isMobileOpen ? "open" : ""}`}>
        <div className="sidebar-brand">
          <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <img src={logo} alt="EdgeTalent Logo" style={{ width: "24px", height: "24px", objectFit: "contain" }} />
            <span className="sidebar-brand-text">EdgeTalent</span>
          </span>
          {isMobileOpen && (
            <button className="hamburger-btn" onClick={() => setIsMobileOpen(false)} style={{ padding: "0.25rem" }}>
              <X size={20} />
            </button>
          )}
        </div>

        <div className="sidebar-menu">
          {menuItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `sidebar-menu-btn ${isActive ? "active" : ""}`}
              title={item.label}
            >
              {item.icon}
              <span className="sidebar-menu-label">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="dashboard-main">
        <header className="dashboard-header">
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <button className="hamburger-btn" onClick={toggleSidebar}>
              <Menu size={20} />
            </button>
            <h2 className="dashboard-header-title">
              {getHeaderTitle()}
            </h2>
          </div>

          <div style={{ position: "relative" }}>
            <div 
              className="user-profile-menu"
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            >
              <div style={{ textAlign: "right" }} className="header-user-info">
                <div style={{ fontSize: "0.85rem", fontWeight: "600" }}>{profile?.full_name || "Enterprise Partner"}</div>
                <span className="badge badge-purple" style={{ fontSize: "0.6rem", padding: "0.1rem 0.4rem" }}>Partner</span>
              </div>
              <div className="avatar-badge" style={{ width: "32px", height: "32px", fontSize: "0.85rem", margin: 0 }}>
                {(profile?.full_name || "P")[0].toUpperCase()}
              </div>
            </div>

            {isProfileMenuOpen && (
              <>
                <div 
                  style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 999,
                    background: "transparent"
                  }}
                  onClick={() => setIsProfileMenuOpen(false)}
                />
                <div className="user-profile-popover">
                  <button 
                    className="user-profile-popover-item"
                    onClick={() => {
                      navigate("/partner/profile");
                      setIsProfileMenuOpen(false);
                    }}
                  >
                    <User size={16} />
                    <span>Profile Settings</span>
                  </button>
                  <button 
                    className="user-profile-popover-item danger"
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      signOut().then(() => navigate("/"));
                    }}
                  >
                    <LogOut size={16} />
                    <span>Sign Out</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </header>

        <main className="dashboard-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
