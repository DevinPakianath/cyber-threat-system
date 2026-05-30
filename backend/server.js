require("dotenv").config();
const express = require("express");
const cors    = require("cors");
const helmet  = require("helmet");
const connectDB = require("./config/db");

const app = express();

// =========================
// TRUST PROXY
// Trust exactly one hop (nginx / cloud LB). "true" would allow IP spoofing.
// =========================
app.set("trust proxy", 1);

// =========================
// HTTPS REDIRECT (production only)
// Redirect plain-HTTP requests that arrive via a proxy that sets X-Forwarded-Proto.
// =========================
if (process.env.NODE_ENV === "production") {
  app.use((req, res, next) => {
    if (req.headers["x-forwarded-proto"] === "http") {
      return res.redirect(301, `https://${req.headers.host}${req.url}`);
    }
    next();
  });
}

// =========================
// SECURITY HEADERS
// =========================
app.use(helmet());

// =========================
// CORS — allow only explicitly listed origins
// =========================
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map(o => o.trim())
  : [];

if (process.env.NODE_ENV !== "production") {
  allowedOrigins.push("http://localhost:3000");
}

app.use(cors({
  origin: (origin, callback) => {
    // Allow server-to-server / health-check calls with no Origin header
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin '${origin}' not allowed`));
  },
  credentials: true,
}));

// =========================
// BODY PARSING
// =========================
app.use(express.json({ limit: "16kb" }));

// =========================
// ROUTES
// =========================
const authRoutes = require("./routes/authRoutes");
const logRoutes  = require("./routes/logRoutes");

app.use("/api/auth", authRoutes);
app.use("/api/logs", logRoutes);

// =========================
// HEALTH CHECK
// =========================
app.get("/health", (req, res) => res.json({ status: "ok" }));

// =========================
// ROOT
// =========================
app.get("/", (req, res) => res.send("Server is running"));

// =========================
// GLOBAL ERROR HANDLER
// =========================
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err.message?.startsWith("CORS:")) {
    return res.status(403).json({ message: "CORS policy violation" });
  }
  console.error(err);
  res.status(500).json({ message: "Internal server error" });
});

// =========================
// START SERVER
// =========================
const startServer = async () => {
  try {
    await connectDB();
  } catch {
    console.error("Failed to connect to database. Shutting down.");
    process.exit(1);
  }

  const PORT = process.env.PORT || 5000;
  const server = app.listen(PORT, () => {
    console.log(`Server started on port ${PORT} [${process.env.NODE_ENV || "development"}]`);
  });

  // Graceful shutdown
  const shutdown = (signal) => {
    console.log(`${signal} received — shutting down gracefully`);
    server.close(() => {
      console.log("HTTP server closed");
      process.exit(0);
    });
    // Force exit if close takes too long
    setTimeout(() => process.exit(1), 10000).unref();
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT",  () => shutdown("SIGINT"));
};

startServer();

module.exports = app; // exported for tests
