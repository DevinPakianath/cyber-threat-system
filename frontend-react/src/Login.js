import React, { useState } from "react";
import { FiShield, FiMail, FiLock, FiLogIn, FiZap, FiEye, FiGlobe } from "react-icons/fi";

import API from "./services/api";
import "./styles/login.css";

function Login({ setIsLoggedIn, setShowRegister }) {
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  const handleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await API.post("/auth/login", { email, password });
      localStorage.setItem("token",    res.data.token);
      localStorage.setItem("username", res.data.username);
      localStorage.setItem("email",    res.data.email);
      setIsLoggedIn(true);
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Please try again.");
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
          <p className="form-sub">Sign in to your CTI dashboard</p>

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
                  onKeyDown={e => e.key === "Enter" && handleLogin()}
                  autoComplete="email"
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
                  onKeyDown={e => e.key === "Enter" && handleLogin()}
                  autoComplete="current-password"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="login-error">
              <FiShield />
              {error}
            </div>
          )}

          <button
            className="login-btn"
            onClick={handleLogin}
            disabled={loading}
          >
            <FiLogIn />
            {loading ? "Signing in…" : "Sign in"}
          </button>

          <p className="auth-switch">
            Don't have an account?{" "}
            <button className="auth-link" onClick={() => setShowRegister(true)}>
              Sign up
            </button>
          </p>
        </div>

      </div>
    </div>
  );
}

export default Login;
