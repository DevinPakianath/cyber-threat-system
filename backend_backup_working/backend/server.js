const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const app = express();

// =========================
// TRUST PROXY
// =========================
app.set("trust proxy", true);

// =========================
// MIDDLEWARES
// =========================
app.use(cors());

app.use(express.json());

// =========================
// ROUTES
// =========================
const authRoutes = require("./routes/authRoutes");
const logRoutes = require("./routes/logRoutes");

app.use("/api/auth", authRoutes);

app.use("/api/logs", logRoutes);

// =========================
// TEST ROUTE
// =========================
app.get("/", (req, res) => {

  res.send("Server is running 🚀");

});

// =========================
// START SERVER
// =========================
const startServer = async () => {

  await connectDB();

  app.listen(5000, () => {

    console.log("Server started on port 5000");

  });

};

startServer();