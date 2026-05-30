const express = require("express");
const router = express.Router();

// ✅ CORRECT IMPORT
const { register, login } = require("../controllers/authController");

// ✅ ROUTES
router.post("/register", register);
router.post("/login", login);

module.exports = router;