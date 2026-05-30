const REQUIRED_VARS = [
  "MONGODB_URI",
  "JWT_SECRET",
];

function validateEnv() {
  const missing = REQUIRED_VARS.filter((key) => !process.env[key]);

  if (missing.length === 0) return;

  console.error("=".repeat(60));
  console.error("STARTUP FAILED — missing required environment variables:");
  missing.forEach((key) => console.error(`  • ${key}`));
  console.error("Set these in your .env file (dev) or Render Environment tab (production).");
  console.error("=".repeat(60));
  process.exit(1);
}

module.exports = validateEnv;
