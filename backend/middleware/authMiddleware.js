const jwt = require("jsonwebtoken");

const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Not authorized — no token" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Safe fallback for legacy tokens lacking a role field
    if (!decoded.role) {
      decoded.role = "employee";
    }
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ message: "Token invalid or expired" });
  }
};

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authorized — no user context" });
    }

    const userRole = req.user.role || "employee";
    if (!roles.includes(userRole)) {
      return res.status(403).json({
        message: `Access denied. Role '${userRole}' is not authorized to access this resource.`
      });
    }

    next();
  };
};

protect.protect = protect;
protect.authorizeRoles = authorizeRoles;

module.exports = protect;
module.exports.protect = protect;
module.exports.authorizeRoles = authorizeRoles;
