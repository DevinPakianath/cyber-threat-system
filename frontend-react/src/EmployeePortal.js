import React, { useCallback } from "react";
import { FiShield, FiLogOut, FiUserCheck } from "react-icons/fi";
import SettingsView from "./views/SettingsView";
import "./styles/Dashboard.css";

function EmployeePortal({ setIsLoggedIn }) {
  const username = localStorage.getItem("username") || "Employee";

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("email");
    localStorage.removeItem("role");
    setIsLoggedIn(false);
  }, [setIsLoggedIn]);

  return (
    <div className="app-layout" style={{ minHeight: "100vh", backgroundColor: "var(--bg-base, #020817)" }}>
      <div className="main-content" style={{ marginLeft: 0, width: "100%", maxWidth: "1200px", margin: "0 auto", padding: "24px" }}>
        
        {/* ── TOPBAR ─────────────────────────── */}
        <header className="topbar" style={{ borderRadius: "14px", marginBottom: "24px" }}>
          <div className="topbar-title" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{
              width: "40px",
              height: "40px",
              borderRadius: "10px",
              backgroundColor: "rgba(0, 255, 213, 0.1)",
              border: "1px solid rgba(0, 255, 213, 0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--accent-primary, #00ffd5)"
            }}>
              <FiShield size={22} />
            </div>
            <div>
              <h1 style={{ fontSize: "20px", fontWeight: "800", color: "#f8fafc" }}>CTI Guard</h1>
              <p style={{ fontSize: "12px", color: "#94a3b8" }}>Employee Account Portal</p>
            </div>
          </div>

          <div className="topbar-actions">
            <div className="user-chip" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div className="user-avatar">{username.slice(0, 2).toUpperCase()}</div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span className="btn-label" style={{ fontWeight: "700" }}>{username}</span>
                <span style={{ fontSize: "10px", color: "var(--accent-primary, #00ffd5)", fontWeight: "800", letterSpacing: "1px" }}>
                  EMPLOYEE
                </span>
              </div>
            </div>

            <button
              className="icon-btn"
              onClick={logout}
              title="Sign Out"
              aria-label="Sign out"
              style={{ display: "flex", alignItems: "center", gap: "6px", color: "#ef4444" }}
            >
              <FiLogOut />
              <span className="btn-label">Sign Out</span>
            </button>
          </div>
        </header>

        {/* ── EMPLOYEE NOTICE BANNER ─────────── */}
        <div style={{
          backgroundColor: "rgba(16, 185, 129, 0.08)",
          border: "1px solid rgba(16, 185, 129, 0.2)",
          borderRadius: "12px",
          padding: "16px 20px",
          marginBottom: "24px",
          display: "flex",
          alignItems: "center",
          gap: "14px"
        }}>
          <FiUserCheck size={24} style={{ color: "#10b981", flexShrink: 0 }} />
          <div>
            <p style={{ margin: 0, fontSize: "14px", fontWeight: "700", color: "#f8fafc" }}>
              Authenticated Employee Account
            </p>
            <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#94a3b8" }}>
              Your account security is actively monitored by CTI Guard. You can update your credentials and view your security profile below.
            </p>
          </div>
        </div>

        {/* ── SETTINGS / PROFILE CONTENT ─────── */}
        <div className="content-area">
          <SettingsView onLogout={logout} />
        </div>

      </div>
    </div>
  );
}

export default EmployeePortal;
