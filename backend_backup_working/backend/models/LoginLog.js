const mongoose = require("mongoose");

const LoginLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  timestamp: {
    type: Date,
    default: Date.now
  },

  ip: {
    type: String
  },

  location: {
    type: String
  },

  // 🔐 ACTUAL LOGIN RESULT
  loginStatus: {
    type: String, // "success" / "failed"
    required: true
  },

  // 🧠 ANOMALY RESULT
  riskStatus: {
    type: String, // "Safe" / "Suspicious" / "Dangerous"
    required: true
  },

  riskScore: {
    type: Number,
    default: 0
  }
});

module.exports = mongoose.model("LoginLog", LoginLogSchema);