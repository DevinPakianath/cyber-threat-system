import React, { useState, useEffect, useCallback, useRef } from "react";
import { FiGlobe, FiPause, FiPlay, FiRefreshCw } from "react-icons/fi";

import API from "../services/api";

function timeAgo(ts) {
  const secs = Math.floor((Date.now() - new Date(ts)) / 1000);
  if (secs < 5)    return "just now";
  if (secs < 60)   return `${secs}s ago`;
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

function riskColor(status) {
  if (status === "Dangerous")  return "var(--dangerous)";
  if (status === "Suspicious") return "var(--suspicious)";
  return "var(--safe)";
}

function FeedCard({ log, isNew }) {
  const [highlight, setHighlight] = useState(isNew);

  useEffect(() => {
    if (!isNew) return;
    const t = setTimeout(() => setHighlight(false), 3000);
    return () => clearTimeout(t);
  }, [isNew]);

  const risk = log.riskStatus?.toLowerCase();

  return (
    <div className={`feed-card feed-${risk}${highlight ? " feed-new" : ""}`}>
      {highlight && <span className="feed-new-badge">NEW</span>}

      <div className="feed-card-top">
        <div className="feed-ip">
          <FiGlobe />
          <span>{log.ip}</span>
          {log.location && log.location !== "Unknown" && (
            <span className="feed-location">{log.location}</span>
          )}
        </div>
        <span className="feed-time">{timeAgo(log.timestamp)}</span>
      </div>

      <div className="feed-card-bottom">
        <span className={`status-dot ${log.loginStatus}`}>{log.loginStatus}</span>
        <span className={`risk-badge ${risk}`}>{log.riskStatus}</span>
        <span className="feed-score" style={{ color: riskColor(log.riskStatus) }}>
          Score: {log.riskScore ?? 0}
        </span>
      </div>
    </div>
  );
}

function LiveFeedView() {
  const [feed,       setFeed]       = useState([]);
  const [paused,     setPaused]     = useState(false);
  const [newCount,   setNewCount]   = useState(0);
  const [newIds,     setNewIds]     = useState(new Set());
  const [loading,    setLoading]    = useState(false);
  const latestTsRef = useRef(null);

  const fetchFeed = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await API.get("/logs?limit=30");
      const data = res.data.logs ?? res.data;

      if (latestTsRef.current && data.length > 0) {
        const fresh = data.filter(e => new Date(e.timestamp) > new Date(latestTsRef.current));
        if (fresh.length > 0) {
          setNewCount(n => n + fresh.length);
          setNewIds(prev => new Set([...prev, ...fresh.map(e => e._id)]));
        }
      }

      if (data.length > 0) latestTsRef.current = data[0].timestamp;
      setFeed(data);
    } catch {
      // silent — live feed shouldn't show error banner
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => { fetchFeed(); }, [fetchFeed]);

  // Polling every 5s when not paused
  useEffect(() => {
    if (paused) return;
    const id = setInterval(fetchFeed, 5000);
    return () => clearInterval(id);
  }, [paused, fetchFeed]);

  const handleResume = () => {
    setPaused(false);
    setNewCount(0);
    setNewIds(new Set());
    fetchFeed();
  };

  return (
    <div className="view-livefeed">

      <div className="livefeed-toolbar">
        <div className="livefeed-status">
          {paused ? (
            <span className="feed-paused-dot" />
          ) : (
            <span className="live-dot" />
          )}
          <span>{paused ? "Paused" : "Live"} · {feed.length} entries</span>
          {loading && <FiRefreshCw className="feed-spin" />}
        </div>

        <div className="livefeed-actions">
          {newCount > 0 && !paused && (
            <span className="new-count-badge">{newCount} new</span>
          )}
          {paused ? (
            <button className="icon-btn safe-btn" onClick={handleResume}>
              <FiPlay /> Resume
            </button>
          ) : (
            <button className="icon-btn" onClick={() => setPaused(true)}>
              <FiPause /> Pause
            </button>
          )}
        </div>
      </div>

      {feed.length === 0 ? (
        <div className="table-empty" style={{ marginTop: 40 }}>
          <FiGlobe />
          <p>No login activity yet. Waiting for events…</p>
        </div>
      ) : (
        <div className="feed-list">
          {feed.map(log => (
            <FeedCard
              key={log._id}
              log={log}
              isNew={newIds.has(log._id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default LiveFeedView;
