const request = require("supertest");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const express = require("express");

process.env.JWT_SECRET = "test-secret-key-12345678901234567890123456789012";

// Mock User & LoginLog models
jest.mock("../models/User");
jest.mock("../models/LoginLog");
jest.mock("../services/geoService", () => ({
  getLocation: jest.fn().mockResolvedValue("Local Test"),
}));
jest.mock("../services/threatEngine", () => ({
  analyzeLogin: jest.fn().mockResolvedValue({ riskScore: 0, status: "Safe" }),
}));

const User = require("../models/User");
const LoginLog = require("../models/LoginLog");
const { login } = require("../controllers/authController");
const userRoutes = require("../routes/userRoutes");
const logRoutes = require("../routes/logRoutes");

// Set up Express test app
const app = express();
app.use(express.json());
app.post("/api/auth/login", login);
app.use("/api/users", userRoutes);
app.use("/api/logs", logRoutes);

describe("Admin Authentication & RBAC Verification", () => {
  const adminDoc = {
    _id: new mongoose.Types.ObjectId("69e881175bb9df5c642f5f87"),
    username: "devin",
    email: "devin@test.com",
    role: "admin",
    isActive: true,
    mustChangePassword: false,
    password: "$2b$10$abcdefghijklmnopqrstuv1234567890123456789012345678901",
    knownIPs: [],
    usualLoginHours: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // =========================================================================
  // 1. ADMIN AUTHENTICATION & JWT VERIFICATION
  // =========================================================================
  describe("Admin Login & JWT Token Claims", () => {
    test("devin@test.com authenticates and receives JWT with role 'admin'", async () => {
      User.findOne.mockResolvedValue(adminDoc);
      LoginLog.create.mockResolvedValue({});
      jest.spyOn(bcrypt, "compare").mockResolvedValue(true);

      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "devin@test.com", password: "ValidPassword123" });

      expect(res.status).toBe(200);
      expect(res.body.message).toContain("Login successful");
      expect(res.body.role).toBe("admin");
      expect(res.body.username).toBe("devin");
      expect(res.body.email).toBe("devin@test.com");
      expect(res.body.mustChangePassword).toBe(false);
      expect(res.body.token).toBeDefined();

      // Verify JWT payload claims
      const decoded = jwt.verify(res.body.token, process.env.JWT_SECRET);
      expect(decoded.id).toBe(adminDoc._id.toString());
      expect(decoded.email).toBe("devin@test.com");
      expect(decoded.username).toBe("devin");
      expect(decoded.role).toBe("admin");
      expect(decoded.mustChangePassword).toBe(false);
    });

    test("inactive user is rejected at login with 403", async () => {
      const inactiveAdmin = { ...adminDoc, isActive: false };
      User.findOne.mockResolvedValue(inactiveAdmin);

      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "devin@test.com", password: "ValidPassword123" });

      expect(res.status).toBe(403);
      expect(res.body.message).toContain("deactivated");
    });
  });

  // =========================================================================
  // 2. ADMIN ACCESS TO PROTECTED ENDPOINTS
  // =========================================================================
  describe("Admin Access to Protected Endpoints", () => {
    const adminToken = jwt.sign(
      { id: adminDoc._id.toString(), email: adminDoc.email, username: adminDoc.username, role: "admin" },
      process.env.JWT_SECRET
    );

    test("admin can access GET /api/users", async () => {
      User.find.mockReturnValue({
        select: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            sort: jest.fn().mockResolvedValue([adminDoc]),
          }),
        }),
      });

      const res = await request(app)
        .get("/api/users")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.users).toBeDefined();
    });

    test("admin can access GET /api/logs", async () => {
      LoginLog.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([]),
      });
      LoginLog.countDocuments.mockResolvedValue(0);

      const res = await request(app)
        .get("/api/logs")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.logs).toBeDefined();
    });
  });

  // =========================================================================
  // 3. ROLE RESTRICTION ENFORCEMENT (MANAGER / EMPLOYEE)
  // =========================================================================
  describe("Role Restriction Enforcement", () => {
    const employeeToken = jwt.sign(
      { id: new mongoose.Types.ObjectId().toString(), email: "emp@test.com", username: "emp", role: "employee" },
      process.env.JWT_SECRET
    );
    const managerToken = jwt.sign(
      { id: new mongoose.Types.ObjectId().toString(), email: "mgr@test.com", username: "mgr", role: "manager" },
      process.env.JWT_SECRET
    );

    test("employee is denied from GET /api/logs with 403", async () => {
      const res = await request(app)
        .get("/api/logs")
        .set("Authorization", `Bearer ${employeeToken}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toContain("Access denied");
    });

    test("employee is denied from GET /api/users with 403", async () => {
      const res = await request(app)
        .get("/api/users")
        .set("Authorization", `Bearer ${employeeToken}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toContain("Access denied");
    });

    test("manager cannot create an admin or manager account (403)", async () => {
      User.findOne.mockResolvedValue(null);

      const res = await request(app)
        .post("/api/users")
        .set("Authorization", `Bearer ${managerToken}`)
        .send({ username: "subadmin", email: "subadmin@cti.com", password: "password123", role: "admin" });

      expect(res.status).toBe(403);
      expect(res.body.message).toContain("Managers are not authorized to create Admin or Manager accounts");
    });
  });
});
