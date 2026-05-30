import React, { useState } from "react";
import {
  FiShield, FiMail, FiLock, FiUser, FiUserPlus,
  FiZap, FiEye, FiGlobe, FiCheckCircle
} from "react-icons/fi";

import API from "./services/api";
import "./styles/login.css";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateForm({ username, email, password, confirmPassword }) {
  const errors = {};
  if (!username || username.trim().length < 2 || username.trim().length > 50)
    errors.username = "Username must be 2–50 characters";
  if (!email || !EMAIL_RE.test(email))
    errors.email = "Enter a valid email address";
  if (!password || password.length < 8)
    errors.password = "Password must be at least 8 characters";
  if (password !== confirmPassword)
    errors.confirmPassword = "Passwords do not match";
  return errors;
}

function Register({ setShowRegister }) {
  const [form, setForm] = useState({
    username: "", email: "", password: "", confirmPassword: ""
  });
  const [errors,   setErrors]   = useState({});
  const [apiError, setApiError] = useState("");
  const [success,  setSuccess]  = useState(false);
  const [loading,  setLoading]  = useState(false);

  const setField = (field) => (e) =>
    setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async () => {
    const fieldErrors = validateForm(form);
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setApiError("");
    setLoading(true);
    try {
      await API.post("/auth/register", {
        username: form.username.trim(),
        email:    form.email.toLowerCase().trim(),
        password: form.password,
      });
      setSuccess(true);
      setTimeout(() => setShowRegister(false), 2500);
    } catch (err) {
      setApiError(err.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => e.key === "Enter" && handleSubmit();

  if (success) {
    return (
      <div className="login-page">
        <div className="success-card">
          <FiCheckCircle className="success-card-icon" />
          <h2>Account Created!</h2>
          <p>Redirecting you to sign in…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-split register-split">

        {/* ── LEFT BRAND PANEL ──────────────────── */}
        <div className="login-brand">
          <FiShield className="brand-shield" />
          <h1>CTI Guard</h1>
          <p>Join the Cyber Threat Intelligence platform for real-time login risk analysis</p>

          <div className="brand-pills">
            <div className="brand-pill"><FiZap />Real-time risk scoring</div>
            <div className="brand-pill"><FiGlobe />IP geolocation tracking</div>
            <div className="brand-pill"><FiEye />Anomaly detection</div>
          </div>
        </div>

        {/* ── RIGHT FORM PANEL ──────────────────── */}
        <div className="login-form-panel">
          <h2>Create account</h2>
          <p className="form-sub">Register to access your CTI dashboard</p>

          <div className="field-group">

            <div className="field-wrap">
              <label>Username</label>
              <div className={`field-input${errors.username ? " field-input--error" : ""}`}>
                <FiUser />
                <input
                  type="text"
                  placeholder="your_username"
                  value={form.username}
                  onChange={setField("username")}
                  onKeyDown={handleKey}
                  autoComplete="username"
                />
              </div>
              {errors.username && <span className="field-error">{errors.username}</span>}
            </div>

            <div className="field-wrap">
              <label>Email address</label>
              <div className={`field-input${errors.email ? " field-input--error" : ""}`}>
                <FiMail />
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={setField("email")}
                  onKeyDown={handleKey}
                  autoComplete="email"
                />
              </div>
              {errors.email && <span className="field-error">{errors.email}</span>}
            </div>

            <div className="field-wrap">
              <label>Password</label>
              <div className={`field-input${errors.password ? " field-input--error" : ""}`}>
                <FiLock />
                <input
                  type="password"
                  placeholder="min. 8 characters"
                  value={form.password}
                  onChange={setField("password")}
                  onKeyDown={handleKey}
                  autoComplete="new-password"
                />
              </div>
              {errors.password && <span className="field-error">{errors.password}</span>}
            </div>

            <div className="field-wrap">
              <label>Confirm password</label>
              <div className={`field-input${errors.confirmPassword ? " field-input--error" : ""}`}>
                <FiLock />
                <input
                  type="password"
                  placeholder="re-enter your password"
                  value={form.confirmPassword}
                  onChange={setField("confirmPassword")}
                  onKeyDown={handleKey}
                  autoComplete="new-password"
                />
              </div>
              {errors.confirmPassword && (
                <span className="field-error">{errors.confirmPassword}</span>
              )}
            </div>

          </div>

          {apiError && (
            <div className="login-error">
              <FiShield />
              {apiError}
            </div>
          )}

          <button
            className="login-btn"
            onClick={handleSubmit}
            disabled={loading}
          >
            <FiUserPlus />
            {loading ? "Creating account…" : "Create account"}
          </button>

          <p className="auth-switch">
            Already have an account?{" "}
            <button className="auth-link" onClick={() => setShowRegister(false)}>
              Sign in
            </button>
          </p>
        </div>

      </div>
    </div>
  );
}

export default Register;
