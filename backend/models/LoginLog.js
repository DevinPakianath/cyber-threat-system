const mongoose = require("mongoose");

const LoginLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true
    },

    timestamp: {
      type: Date,
      default: Date.now,
      index: true
    },

    ip: {
      type: String,
      required: true
    },

    location: {
      type: String,
      default: "Unknown"
    },

    loginStatus: {
      type: String,
      enum: ["success", "failed"],
      required: true
    },

    riskStatus: {
      type: String,
      enum: ["Safe", "Suspicious", "Dangerous"],
      required: true
    },

    riskScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    }
  },
  { timestamps: false }
);

module.exports = mongoose.model("LoginLog", LoginLogSchema);
