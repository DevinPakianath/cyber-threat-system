const LoginLog = require("../models/LoginLog");

const analyzeLogin = async (userId, ip, timestamp, currentStatus) => {
  let riskScore = 0;

  // 🔥 GET LAST 20 LOGS
  const logs = await LoginLog.find({ userId })
    .sort({ timestamp: -1 })
    .limit(20);

  // 👉 INCLUDE CURRENT ATTEMPT
  const allLogs = [
    { timestamp, ip, loginStatus: currentStatus },
    ...logs
  ];

  // =========================
  // 1. RAPID LOGIN DETECTION (FIXED ONLY THIS PART)
  // =========================
  const recentLogs = allLogs.filter(log => {
    const diff = (new Date(timestamp) - new Date(log.timestamp)) / 1000;
    return diff < 60;
  });

  const attempts = recentLogs.length;

  // 🔥 NEW LOGIC (NO HARD CAP, SMOOTH GROWTH)
  if (attempts >= 2) riskScore += 10;
  if (attempts >= 4) riskScore += 20;
  if (attempts >= 6) riskScore += 30;
  if (attempts >= 8) riskScore += 40;

  // =========================
  // 2. UNKNOWN IP (UNCHANGED)
  // =========================
  const knownIPs = logs.map(log => log.ip);

  if (!knownIPs.includes(ip)) {
    riskScore += 15;
  }

  // =========================
  // 3. BRUTE FORCE (UNCHANGED ✅)
  // =========================
  const lastFewLogs = allLogs.slice(0, 5);

  const failedCount = lastFewLogs.filter(
    log => log.loginStatus === "failed"
  ).length;

  riskScore += failedCount * 10;

  // =========================
  // 4. SUCCESS REDUCE (UNCHANGED ✅)
  // =========================
  if (currentStatus === "success") {
    riskScore -= 25;
  }

  // =========================
  // LIMIT SCORE
  // =========================
  riskScore = Math.max(0, Math.min(100, riskScore));

  // =========================
  // FINAL STATUS
  // =========================
  let status = "Safe";

  if (riskScore >= 60) status = "Dangerous";
  else if (riskScore >= 30) status = "Suspicious";

  return { riskScore, status };
};

module.exports = { analyzeLogin };