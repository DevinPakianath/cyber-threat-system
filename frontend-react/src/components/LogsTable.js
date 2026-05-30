import React, { useState, useMemo } from "react";
import { FiSearch, FiGlobe, FiChevronRight, FiShield } from "react-icons/fi";

const FILTERS = ["All", "Safe", "Suspicious", "Dangerous"];

function scoreColor(score) {
  if (score < 30) return "#10b981";
  if (score < 60) return "#f59e0b";
  return "#ef4444";
}

function LogsTable({ logs }) {
  const [filter, setFilter]   = useState("All");
  const [search, setSearch]   = useState("");
  const [expanded, setExpanded] = useState(null);

  const visible = useMemo(() => {
    return logs.filter(l => {
      const matchFilter = filter === "All" || l.riskStatus === filter;
      const matchSearch = !search || l.ip?.includes(search) || l.location?.toLowerCase().includes(search.toLowerCase());
      return matchFilter && matchSearch;
    });
  }, [logs, filter, search]);

  const toggleRow = (id) => setExpanded(prev => prev === id ? null : id);

  return (
    <div className="logs-section">

      <div className="logs-header">
        <div className="logs-header-left">
          <h2>Login Logs</h2>
          <p>{visible.length} of {logs.length} entries</p>
        </div>

        <div className="logs-controls">
          <div className="logs-search">
            <FiSearch />
            <input
              placeholder="Search IP or location…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div className="filter-tabs">
            {FILTERS.map(f => (
              <button
                key={f}
                className={`filter-tab${filter === f ? ` active tab-${f.toLowerCase()}` : ""}`}
                onClick={() => setFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="table-empty">
          <FiShield />
          <p>{search || filter !== "All" ? "No results match your filter." : "No login activity yet."}</p>
        </div>
      ) : (
        <table className="logs-table">
          <thead>
            <tr>
              <th>IP Address</th>
              <th>Location</th>
              <th>Status</th>
              <th>Risk</th>
              <th>Score</th>
              <th>Time</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {visible.map((log) => {
              const id       = log._id;
              const isOpen   = expanded === id;
              const riskCls  = log.riskStatus?.toLowerCase();
              const score    = log.riskScore ?? 0;

              return (
                <React.Fragment key={id}>
                  <tr className="log-row" onClick={() => toggleRow(id)}>
                    <td>
                      <div className="ip-cell">
                        <FiGlobe />
                        {log.ip}
                      </div>
                    </td>
                    <td>
                      <span className="location-cell">{log.location || "—"}</span>
                    </td>
                    <td>
                      <span className={`status-dot ${log.loginStatus}`}>
                        {log.loginStatus}
                      </span>
                    </td>
                    <td>
                      <span className={`risk-badge ${riskCls}`}>
                        {log.riskStatus}
                      </span>
                    </td>
                    <td>
                      <div className="score-cell">
                        <div className="score-track">
                          <div
                            className="score-fill"
                            style={{ width: `${score}%`, background: scoreColor(score) }}
                          />
                        </div>
                        <span className="score-num">{score}</span>
                      </div>
                    </td>
                    <td style={{ color: "var(--text-secondary)", fontSize: 12 }}>
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td>
                      <FiChevronRight className={`chevron${isOpen ? " open" : ""}`} />
                    </td>
                  </tr>

                  <tr className="detail-row">
                    <td colSpan={7}>
                      <div className={`detail-panel${isOpen ? " open" : ""}`}>
                        <div className="detail-inner">
                          <div className="detail-field">
                            <label>Full Timestamp</label>
                            <span>{new Date(log.timestamp).toLocaleString("en-US", { dateStyle: "long", timeStyle: "medium" })}</span>
                          </div>
                          <div className="detail-field">
                            <label>Location</label>
                            <span>{log.location || "Unknown"}</span>
                          </div>
                          <div className="detail-field">
                            <label>Risk Score</label>
                            <span style={{ color: scoreColor(score), fontWeight: 600 }}>{score} / 100</span>
                          </div>
                          <div className="detail-field">
                            <label>Login Result</label>
                            <span style={{ color: log.loginStatus === "success" ? "var(--safe)" : "var(--dangerous)", textTransform: "capitalize" }}>
                              {log.loginStatus}
                            </span>
                          </div>
                          <div className="detail-field">
                            <label>Risk Level</label>
                            <span style={{ color: riskCls === "safe" ? "var(--safe)" : riskCls === "suspicious" ? "var(--suspicious)" : "var(--dangerous)" }}>
                              {log.riskStatus}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default LogsTable;
