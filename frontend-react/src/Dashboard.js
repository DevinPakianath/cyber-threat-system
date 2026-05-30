import React, { useEffect, useState, useCallback } from "react";
import { FiRefreshCw, FiAlertTriangle, FiMenu } from "react-icons/fi";

import API           from "./services/api";
import Sidebar       from "./components/Sidebar";
import LiveIndicator from "./components/LiveIndicator";

import OverviewView  from "./views/OverviewView";
import ThreatsView   from "./views/ThreatsView";
import LiveFeedView  from "./views/LiveFeedView";
import SettingsView  from "./views/SettingsView";

import "./styles/Dashboard.css";

const VIEW_META = {
  overview: { title: "Overview",        subtitle: "Real-time login threat intelligence" },
  threats:  { title: "Threat Analysis", subtitle: "Suspicious and dangerous login activity" },
  livefeed: { title: "Live Feed",       subtitle: "Real-time login activity stream" },
  settings: { title: "Settings",        subtitle: "Account and security preferences" },
};

function Dashboard({ setIsLoggedIn }) {
  const [logs,          setLogs]         = useState([]);
  const [error,         setError]        = useState("");
  const [loading,       setLoading]      = useState(false);
  const [lastUpdated,   setLastUpdated]  = useState(null);
  const [collapsed,     setCollapsed]    = useState(false);
  const [activeView,    setActiveView]   = useState("overview");
  const [mobileOpen,    setMobileOpen]   = useState(false);

  const username   = localStorage.getItem("username") || "User";
  const meta       = VIEW_META[activeView];
  const showRefresh = activeView === "overview" || activeView === "threats";

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("email");
    setIsLoggedIn(false);
  }, [setIsLoggedIn]);

  const fetchLogs = useCallback(async () => {
    setError("");
    setLoading(true);
    try {
      const res = await API.get("/logs?limit=200");
      setLogs(res.data.logs ?? res.data);
      setLastUpdated(Date.now());
    } catch (err) {
      if (err.response?.status === 401) logout();
      else setError("Failed to load logs. Please try refreshing.");
    } finally {
      setLoading(false);
    }
  }, [logout]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const navigate = (view) => {
    setActiveView(view);
    setMobileOpen(false); // close mobile menu on navigation
  };

  const dangerous = logs.filter(l => l.riskStatus === "Dangerous").length;

  return (
    <div className={`app-layout${collapsed ? " sidebar-collapsed" : ""}${mobileOpen ? " mobile-sidebar-open" : ""}`}>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />
      )}

      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed(c => !c)}
        onNavigate={navigate}
        activeView={activeView}
        onLogout={logout}
        dangerousCount={dangerous}
      />

      <div className="main-content">

        {/* ── TOPBAR ─────────────────────────── */}
        <header className="topbar">

          {/* Mobile hamburger */}
          <button
            className="hamburger-btn"
            onClick={() => setMobileOpen(o => !o)}
            aria-label="Open menu"
          >
            <FiMenu />
          </button>

          <div className="topbar-title">
            <h1>{meta.title}</h1>
            <p>{meta.subtitle}</p>
          </div>

          <div className="topbar-actions">
            {showRefresh && <LiveIndicator lastUpdated={lastUpdated} />}

            {showRefresh && (
              <button
                className={`icon-btn${loading ? " spinning" : ""}`}
                onClick={fetchLogs}
                disabled={loading}
                aria-label="Refresh data"
              >
                <FiRefreshCw />
                <span className="btn-label">{loading ? "Loading…" : "Refresh"}</span>
              </button>
            )}

            {error && (
              <span className="topbar-error" title={error}>
                <FiAlertTriangle />
              </span>
            )}

            <div className="user-chip">
              <div className="user-avatar">{username.slice(0, 2).toUpperCase()}</div>
              <span className="btn-label">{username}</span>
            </div>
          </div>

        </header>

        {/* ── VIEW CONTENT ───────────────────── */}
        <div className="content-area">
          {activeView === "overview" && <OverviewView logs={logs} error={error} />}
          {activeView === "threats"  && <ThreatsView  logs={logs} />}
          {activeView === "livefeed" && <LiveFeedView />}
          {activeView === "settings" && <SettingsView onLogout={logout} />}
        </div>

      </div>
    </div>
  );
}

export default Dashboard;
