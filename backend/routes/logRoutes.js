const express = require("express");
const router  = express.Router();
const mongoose = require("mongoose");

const LoginLog = require("../models/LoginLog");
const User     = require("../models/User");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

// GET /api/logs?limit=50&page=1&userId=...&riskStatus=...
// ADMIN: full organization access (all logs)
// MANAGER: access restricted to own logs + assigned team members
// EMPLOYEE: 403 Forbidden
router.get("/", protect, authorizeRoles("admin", "manager"), async (req, res) => {
  try {
    const callerRole = req.user.role || "employee";
    const callerId   = req.user.id;

    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const page  = Math.max(parseInt(req.query.page)  || 1,  1);
    const skip  = (page - 1) * limit;

    let query = {};

    if (callerRole === "admin") {
      // Admin: View all logs, or filter by specific user / manager / riskStatus
      if (req.query.userId && mongoose.Types.ObjectId.isValid(req.query.userId)) {
        query.userId = req.query.userId;
      } else if (req.query.managerId && mongoose.Types.ObjectId.isValid(req.query.managerId)) {
        const teamUsers = await User.find({ managerId: req.query.managerId }).select("_id");
        query.userId = { $in: [req.query.managerId, ...teamUsers.map(u => u._id)] };
      }
    } else if (callerRole === "manager") {
      // Manager: Scope strictly to own ID + assigned employees
      const teamEmployees = await User.find({ managerId: callerId, role: "employee" }).select("_id");
      const allowedUserIds = [callerId, ...teamEmployees.map(u => u._id.toString())];

      // If manager specifically filters by a team member's userId
      if (req.query.userId && mongoose.Types.ObjectId.isValid(req.query.userId)) {
        if (!allowedUserIds.includes(req.query.userId)) {
          return res.status(403).json({
            message: "Access denied. You cannot view logs for users outside your assigned team."
          });
        }
        query.userId = req.query.userId;
      } else {
        query.userId = { $in: allowedUserIds };
      }
    }

    // Optional riskStatus filter (Safe, Suspicious, Dangerous)
    if (req.query.riskStatus && ["Safe", "Suspicious", "Dangerous"].includes(req.query.riskStatus)) {
      query.riskStatus = req.query.riskStatus;
    }

    const [logs, total] = await Promise.all([
      LoginLog.find(query)
        .populate("userId", "username email role")
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit),
      LoginLog.countDocuments(query),
    ]);

    res.json({
      logs,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) || 1 },
    });
  } catch (err) {
    console.error("logs fetch error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
