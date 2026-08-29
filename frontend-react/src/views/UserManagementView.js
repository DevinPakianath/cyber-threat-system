import React, { useState, useEffect, useCallback } from "react";
import {
  FiUsers, FiUserPlus, FiSearch, FiRefreshCw, FiCheckCircle,
  FiAlertTriangle, FiShield, FiUserCheck, FiUserX, FiBriefcase,
  FiMail, FiLock, FiX, FiCheck, FiFilter, FiKey
} from "react-icons/fi";
import API from "../services/api";

function UserManagementView({ userRole }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Filters & Search
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Create User Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState(userRole === "admin" ? "manager" : "employee");
  const [newManagerId, setNewManagerId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Reassign Modal (Admin only)
  const [isReassignModalOpen, setIsReassignModalOpen] = useState(false);
  const [reassignTargetUser, setReassignTargetUser] = useState(null);
  const [selectedManagerId, setSelectedManagerId] = useState("");

  // Reset Password Modal (Admin only)
  const [isResetPwModalOpen, setIsResetPwModalOpen] = useState(false);
  const [resetPwTargetUser, setResetPwTargetUser] = useState(null);
  const [resetNewPassword, setResetNewPassword] = useState("");
  const [resetMustChange, setResetMustChange] = useState(true);

  const isAdmin = userRole === "admin";
  const currentUserId = localStorage.getItem("username");

  const fetchUsers = useCallback(async () => {
    setError("");
    setLoading(true);
    try {
      const res = await API.get("/users");
      setUsers(res.data.users || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load users.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Available managers for assignment (Admin mode)
  const availableManagers = users.filter((u) => u.role === "manager" && u.isActive);

  // Handle User Creation
  const handleCreateUser = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!newUsername.trim() || !newEmail.trim() || !newPassword) {
      setError("Please fill in all required fields.");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        username: newUsername.trim(),
        email: newEmail.trim().toLowerCase(),
        password: newPassword,
        role: isAdmin ? newRole : "employee",
      };

      if (isAdmin && newRole === "employee" && newManagerId) {
        payload.managerId = newManagerId;
      }

      const res = await API.post("/users", payload);
      setSuccessMsg(res.data.message || "User account created successfully ✅");
      setIsAddModalOpen(false);
      setNewUsername("");
      setNewEmail("");
      setNewPassword("");
      setNewRole(isAdmin ? "manager" : "employee");
      setNewManagerId("");
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create user account.");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Toggle Active/Inactive Status
  const handleToggleStatus = async (user) => {
    setError("");
    setSuccessMsg("");
    const newStatus = !user.isActive;

    try {
      await API.put(`/users/${user._id}`, { isActive: newStatus });
      setSuccessMsg(
        `${user.username} has been ${newStatus ? "activated" : "deactivated"} successfully.`
      );
      setUsers((prev) =>
        prev.map((u) => (u._id === user._id ? { ...u, isActive: newStatus } : u))
      );
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update user status.");
    }
  };

  // Handle Manager Reassignment
  const handleReassignSubmit = async (e) => {
    e.preventDefault();
    if (!reassignTargetUser) return;
    setError("");
    setSuccessMsg("");
    setSubmitting(true);

    try {
      const payload = {
        managerId: selectedManagerId === "" ? null : selectedManagerId,
      };
      await API.put(`/users/${reassignTargetUser._id}`, payload);
      setSuccessMsg(`Manager assignment updated for ${reassignTargetUser.username} ✅`);
      setIsReassignModalOpen(false);
      setReassignTargetUser(null);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update manager assignment.");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Admin Password Reset
  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!resetPwTargetUser) return;
    setError("");
    setSuccessMsg("");

    if (!resetNewPassword || resetNewPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        password: resetNewPassword,
        mustChangePassword: resetMustChange,
      };
      await API.put(`/users/${resetPwTargetUser._id}`, payload);
      setSuccessMsg(`Password reset successfully for ${resetPwTargetUser.username} ✅`);
      setIsResetPwModalOpen(false);
      setResetPwTargetUser(null);
      setResetNewPassword("");
      setResetMustChange(true);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reset user password.");
    } finally {
      setSubmitting(false);
    }
  };

  // Filtering users
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.username?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase());

    const matchesRole =
      roleFilter === "all" || u.role === roleFilter;

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && u.isActive) ||
      (statusFilter === "inactive" && !u.isActive);

    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div className="view-settings">
      {/* ── HEADER / CONTROLS ─────────────────── */}
      <div className="settings-section" style={{ marginBottom: "20px" }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
          marginBottom: "16px"
        }}>
          <div>
            <h2 className="settings-section-title" style={{ margin: 0 }}>
              {isAdmin ? "Organization User Directory" : "Team Member Management"}
            </h2>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "4px" }}>
              {isAdmin
                ? "Provision managers, employees, and configure hierarchical reporting."
                : "Manage and monitor employee accounts reporting directly to your team."}
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button
              className="icon-btn"
              onClick={fetchUsers}
              disabled={loading}
              title="Refresh User List"
              style={{ display: "flex", alignItems: "center", gap: "6px" }}
            >
              <FiRefreshCw className={loading ? "spinning" : ""} />
              <span className="btn-label">Refresh</span>
            </button>

            <button
              className="settings-save-btn"
              onClick={() => {
                setError("");
                setSuccessMsg("");
                setIsAddModalOpen(true);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 18px",
                borderRadius: "10px",
                cursor: "pointer",
                fontWeight: "700"
              }}
            >
              <FiUserPlus size={18} />
              <span>{isAdmin ? "Add New User" : "Add Team Employee"}</span>
            </button>
          </div>
        </div>

        {/* FEEDBACK BANNERS */}
        {error && (
          <div className="settings-feedback error" style={{ marginBottom: "16px" }}>
            <FiAlertTriangle />
            {error}
          </div>
        )}

        {successMsg && (
          <div className="settings-feedback success" style={{ marginBottom: "16px" }}>
            <FiCheckCircle />
            {successMsg}
          </div>
        )}

        {/* SEARCH & FILTERS BAR */}
        <div className="settings-card" style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: "1 1 240px", backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid var(--border)", borderRadius: "8px", padding: "8px 12px" }}>
            <FiSearch style={{ color: "var(--text-secondary)" }} />
            <input
              type="text"
              placeholder="Search by username or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ background: "transparent", border: "none", color: "var(--text-primary)", outline: "none", width: "100%", fontSize: "13px" }}
            />
          </div>

          {isAdmin && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <FiFilter style={{ color: "var(--text-secondary)", fontSize: "14px" }} />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                style={{
                  backgroundColor: "rgba(255,255,255,0.03)",
                  border: "1px solid var(--border)",
                  color: "var(--text-primary)",
                  borderRadius: "8px",
                  padding: "8px 12px",
                  fontSize: "13px",
                  outline: "none",
                  cursor: "pointer"
                }}
              >
                <option value="all">All Roles</option>
                <option value="manager">Managers Only</option>
                <option value="employee">Employees Only</option>
                <option value="admin">Admins Only</option>
              </select>
            </div>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                backgroundColor: "rgba(255,255,255,0.03)",
                border: "1px solid var(--border)",
                color: "var(--text-primary)",
                borderRadius: "8px",
                padding: "8px 12px",
                fontSize: "13px",
                outline: "none",
                cursor: "pointer"
              }}
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Accounts</option>
              <option value="inactive">Deactivated Accounts</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── USERS TABLE ───────────────────────── */}
      <div className="settings-section">
        <div className="settings-card" style={{ padding: "0", overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)", backgroundColor: "rgba(255,255,255,0.02)", color: "var(--text-secondary)" }}>
                  <th style={{ padding: "14px 18px", fontWeight: "600" }}>User</th>
                  <th style={{ padding: "14px 18px", fontWeight: "600" }}>Email</th>
                  <th style={{ padding: "14px 18px", fontWeight: "600" }}>Role</th>
                  {isAdmin && <th style={{ padding: "14px 18px", fontWeight: "600" }}>Reports To</th>}
                  <th style={{ padding: "14px 18px", fontWeight: "600" }}>Status</th>
                  <th style={{ padding: "14px 18px", fontWeight: "600", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={isAdmin ? 6 : 5} style={{ padding: "36px", textAlign: "center", color: "var(--text-secondary)" }}>
                      {loading ? "Loading users…" : "No users match the search criteria."}
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const isSelf = u.username === currentUserId;
                    return (
                      <tr
                        key={u._id}
                        style={{
                          borderBottom: "1px solid rgba(255,255,255,0.04)",
                          transition: "background 0.2s ease"
                        }}
                      >
                        {/* USERNAME & AVATAR */}
                        <td style={{ padding: "14px 18px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <div
                              style={{
                                width: "32px",
                                height: "32px",
                                borderRadius: "8px",
                                backgroundColor:
                                  u.role === "admin"
                                    ? "rgba(0, 255, 213, 0.15)"
                                    : u.role === "manager"
                                    ? "rgba(56, 189, 248, 0.15)"
                                    : "rgba(148, 163, 184, 0.15)",
                                color:
                                  u.role === "admin"
                                    ? "var(--cyan)"
                                    : u.role === "manager"
                                    ? "#38bdf8"
                                    : "#94a3b8",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontWeight: "700",
                                fontSize: "12px",
                                border: `1px solid ${
                                  u.role === "admin"
                                    ? "rgba(0, 255, 213, 0.3)"
                                    : u.role === "manager"
                                    ? "rgba(56, 189, 248, 0.3)"
                                    : "rgba(148, 163, 184, 0.3)"
                                }`
                              }}
                            >
                              {u.username.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <span style={{ fontWeight: "600", color: "var(--text-primary)" }}>
                                {u.username}
                              </span>
                              {isSelf && (
                                <span style={{ marginLeft: "6px", fontSize: "10px", padding: "2px 6px", borderRadius: "4px", backgroundColor: "rgba(0,255,213,0.1)", color: "var(--cyan)", fontWeight: "700" }}>
                                  YOU
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* EMAIL */}
                        <td style={{ padding: "14px 18px", color: "var(--text-secondary)" }}>
                          {u.email}
                        </td>

                        {/* ROLE BADGE */}
                        <td style={{ padding: "14px 18px" }}>
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              padding: "3px 8px",
                              borderRadius: "6px",
                              fontSize: "11px",
                              fontWeight: "700",
                              textTransform: "uppercase",
                              letterSpacing: "0.5px",
                              backgroundColor:
                                u.role === "admin"
                                  ? "rgba(0, 255, 213, 0.12)"
                                  : u.role === "manager"
                                  ? "rgba(56, 189, 248, 0.12)"
                                  : "rgba(148, 163, 184, 0.12)",
                              color:
                                u.role === "admin"
                                  ? "var(--cyan)"
                                  : u.role === "manager"
                                  ? "#38bdf8"
                                  : "#94a3b8",
                              border: `1px solid ${
                                u.role === "admin"
                                  ? "rgba(0, 255, 213, 0.25)"
                                  : u.role === "manager"
                                  ? "rgba(56, 189, 248, 0.25)"
                                  : "rgba(148, 163, 184, 0.25)"
                              }`
                            }}
                          >
                            {u.role === "admin" && <FiShield size={11} />}
                            {u.role === "manager" && <FiBriefcase size={11} />}
                            {u.role === "employee" && <FiUserCheck size={11} />}
                            {u.role}
                          </span>
                        </td>

                        {/* MANAGER (ADMIN ONLY) */}
                        {isAdmin && (
                          <td style={{ padding: "14px 18px", color: "var(--text-secondary)" }}>
                            {u.role === "employee" ? (
                              u.managerId ? (
                                <span style={{ color: "#38bdf8", fontWeight: "500" }}>
                                  {typeof u.managerId === "object" ? u.managerId.username : u.managerId}
                                </span>
                              ) : (
                                <span style={{ fontStyle: "italic", color: "#64748b" }}>Unassigned</span>
                              )
                            ) : (
                              <span style={{ color: "#475569" }}>—</span>
                            )}
                          </td>
                        )}

                        {/* STATUS */}
                        <td style={{ padding: "14px 18px" }}>
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              padding: "3px 8px",
                              borderRadius: "6px",
                              fontSize: "11px",
                              fontWeight: "700",
                              backgroundColor: u.isActive ? "var(--safe-bg)" : "var(--dangerous-bg)",
                              color: u.isActive ? "var(--safe)" : "var(--dangerous)",
                              border: `1px solid ${u.isActive ? "rgba(16, 185, 129, 0.3)" : "rgba(239, 68, 68, 0.3)"}`
                            }}
                          >
                            {u.isActive ? <FiCheck size={12} /> : <FiX size={12} />}
                            {u.isActive ? "Active" : "Deactivated"}
                          </span>
                        </td>

                        {/* ACTIONS */}
                        <td style={{ padding: "14px 18px", textAlign: "right" }}>
                          <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                            {/* Reassign Manager (Admin on Employees) */}
                            {isAdmin && u.role === "employee" && (
                              <button
                                className="icon-btn"
                                onClick={() => {
                                  setReassignTargetUser(u);
                                  setSelectedManagerId(
                                    u.managerId ? (typeof u.managerId === "object" ? u.managerId._id : u.managerId) : ""
                                  );
                                  setIsReassignModalOpen(true);
                                }}
                                title="Assign / Reassign Manager"
                                style={{ padding: "6px 10px", fontSize: "11px", borderRadius: "6px" }}
                              >
                                Assign Manager
                              </button>
                            )}

                            {/* Reset Password (Admin only, on non-self users) */}
                            {isAdmin && !isSelf && (
                              <button
                                className="icon-btn"
                                onClick={() => {
                                  setError("");
                                  setSuccessMsg("");
                                  setResetPwTargetUser(u);
                                  setResetNewPassword("");
                                  setResetMustChange(true);
                                  setIsResetPwModalOpen(true);
                                }}
                                title="Reset User Password"
                                style={{
                                  padding: "6px 10px",
                                  fontSize: "11px",
                                  borderRadius: "6px",
                                  color: "var(--cyan)"
                                }}
                              >
                                <FiKey size={12} style={{ marginRight: "4px" }} />
                                Reset Pw
                              </button>
                            )}

                            {/* Toggle Active / Deactivate */}
                            {!isSelf && (
                              <button
                                className="icon-btn"
                                onClick={() => handleToggleStatus(u)}
                                title={u.isActive ? "Deactivate Account" : "Activate Account"}
                                style={{
                                  padding: "6px 10px",
                                  fontSize: "11px",
                                  borderRadius: "6px",
                                  color: u.isActive ? "var(--dangerous)" : "var(--safe)"
                                }}
                              >
                                {u.isActive ? (
                                  <>
                                    <FiUserX size={12} style={{ marginRight: "4px" }} />
                                    Deactivate
                                  </>
                                ) : (
                                  <>
                                    <FiUserCheck size={12} style={{ marginRight: "4px" }} />
                                    Activate
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── CREATE USER MODAL ─────────────────── */}
      {isAddModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(2, 8, 23, 0.85)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 999,
            padding: "20px"
          }}
        >
          <div
            className="settings-card"
            style={{
              width: "100%",
              maxWidth: "480px",
              padding: "28px",
              borderRadius: "16px",
              border: "1px solid var(--border-active)",
              boxShadow: "0 20px 40px rgba(0,0,0,0.6)"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <FiUserPlus className="sec-icon" style={{ color: "var(--cyan)" }} />
                <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: "var(--text-primary)" }}>
                  {isAdmin ? "Provision New Account" : "Add Team Employee"}
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                style={{ background: "transparent", border: "none", color: "var(--text-secondary)", cursor: "pointer", fontSize: "18px" }}
              >
                <FiX />
              </button>
            </div>

            <form onSubmit={handleCreateUser}>
              {/* ROLE SELECTOR (ADMIN ONLY) */}
              {isAdmin && (
                <div className="settings-field" style={{ marginBottom: "16px" }}>
                  <label>Account Role</label>
                  <div style={{ display: "flex", gap: "10px", marginTop: "6px" }}>
                    <button
                      type="button"
                      onClick={() => setNewRole("manager")}
                      style={{
                        flex: 1,
                        padding: "10px",
                        borderRadius: "8px",
                        border: `1px solid ${newRole === "manager" ? "var(--cyan)" : "var(--border)"}`,
                        backgroundColor: newRole === "manager" ? "rgba(0,255,213,0.12)" : "rgba(255,255,255,0.02)",
                        color: newRole === "manager" ? "var(--cyan)" : "var(--text-secondary)",
                        fontWeight: "700",
                        cursor: "pointer"
                      }}
                    >
                      Manager
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewRole("employee")}
                      style={{
                        flex: 1,
                        padding: "10px",
                        borderRadius: "8px",
                        border: `1px solid ${newRole === "employee" ? "#38bdf8" : "var(--border)"}`,
                        backgroundColor: newRole === "employee" ? "rgba(56,189,248,0.12)" : "rgba(255,255,255,0.02)",
                        color: newRole === "employee" ? "#38bdf8" : "var(--text-secondary)",
                        fontWeight: "700",
                        cursor: "pointer"
                      }}
                    >
                      Employee
                    </button>
                  </div>
                </div>
              )}

              {/* USERNAME */}
              <div className="settings-field" style={{ marginBottom: "16px" }}>
                <label>Username</label>
                <div className="field-input" style={{ marginTop: "6px" }}>
                  <FiUsers />
                  <input
                    type="text"
                    placeholder="e.g. jdoe"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* EMAIL */}
              <div className="settings-field" style={{ marginBottom: "16px" }}>
                <label>Email Address</label>
                <div className="field-input" style={{ marginTop: "6px" }}>
                  <FiMail />
                  <input
                    type="email"
                    placeholder="user@example.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* PASSWORD */}
              <div className="settings-field" style={{ marginBottom: "16px" }}>
                <label>Initial Password (Min 8 characters)</label>
                <div className="field-input" style={{ marginTop: "6px" }}>
                  <FiLock />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* ASSIGN MANAGER (ADMIN ONLY FOR EMPLOYEES) */}
              {isAdmin && newRole === "employee" && (
                <div className="settings-field" style={{ marginBottom: "20px" }}>
                  <label>Assign to Manager (Optional)</label>
                  <select
                    value={newManagerId}
                    onChange={(e) => setNewManagerId(e.target.value)}
                    style={{
                      width: "100%",
                      marginTop: "6px",
                      backgroundColor: "rgba(255,255,255,0.03)",
                      border: "1px solid var(--border)",
                      color: "var(--text-primary)",
                      borderRadius: "8px",
                      padding: "10px 14px",
                      fontSize: "13px",
                      outline: "none"
                    }}
                  >
                    <option value="">No Manager (Unassigned)</option>
                    {availableManagers.map((m) => (
                      <option key={m._id} value={m._id}>
                        {m.username} ({m.email})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* MODAL ACTIONS */}
              <div style={{ display: "flex", gap: "10px", marginTop: "24px" }}>
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => setIsAddModalOpen(false)}
                  style={{ flex: 1, padding: "10px", borderRadius: "8px" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="settings-save-btn"
                  disabled={submitting}
                  style={{ flex: 1, padding: "10px", borderRadius: "8px" }}
                >
                  {submitting ? "Creating…" : "Create Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── REASSIGN MANAGER MODAL (ADMIN ONLY) ── */}
      {isReassignModalOpen && reassignTargetUser && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(2, 8, 23, 0.85)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 999,
            padding: "20px"
          }}
        >
          <div
            className="settings-card"
            style={{
              width: "100%",
              maxWidth: "440px",
              padding: "26px",
              borderRadius: "16px",
              border: "1px solid var(--border-active)",
              boxShadow: "0 20px 40px rgba(0,0,0,0.6)"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "var(--text-primary)" }}>
                Assign Manager for {reassignTargetUser.username}
              </h3>
              <button
                onClick={() => setIsReassignModalOpen(false)}
                style={{ background: "transparent", border: "none", color: "var(--text-secondary)", cursor: "pointer", fontSize: "18px" }}
              >
                <FiX />
              </button>
            </div>

            <form onSubmit={handleReassignSubmit}>
              <div className="settings-field" style={{ marginBottom: "20px" }}>
                <label>Select Manager</label>
                <select
                  value={selectedManagerId}
                  onChange={(e) => setSelectedManagerId(e.target.value)}
                  style={{
                    width: "100%",
                    marginTop: "6px",
                    backgroundColor: "rgba(255,255,255,0.03)",
                    border: "1px solid var(--border)",
                    color: "var(--text-primary)",
                    borderRadius: "8px",
                    padding: "10px 14px",
                    fontSize: "13px",
                    outline: "none"
                  }}
                >
                  <option value="">No Manager (Unassigned)</option>
                  {availableManagers.map((m) => (
                    <option key={m._id} value={m._id}>
                      {m.username} ({m.email})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => setIsReassignModalOpen(false)}
                  style={{ flex: 1, padding: "10px", borderRadius: "8px" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="settings-save-btn"
                  disabled={submitting}
                  style={{ flex: 1, padding: "10px", borderRadius: "8px" }}
                >
                  {submitting ? "Saving…" : "Save Assignment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── RESET PASSWORD MODAL (ADMIN ONLY) ── */}
      {isResetPwModalOpen && resetPwTargetUser && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(2, 8, 23, 0.85)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 999,
            padding: "20px"
          }}
        >
          <div
            className="settings-card"
            style={{
              width: "100%",
              maxWidth: "440px",
              padding: "26px",
              borderRadius: "16px",
              border: "1px solid var(--border-active)",
              boxShadow: "0 20px 40px rgba(0,0,0,0.6)"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <FiKey className="sec-icon" style={{ color: "var(--cyan)" }} />
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "var(--text-primary)" }}>
                  Reset Password for {resetPwTargetUser.username}
                </h3>
              </div>
              <button
                onClick={() => setIsResetPwModalOpen(false)}
                style={{ background: "transparent", border: "none", color: "var(--text-secondary)", cursor: "pointer", fontSize: "18px" }}
              >
                <FiX />
              </button>
            </div>

            <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "16px" }}>
              Set a temporary password for this {resetPwTargetUser.role}. The user will be required to change it upon next login.
            </p>

            <form onSubmit={handleResetPasswordSubmit}>
              <div className="settings-field" style={{ marginBottom: "16px" }}>
                <label>New Temporary Password (Min 8 chars)</label>
                <div className="field-input" style={{ marginTop: "6px" }}>
                  <FiLock />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={resetNewPassword}
                    onChange={(e) => setResetNewPassword(e.target.value)}
                    required
                    minLength={8}
                    autoFocus
                  />
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
                <input
                  type="checkbox"
                  id="mustChangePwCheckbox"
                  checked={resetMustChange}
                  onChange={(e) => setResetMustChange(e.target.checked)}
                  style={{ accentColor: "var(--cyan)", cursor: "pointer" }}
                />
                <label htmlFor="mustChangePwCheckbox" style={{ fontSize: "12px", color: "var(--text-primary)", cursor: "pointer" }}>
                  Require password change on next login
                </label>
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => setIsResetPwModalOpen(false)}
                  style={{ flex: 1, padding: "10px", borderRadius: "8px" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="settings-save-btn"
                  disabled={submitting || resetNewPassword.length < 8}
                  style={{ flex: 1, padding: "10px", borderRadius: "8px" }}
                >
                  {submitting ? "Resetting…" : "Reset Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserManagementView;
