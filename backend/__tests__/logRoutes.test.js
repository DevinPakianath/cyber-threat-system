const request = require("supertest");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const express = require("express");

process.env.JWT_SECRET = "test-secret-key-12345678901234567890123456789012";

// Mock LoginLog and User models
jest.mock("../models/LoginLog");
jest.mock("../models/User");
const LoginLog = require("../models/LoginLog");
const User = require("../models/User");

// Build test app mounting logRoutes
const logRoutes = require("../routes/logRoutes");
const app = express();
app.use(express.json());
app.use("/api/logs", logRoutes);

function makeToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" });
}

const adminId = new mongoose.Types.ObjectId().toString();
const manager1Id = new mongoose.Types.ObjectId().toString();
const manager2Id = new mongoose.Types.ObjectId().toString();
const employee1Id = new mongoose.Types.ObjectId().toString();
const employee2Id = new mongoose.Types.ObjectId().toString();

const adminToken = makeToken({ id: adminId, email: "admin@cti.com", username: "admin", role: "admin" });
const manager1Token = makeToken({ id: manager1Id, email: "manager1@cti.com", username: "manager1", role: "manager" });
const employeeToken = makeToken({ id: employee1Id, email: "emp@cti.com", username: "emp", role: "employee" });

beforeEach(() => {
  jest.clearAllMocks();
});

describe("CTI Log Scoping (Phase 2C-B)", () => {

  test("rejects unauthenticated requests (401)", async () => {
    const res = await request(app).get("/api/logs");
    expect(res.status).toBe(401);
    expect(res.body.message).toContain("Not authorized");
  });

  test("rejects employee from accessing CTI logs (403)", async () => {
    const res = await request(app)
      .get("/api/logs")
      .set("Authorization", `Bearer ${employeeToken}`);
    expect(res.status).toBe(403);
    expect(res.body.message).toContain("Access denied");
  });

  test("admin receives all organization logs with safe user info", async () => {
    const mockLogs = [
      {
        _id: "log1",
        ip: "192.168.1.1",
        location: "Local",
        loginStatus: "success",
        riskStatus: "Safe",
        riskScore: 0,
        timestamp: new Date(),
        userId: { _id: employee1Id, username: "emp1", email: "emp1@cti.com", role: "employee" }
      },
      {
        _id: "log2",
        ip: "203.0.113.5",
        location: "London, UK",
        loginStatus: "failed",
        riskStatus: "Dangerous",
        riskScore: 70,
        timestamp: new Date(),
        userId: null // orphan attempt
      }
    ];

    const mockQuery = {
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue(mockLogs)
    };

    LoginLog.find.mockReturnValue(mockQuery);
    LoginLog.countDocuments.mockResolvedValue(2);

    const res = await request(app)
      .get("/api/logs")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(LoginLog.find).toHaveBeenCalledWith({});
    expect(res.body.logs.length).toBe(2);
    expect(res.body.logs[0].userId.username).toBe("emp1");
    expect(res.body.logs[0].userId.password).toBeUndefined(); // never expose password
    expect(res.body.logs[1].userId).toBeNull(); // handled null safely
  });

  test("manager receives ONLY own logs and assigned employee logs", async () => {
    // Manager 1 manages employee 1
    User.find.mockReturnValue({
      select: jest.fn().mockResolvedValue([{ _id: employee1Id }])
    });

    const mockLogs = [
      {
        _id: "log1",
        ip: "192.168.1.1",
        loginStatus: "success",
        riskStatus: "Safe",
        riskScore: 0,
        timestamp: new Date(),
        userId: { _id: employee1Id, username: "emp1", email: "emp1@cti.com", role: "employee" }
      }
    ];

    const mockQuery = {
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue(mockLogs)
    };

    LoginLog.find.mockReturnValue(mockQuery);
    LoginLog.countDocuments.mockResolvedValue(1);

    const res = await request(app)
      .get("/api/logs")
      .set("Authorization", `Bearer ${manager1Token}`);

    expect(res.status).toBe(200);
    expect(User.find).toHaveBeenCalledWith({ managerId: manager1Id, role: "employee" });
    expect(LoginLog.find).toHaveBeenCalledWith({
      userId: { $in: [manager1Id, employee1Id] }
    });
    expect(res.body.logs.length).toBe(1);
  });

  test("manager cannot query logs of another manager's employee (403)", async () => {
    // Manager 1 manages only employee 1
    User.find.mockReturnValue({
      select: jest.fn().mockResolvedValue([{ _id: employee1Id }])
    });

    // Manager 1 attempts to query logs for employee 2 (belonging to Manager 2)
    const res = await request(app)
      .get(`/api/logs?userId=${employee2Id}`)
      .set("Authorization", `Bearer ${manager1Token}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toContain("outside your assigned team");
  });

});
