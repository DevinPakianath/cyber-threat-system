const jwt = require("jsonwebtoken");
const LoginLog = require("../models/LoginLog");
const User = require("../models/User");
const bcrypt = require("bcrypt");

const { getLocation } = require("../services/geoService");
const { analyzeLogin } = require("../services/threatEngine");

// =========================
// REGISTER
// =========================
const register = async (req, res) => {

  try {

    const { username, email, password } = req.body;

    const existingUser = await User.findOne({ email });

    if (existingUser) {

      return res.status(400).json({
        message: "User already exists ❌"
      });

    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      username,
      email,
      password: hashedPassword
    });

    await user.save();

    res.json({
      message: "User registered successfully ✅"
    });

  } catch (error) {
    console.error("register error:", error);
    res.status(500).json({ message: "Internal server error" });
  }

};

// =========================
// LOGIN + CTI ANALYSIS
// =========================
const login = async (req, res) => {

  try {

    const { email, password } = req.body;

    // =========================
    // GET REAL IP
    // =========================
    let ip =
      req.headers["x-forwarded-for"] ||
      req.socket.remoteAddress ||
      req.ip ||
      "Unknown";

    // CLEAN IPV6
    if (ip === "::1") {

      ip = "127.0.0.1";

    }

    if (ip.includes("::ffff:")) {

      ip = ip.replace("::ffff:", "");

    }

    // =========================
    // GET USER
    // =========================
    const user = await User.findOne({ email });

    // =========================
    // GEO LOCATION
    // =========================
    const location = await getLocation(ip);

    // =========================
    // USER NOT FOUND
    // =========================
    if (!user) {

      await LoginLog.create({

        userId: null,

        timestamp: new Date(),

        ip,

        location,

        loginStatus: "failed",

        riskStatus: "Dangerous",

        riskScore: 50

      });

      return res.status(400).json({
        message: "Invalid credentials ❌"
      });

    }

    // =========================
    // CHECK PASSWORD
    // =========================
    const isMatch = await bcrypt.compare(
      password,
      user.password
    );

    const currentStatus =
      isMatch ? "success" : "failed";

    // =========================
    // ANALYZE LOGIN
    // =========================
    const { riskScore, status } =
      await analyzeLogin(

        user._id,
        ip,
        new Date(),
        currentStatus

      );

    // =========================
    // SAVE LOGIN LOG
    // =========================
    await LoginLog.create({

      userId: user._id,

      timestamp: new Date(),

      ip,

      location,

      loginStatus: currentStatus,

      riskStatus: status,

      riskScore

    });

    // =========================
    // WRONG PASSWORD
    // =========================
    if (!isMatch) {

      return res.status(400).json({
        message: "Invalid credentials ❌"
      });

    }

    // =========================
    // ISSUE JWT
    // =========================
    const token = jwt.sign(
      { id: user._id, email: user.email, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "24h" }
    );

    // =========================
    // SUCCESS
    // =========================
    res.json({

      message: "Login successful ✅",

      token,

      username: user.username,

      email: user.email

    });

  } catch (error) {
    console.error("login error:", error);
    res.status(500).json({ message: "Internal server error" });
  }

};

// =========================
// CHANGE PASSWORD
// =========================
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword || newPassword.length < 8) {
      return res.status(400).json({ message: "New password must be at least 8 characters" });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ message: "Current password is incorrect ❌" });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: "Password updated successfully ✅" });
  } catch (error) {
    console.error("changePassword error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// =========================
// EXPORT
// =========================
module.exports = {

  register,
  login,
  changePassword

};