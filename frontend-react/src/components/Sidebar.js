import React from "react";
import {
  FiShield, FiHome, FiActivity, FiAlertTriangle,
  FiUsers, FiSettings, FiLogOut, FiMenu, FiX
} from "react-icons/fi";

function Sidebar({ collapsed, onToggle, onNavigate, activeView, onLogout, dangerousCount, userRole }) {
  const role = userRole || localStorage.getItem("role") || "employee";

  const navItems = [
    { id: "overview", icon: FiHome, label: "Overview" },
    { id: "threats", icon: FiAlertTriangle, label: "Threats" },
    { id: "livefeed", icon: FiActivity, label: "Live Feed" },
  ];

  if (role === "admin") {
    navItems.push({ id: "users", icon: FiUsers, label: "User Management" });
  } else if (role === "manager") {
    navItems.push({ id: "users", icon: FiUsers, label: "Team Members" });
  }

  navItems.push({ id: "settings", icon: FiSettings, label: "Settings" });

  return (
    <aside className="sidebar">

      <div className="sidebar-header">
        <div className="sidebar-brand">
          <FiShield className="brand-icon" />
          {!collapsed && <span className="brand-name">CTI Guard</span>}
        </div>
        <button
          className="collapse-btn"
          onClick={onToggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <FiMenu /> : <FiX />}
        </button>
      </div>

      <nav className="sidebar-nav">
        {!collapsed && <span className="nav-section-label">Navigation</span>}

        {navItems.map(item => {
          const badge = item.id === "threats" && dangerousCount > 0 ? dangerousCount : null;
          return (
            <button
              key={item.id}
              className={`nav-item${activeView === item.id ? " active" : ""}`}
              onClick={() => onNavigate(item.id)}
              title={collapsed ? item.label : ""}
              aria-label={item.label}
            >
              <item.icon className="nav-icon" />
              {!collapsed && <span>{item.label}</span>}
              {!collapsed && badge && <span className="badge">{badge}</span>}
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <button
          className="nav-item logout"
          onClick={onLogout}
          title={collapsed ? "Logout" : ""}
          aria-label="Logout"
        >
          <FiLogOut className="nav-icon" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>

    </aside>
  );
}

export default Sidebar;
