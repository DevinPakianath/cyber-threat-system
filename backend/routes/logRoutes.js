const express = require("express");
const router  = express.Router();

const LoginLog = require("../models/LoginLog");
const protect  = require("../middleware/authMiddleware");

// GET /api/logs?limit=50&page=1
// Authenticated users see only their own logs, paginated.
router.get("/", protect, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const page  = Math.max(parseInt(req.query.page)  || 1,  1);
    const skip  = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      LoginLog.find({ userId: req.user.id })
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit),
      LoginLog.countDocuments({ userId: req.user.id }),
    ]);

    res.json({
      logs,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error("logs fetch error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
