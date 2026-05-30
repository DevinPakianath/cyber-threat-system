import React from "react";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer
} from "recharts";

const SLICES = [
  { key: "Safe",       color: "#10b981" },
  { key: "Suspicious", color: "#f59e0b" },
  { key: "Dangerous",  color: "#ef4444" },
];

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0];
  const total = payload[0].payload.total;
  const pct = total ? Math.round((value / total) * 100) : 0;
  return (
    <div style={{
      background: "#0c1829",
      border: "1px solid rgba(0,255,213,0.15)",
      borderRadius: 10,
      padding: "9px 14px",
      fontSize: 12,
    }}>
      <p style={{ color: payload[0].fill }}><strong>{name}</strong></p>
      <p style={{ color: "#e2e8f0" }}>{value} logins ({pct}%)</p>
    </div>
  );
};

function ThreatChart({ safe, suspicious, dangerous }) {
  const total = safe + suspicious + dangerous;

  const data = SLICES.map(s => ({
    name:  s.key,
    value: s.key === "Safe" ? safe : s.key === "Suspicious" ? suspicious : dangerous,
    total,
    color: s.color,
  })).filter(d => d.value > 0);

  return (
    <div className="chart-card">
      <div className="chart-card-header">
        <h2>Threat Split</h2>
        <p>{total} total login{total !== 1 ? "s" : ""}</p>
      </div>

      {total === 0 ? (
        <div className="pie-empty">No data yet</div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={190}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={82}
                paddingAngle={data.length > 1 ? 3 : 0}
                dataKey="value"
                strokeWidth={0}
              >
                {data.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>

          <div className="pie-legend">
            {SLICES.map(s => {
              const val = s.key === "Safe" ? safe : s.key === "Suspicious" ? suspicious : dangerous;
              return (
                <div key={s.key} className="pie-legend-item">
                  <span className="legend-dot" style={{ background: s.color }} />
                  <span>{s.key} ({val})</span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

export default ThreatChart;
