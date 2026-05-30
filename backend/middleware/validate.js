const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validateRegister = (req, res, next) => {
  const { username, email, password } = req.body;

  if (!username || typeof username !== "string" ||
      username.trim().length < 2 || username.trim().length > 50) {
    return res.status(400).json({ message: "Username must be 2–50 characters" });
  }

  if (!email || !EMAIL_RE.test(email)) {
    return res.status(400).json({ message: "A valid email is required" });
  }

  if (!password || typeof password !== "string" || password.length < 8) {
    return res.status(400).json({ message: "Password must be at least 8 characters" });
  }

  // Normalise before the controller sees the values
  req.body.username = username.trim();
  req.body.email    = email.toLowerCase().trim();

  next();
};

const validateLogin = (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !EMAIL_RE.test(email)) {
    return res.status(400).json({ message: "A valid email is required" });
  }

  if (!password || typeof password !== "string" || password.length === 0) {
    return res.status(400).json({ message: "Password is required" });
  }

  req.body.email = email.toLowerCase().trim();

  next();
};

module.exports = { validateRegister, validateLogin };
