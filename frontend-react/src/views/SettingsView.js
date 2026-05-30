import React, { useState } from "react";
import {
  FiUser, FiMail, FiLock, FiSave, FiShield,
  FiClock, FiAlertTriangle, FiLogOut, FiCheckCircle
} from "react-icons/fi";

import API from "../services/api";

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="info-row">
      <Icon className="info-icon" />
      <div>
        <span className="info-label">{label}</span>
        <span className="info-value">{value}</span>
      </div>
    </div>
  );
}

function SettingsView({ onLogout }) {
  const username = localStorage.getItem("username") || "—";
  const email    = localStorage.getItem("email")    || "—";

  const [currentPw,  setCurrentPw]  = useState("");
  const [newPw,      setNewPw]      = useState("");
  const [confirmPw,  setConfirmPw]  = useState("");
  const [pwStatus,   setPwStatus]   = useState(null); // { type: "success"|"error", msg }
  const [pwLoading,  setPwLoading]  = useState(false);

  const handleChangePassword = async () => {
    setPwStatus(null);

    if (!currentPw || !newPw || !confirmPw) {
      return setPwStatus({ type: "error", msg: "All fields are required." });
    }
    if (newPw !== confirmPw) {
      return setPwStatus({ type: "error", msg: "New passwords do not match." });
    }
    if (newPw.length < 8) {
      return setPwStatus({ type: "error", msg: "New password must be at least 8 characters." });
    }

    setPwLoading(true);
    try {
      const res = await API.put("/auth/password", {
        currentPassword: currentPw,
        newPassword:     newPw,
      });
      setPwStatus({ type: "success", msg: res.data.message });
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
    } catch (err) {
      setPwStatus({ type: "error", msg: err.response?.data?.message || "Failed to update password." });
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <div className="view-settings">

      {/* PROFILE */}
      <div className="settings-section">
        <h2 className="settings-section-title">Profile</h2>
        <div className="settings-card">
          <div className="profile-avatar">
            {username.slice(0, 2).toUpperCase()}
          </div>
          <div className="profile-info">
            <InfoRow icon={FiUser}  label="Username" value={username} />
            <InfoRow icon={FiMail}  label="Email"    value={email} />
          </div>
        </div>
      </div>

      {/* CHANGE PASSWORD */}
      <div className="settings-section">
        <h2 className="settings-section-title">Change Password</h2>
        <div className="settings-card">
          <div className="settings-form">
            <div className="settings-field">
              <label>Current Password</label>
              <div className="field-input">
                <FiLock />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={currentPw}
                  onChange={e => setCurrentPw(e.target.value)}
                />
              </div>
            </div>
            <div className="settings-field">
              <label>New Password</label>
              <div className="field-input">
                <FiLock />
                <input
                  type="password"
                  placeholder="Min. 8 characters"
                  value={newPw}
                  onChange={e => setNewPw(e.target.value)}
                />
              </div>
            </div>
            <div className="settings-field">
              <label>Confirm New Password</label>
              <div className="field-input">
                <FiLock />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={confirmPw}
                  onChange={e => setConfirmPw(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleChangePassword()}
                />
              </div>
            </div>

            {pwStatus && (
              <div className={`settings-feedback ${pwStatus.type}`}>
                {pwStatus.type === "success" ? <FiCheckCircle /> : <FiAlertTriangle />}
                {pwStatus.msg}
              </div>
            )}

            <button
              className="settings-save-btn"
              onClick={handleChangePassword}
              disabled={pwLoading}
            >
              <FiSave />
              {pwLoading ? "Saving…" : "Update Password"}
            </button>
          </div>
        </div>
      </div>

      {/* SECURITY INFO */}
      <div className="settings-section">
        <h2 className="settings-section-title">Security Info</h2>
        <div className="settings-card settings-info-grid">
          <div className="security-info-item">
            <FiClock className="sec-icon" />
            <div>
              <span className="sec-label">Session Duration</span>
              <span className="sec-value">24 hours (JWT)</span>
            </div>
          </div>
          <div className="security-info-item">
            <FiAlertTriangle className="sec-icon suspicious" />
            <div>
              <span className="sec-label">Login Rate Limit</span>
              <span className="sec-value">10 attempts / 15 min per IP</span>
            </div>
          </div>
          <div className="security-info-item">
            <FiShield className="sec-icon safe" />
            <div>
              <span className="sec-label">Password Hashing</span>
              <span className="sec-value">bcrypt · 10 salt rounds</span>
            </div>
          </div>
          <div className="security-info-item">
            <FiLock className="sec-icon" />
            <div>
              <span className="sec-label">Registration Limit</span>
              <span className="sec-value">5 accounts / hour per IP</span>
            </div>
          </div>
        </div>
      </div>

      {/* DANGER ZONE */}
      <div className="settings-section">
        <h2 className="settings-section-title danger-title">Session</h2>
        <div className="settings-card danger-zone">
          <div>
            <p className="danger-label">Sign out of your account</p>
            <p className="danger-sub">You will need to log in again to access the dashboard.</p>
          </div>
          <button className="danger-btn" onClick={onLogout}>
            <FiLogOut /> Sign Out
          </button>
        </div>
      </div>

    </div>
  );
}

export default SettingsView;
