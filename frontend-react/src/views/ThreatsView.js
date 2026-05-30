import React from "react";
import { FiShield, FiAlertTriangle, FiTrendingUp, FiTarget } from "react-icons/fi";

import StatCard  from "../components/StatCard";
import LogsTable from "../components/LogsTable";

function AllClear() {
  return (
    <div className="all-clear">
      <div className="all-clear-icon"><FiShield /></div>
      <h2>All Clear</h2>
      <p>No suspicious or dangerous login activity detected in your history.</p>
    </div>
  );
}

function ThreatsView({ logs }) {
  const threats   = logs.filter(l => l.riskStatus === "Suspicious" || l.riskStatus === "Dangerous");
  const dangerous = threats.filter(l => l.riskStatus === "Dangerous").length;
  const avgScore  = threats.length
    ? Math.round(threats.reduce((s, t) => s + (t.riskScore || 0), 0) / threats.length)
    : 0;
  const maxScore  = threats.length ? Math.max(...threats.map(t => t.riskScore || 0)) : 0;

  return (
    <div className="view-threats">
      <div className="stats-row">
        <StatCard title="Total Threats" value={threats.length}  icon={FiAlertTriangle} colorClass="dangerous"  delta={null} />
        <StatCard title="Dangerous"     value={dangerous}       icon={FiTarget}        colorClass="dangerous"  delta={null} />
        <StatCard title="Avg Risk Score" value={avgScore}       icon={FiTrendingUp}    colorClass="suspicious" delta={null} />
        <StatCard title="Peak Score"    value={maxScore}        icon={FiAlertTriangle} colorClass="dangerous"  delta={null} />
      </div>

      {threats.length === 0 ? (
        <AllClear />
      ) : (
        <LogsTable logs={threats} />
      )}
    </div>
  );
}

export default ThreatsView;
