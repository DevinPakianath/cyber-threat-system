import React from "react";
import {
  FiShield, FiZap, FiGlobe, FiEye, FiAlertTriangle,
  FiActivity, FiLock, FiArrowRight, FiCheckCircle
} from "react-icons/fi";
import "./styles/landing.css";

const FEATURES = [
  {
    icon: <FiZap />,
    title: "Real-Time Risk Scoring",
    desc: "Every login attempt is scored instantly using behavioural signals, IP reputation, and geo-anomaly detection.",
  },
  {
    icon: <FiGlobe />,
    title: "IP Geolocation Tracking",
    desc: "Map login origins worldwide. Spot impossible-travel events and flag logins from high-risk regions automatically.",
  },
  {
    icon: <FiEye />,
    title: "Anomaly Detection",
    desc: "Machine-learning models surface unusual access patterns before they become breaches.",
  },
  {
    icon: <FiAlertTriangle />,
    title: "Instant Threat Alerts",
    desc: "Get notified the moment a critical threat is detected — with full context attached.",
  },
  {
    icon: <FiActivity />,
    title: "Live Feed Dashboard",
    desc: "A live stream of every login event, enriched with risk level, location, and device fingerprint.",
  },
  {
    icon: <FiLock />,
    title: "Zero-Trust Enforcement",
    desc: "Block or challenge high-risk sessions in real time, without disrupting legitimate users.",
  },
];

const STATS = [
  { value: "99.9%", label: "Uptime SLA" },
  { value: "<50ms", label: "Detection latency" },
  { value: "10M+", label: "Events analysed" },
  { value: "360°", label: "Threat visibility" },
];

const CHECKS = [
  "Brute-force & credential stuffing detection",
  "Impossible-travel flagging",
  "Device fingerprint anomalies",
  "Dark-web credential correlation",
];

export default function Landing({ onGetStarted, onSignIn }) {
  return (
    <div className="land-page">

      {/* ── NAV ── */}
      <nav className="land-nav">
        <div className="land-nav-brand">
          <FiShield className="land-nav-icon" />
          <span>CTI Guard</span>
        </div>
        <div className="land-nav-actions">
          <button className="land-btn-ghost" onClick={onSignIn}>Sign in</button>
          <button className="land-btn-primary" onClick={onGetStarted}>Get started</button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="land-hero">
        <div className="land-hero-badge">
          <FiZap /> Cyber Threat Intelligence &nbsp;·&nbsp; Real-Time
        </div>
        <h1 className="land-hero-h1">
          Stop threats before<br />
          <span className="land-accent">they become breaches</span>
        </h1>
        <p className="land-hero-sub">
          CTI Guard monitors every login in real time, scores risk instantly, and gives your
          security team the visibility it needs to act — not react.
        </p>
        <div className="land-hero-cta">
          <button className="land-btn-primary land-btn-lg" onClick={onGetStarted}>
            Get started free <FiArrowRight />
          </button>
          <button className="land-btn-ghost land-btn-lg" onClick={onSignIn}>
            Sign in to dashboard
          </button>
        </div>

        <div className="land-checklist">
          {CHECKS.map(c => (
            <span key={c} className="land-check-item">
              <FiCheckCircle /> {c}
            </span>
          ))}
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="land-stats">
        {STATS.map(s => (
          <div key={s.label} className="land-stat">
            <span className="land-stat-val">{s.value}</span>
            <span className="land-stat-label">{s.label}</span>
          </div>
        ))}
      </section>

      {/* ── FEATURES ── */}
      <section className="land-features">
        <h2 className="land-section-title">Everything you need to secure access</h2>
        <p className="land-section-sub">
          Built for security teams who need signal, not noise.
        </p>
        <div className="land-feature-grid">
          {FEATURES.map(f => (
            <div key={f.title} className="land-feature-card">
              <div className="land-feature-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="land-cta-banner">
        <FiShield className="land-cta-shield" />
        <h2>Ready to take control of your login security?</h2>
        <p>Create a free account and start monitoring in minutes.</p>
        <button className="land-btn-primary land-btn-lg" onClick={onGetStarted}>
          Create free account <FiArrowRight />
        </button>
      </section>

      {/* ── FOOTER ── */}
      <footer className="land-footer">
        <div className="land-nav-brand">
          <FiShield className="land-nav-icon" />
          <span>CTI Guard</span>
        </div>
        <p>© {new Date().getFullYear()} CTI Guard. Cyber Threat Intelligence Platform.</p>
      </footer>

    </div>
  );
}
