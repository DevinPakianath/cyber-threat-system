import React, { useMemo } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from "recharts";

function buildDays(logs) {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const dateStr = d.toDateString();
    const dayLogs = logs.filter(l => new Date(l.timestamp).toDateString() === dateStr);
    days.push({
      date: label,
      Safe:       dayLogs.filter(l => l.riskStatus === "Safe").length,
      Suspicious: dayLogs.filter(l => l.riskStatus === "Suspicious").length,
      Dangerous:  dayLogs.filter(l => l.riskStatus === "Dangerous").length,
    });
  }
  return days;
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "#0c1829",
      border: "1px solid rgba(0,255,213,0.15)",
      borderRadius: 10,
      padding: "10px 14px",
      fontSize: 12,
    }}>
      <p style={{ color: "#94a3b8", marginBottom: 6 }}>{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color, marginBottom: 2 }}>
          {p.name}: <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  );
};

function ThreatTimeline({ logs }) {
  const data = useMemo(() => buildDays(logs), [logs]);

  return (
    <div className="chart-card">
      <div className="chart-card-header">
        <h2>Risk Trend</h2>
        <p>Login activity over the last 7 days</p>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
          <defs>
            <linearGradient id="gradSafe" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#10b981" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradSusp" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#f59e0b" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradDang" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis
            dataKey="date"
            tick={{ fill: "#64748b", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fill: "#64748b", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: 12, color: "#64748b", paddingTop: 10 }}
            iconType="circle"
            iconSize={8}
          />
          <Area type="monotone" dataKey="Safe"       stroke="#10b981" fill="url(#gradSafe)" strokeWidth={2} dot={false} />
          <Area type="monotone" dataKey="Suspicious" stroke="#f59e0b" fill="url(#gradSusp)" strokeWidth={2} dot={false} />
          <Area type="monotone" dataKey="Dangerous"  stroke="#ef4444" fill="url(#gradDang)" strokeWidth={2} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export default ThreatTimeline;
