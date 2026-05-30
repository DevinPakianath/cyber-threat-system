import React from "react";
import { FiAlertTriangle, FiCheckCircle, FiShield, FiList } from "react-icons/fi";

import StatCard      from "../components/StatCard";
import ThreatTimeline from "../components/ThreatTimeline";
import ThreatChart   from "../components/ThreatChart";
import LogsTable     from "../components/LogsTable";

function getDelta(logs, filterFn, daysAgo) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  const dateStr = d.toDateString();
  return logs.filter(l => filterFn(l) && new Date(l.timestamp).toDateString() === dateStr).length;
}

function OverviewView({ logs, error }) {
  const safe       = logs.filter(l => l.riskStatus === "Safe").length;
  const suspicious = logs.filter(l => l.riskStatus === "Suspicious").length;
  const dangerous  = logs.filter(l => l.riskStatus === "Dangerous").length;

  const totalDelta = getDelta(logs, () => true, 0)                          - getDelta(logs, () => true, 1);
  const safeDelta  = getDelta(logs, l => l.riskStatus === "Safe", 0)        - getDelta(logs, l => l.riskStatus === "Safe", 1);
  const suspDelta  = getDelta(logs, l => l.riskStatus === "Suspicious", 0)  - getDelta(logs, l => l.riskStatus === "Suspicious", 1);
  const dangDelta  = getDelta(logs, l => l.riskStatus === "Dangerous", 0)   - getDelta(logs, l => l.riskStatus === "Dangerous", 1);

  return (
    <>
      {error && (
        <div className="error-banner">
          <FiAlertTriangle /> {error}
        </div>
      )}

      <div className="stats-row">
        <StatCard title="Total Logins"  value={logs.length} icon={FiList}          delta={totalDelta} higherIsBetter={true} />
        <StatCard title="Safe"          value={safe}        icon={FiCheckCircle}   colorClass="safe"       delta={safeDelta}  higherIsBetter={true} />
        <StatCard title="Suspicious"    value={suspicious}  icon={FiShield}        colorClass="suspicious" delta={suspDelta}  higherIsBetter={false} />
        <StatCard title="Dangerous"     value={dangerous}   icon={FiAlertTriangle} colorClass="dangerous"  delta={dangDelta}  higherIsBetter={false} />
      </div>

      <div className="charts-row">
        <ThreatTimeline logs={logs} />
        <ThreatChart safe={safe} suspicious={suspicious} dangerous={dangerous} />
      </div>

      <LogsTable logs={logs} />
    </>
  );
}

export default OverviewView;
