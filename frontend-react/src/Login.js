import React, { useState } from "react";
import { FiShield, FiMail, FiLock, FiLogIn, FiZap, FiEye, FiGlobe, FiAlertTriangle } from "react-icons/fi";

import API from "./services/api";
import "./styles/login.css";

function Login({ setIsLoggedIn }) {
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  const handleLogin = async () => {
    setError("");
    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);
    try {
      const res = await API.post("/auth/login", {
        email: email.trim().toLowerCase(),
        password,
      });
      localStorage.setItem("token",    res.data.token);
      localStorage.setItem("username", res.data.username);
      localStorage.setItem("email",    res.data.email);
      localStorage.setItem("role",     res.data.role || "employee");
      setIsLoggedIn(true);
    } catch (err) {
      setError(err.response?.data?.message || "Invalid credentials or account access issue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-split">

        {/* ── LEFT BRAND PANEL ──────────────────── */}
        <div className="login-brand">
          <FiShield className="brand-shield" />
          <h1>CTI Guard</h1>
          <p>Cyber Threat Intelligence platform for real-time login risk analysis</p>

          <div className="brand-pills">
            <div className="brand-pill">
              <FiZap />
              Real-time risk scoring
            </div>
            <div className="brand-pill">
              <FiGlobe />
              IP geolocation tracking
            </div>
            <div className="brand-pill">
              <FiEye />
              Anomaly detection
            </div>
          </div>
        </div>

        {/* ── RIGHT FORM PANEL ──────────────────── */}
        <div className="login-form-panel">
          <h2>Welcome back</h2>
          <p className="form-sub">Sign in to your security dashboard</p>

          <div className="field-group">
            <div className="field-wrap">
              <label>Email address</label>
              <div className="field-input">
                <FiMail />
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && !loading && handleLogin()}
                  autoComplete="email"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="field-wrap">
              <label>Password</label>
              <div className="field-input">
                <FiLock />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && !loading && handleLogin()}
                  autoComplete="current-password"
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="login-error" style={{ marginTop: "12px" }}>
              <FiAlertTriangle style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <button
            className="login-btn"
            onClick={handleLogin}
            disabled={loading}
          >
            <FiLogIn />
            {loading ? "Authenticating…" : "Sign in"}
          </button>

          <div style={{
            marginTop: "24px",
            paddingTop: "16px",
            borderTop: "1px solid rgba(255,255,255,0.06)",
            textAlign: "center",
            fontSize: "12px",
            color: "#64748b"
          }}>
            Company Managed System · Contact your administrator for account access
          </div>
        </div>

      </div>
    </div>
  );
}

export default Login;

