const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");

const { register, login, changePassword } = require("../controllers/authController");
const { validateRegister, validateLogin } = require("../middleware/validate");
const protect = require("../middleware/authMiddleware");

// Strict limiter for login — 10 attempts per 15 min per IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: "Too many login attempts. Try again in 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Looser limiter for registration — 5 accounts per hour per IP
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { message: "Too many accounts created from this IP. Try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/register",  registerLimiter, validateRegister, register);
router.post("/login",     loginLimiter,    validateLogin,    login);
router.put("/password",   protect,                           changePassword);

module.exports = router;
