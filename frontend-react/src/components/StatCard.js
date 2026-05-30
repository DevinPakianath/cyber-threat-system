import React from "react";

function deltaLabel(delta, higherIsBetter) {
  if (delta === null || delta === undefined) return null;
  if (delta === 0) return { text: "— same",    cls: "neutral" };
  const sign = delta > 0 ? "▲" : "▼";
  const abs  = Math.abs(delta);
  const good = (delta > 0) === higherIsBetter;
  const cls  = delta > 0
    ? (good ? "up-good"   : "up-bad")
    : (good ? "down-good" : "down-bad");
  return { text: `${sign} ${abs} today`, cls };
}

function StatCard({ title, value, icon: Icon, colorClass, delta, higherIsBetter }) {
  const dl = deltaLabel(delta ?? 0, higherIsBetter ?? true);

  return (
    <div className={`stat-card${colorClass ? ` accent-${colorClass}` : ""}`}>

      <div className="stat-top">
        <div className={`stat-icon-wrap${colorClass ? ` ${colorClass}` : " default"}`}>
          <Icon />
        </div>
        <span className={`stat-delta ${dl.cls}`}>{dl.text}</span>
      </div>

      <div className="stat-value">{value}</div>
      <div className="stat-label">{title}</div>

    </div>
  );
}

export default StatCard;
