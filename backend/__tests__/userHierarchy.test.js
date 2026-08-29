const request = require("supertest");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const express = require("express");

process.env.JWT_SECRET = "test-secret-key-12345678901234567890123456789012";

// Mock User model with constructor simulation
jest.mock("../models/User", () => {
  function MockUser(data) {
    Object.assign(this, data);
    this._id = this._id || new (require("mongoose").Types.ObjectId)();
    this.createdAt = this.createdAt || new Date();
    this.save = jest.fn().mockResolvedValue(this);
  }
  MockUser.findOne = jest.fn();
  MockUser.findById = jest.fn();
  MockUser.find = jest.fn();
  return MockUser;
});
const User = require("../models/User");

// Build test app mounting userRoutes
const userRoutes = require("../routes/userRoutes");
const app = express();
app.use(express.json());
app.use("/api/users", userRoutes);

function makeToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" });
}

const adminId = new mongoose.Types.ObjectId().toString();
const manager1Id = new mongoose.Types.ObjectId().toString();
const manager2Id = new mongoose.Types.ObjectId().toString();
const employee1Id = new mongoose.Types.ObjectId().toString();

const adminToken = makeToken({ id: adminId, email: "admin@cti.com", username: "admin", role: "admin" });
const manager1Token = makeToken({ id: manager1Id, email: "manager1@cti.com", username: "manager1", role: "manager" });
const manager2Token = makeToken({ id: manager2Id, email: "manager2@cti.com", username: "manager2", role: "manager" });
const employeeToken = makeToken({ id: employee1Id, email: "emp@cti.com", username: "emp", role: "employee" });

beforeEach(() => {
  jest.clearAllMocks();
});

describe("User Hierarchy & Permissions (Phase 2B)", () => {

  // ==========================================================================
  // 1. ROUTE ACCESS CONTROL & PERMISSIONS
  // ==========================================================================
  describe("Route Access Control", () => {
    test("rejects unauthenticated requests (401)", async () => {
      const res = await request(app).get("/api/users");
      expect(res.status).toBe(401);
      expect(res.body.message).toContain("Not authorized");
    });

    test("rejects employee from accessing user management GET (403)", async () => {
      const res = await request(app)
        .get("/api/users")
        .set("Authorization", `Bearer ${employeeToken}`);
      expect(res.status).toBe(403);
      expect(res.body.message).toContain("Access denied");
    });

    test("rejects employee from creating any user (403)", async () => {
      const res = await request(app)
        .post("/api/users")
        .set("Authorization", `Bearer ${employeeToken}`)
        .send({ username: "newbie", email: "newbie@cti.com", password: "password123" });
      expect(res.status).toBe(403);
    });

    test("rejects employee from updating any user or role (403)", async () => {
      const res = await request(app)
        .put(`/api/users/${employee1Id}`)
        .set("Authorization", `Bearer ${employeeToken}`)
        .send({ role: "admin" });
      expect(res.status).toBe(403);
    });
  });

  // ==========================================================================
  // 2. ADMIN USER CREATION
  // ==========================================================================
  describe("Admin Capabilities", () => {
    test("admin can create a manager account (password hashed, not exposed)", async () => {
      User.findOne.mockResolvedValue(null);

      const res = await request(app)
        .post("/api/users")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          username: "newmgr",
          email: "newmgr@cti.com",
          password: "SecurePassword123",
          role: "manager"
        });

      expect(res.status).toBe(201);
      expect(res.body.user.role).toBe("manager");
      expect(res.body.user.password).toBeUndefined(); // never expose password
      expect(res.body.message).toContain("created successfully");
    });

    test("admin can create an employee assigned to a manager", async () => {
      User.findOne.mockResolvedValue(null);
      User.findById.mockResolvedValue({
        _id: manager1Id,
        username: "manager1",
        role: "manager"
      });

      const res = await request(app)
        .post("/api/users")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          username: "emp1",
          email: "emp1@cti.com",
          password: "SecurePassword123",
          role: "employee",
          managerId: manager1Id
        });

      expect(res.status).toBe(201);
      expect(res.body.user.role).toBe("employee");
      expect(res.body.user.managerId).toBe(manager1Id);
      expect(res.body.user.password).toBeUndefined();
    });

    test("admin cannot assign an employee to a non-existent or non-manager user", async () => {
      User.findOne.mockResolvedValue(null);
      User.findById.mockResolvedValue(null); // manager not found

      const res = await request(app)
        .post("/api/users")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          username: "emp1",
          email: "emp1@cti.com",
          password: "SecurePassword123",
          role: "employee",
          managerId: new mongoose.Types.ObjectId().toString()
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain("does not exist or is not a Manager");
    });

    test("admin cannot create an admin account via user provisioning (400)", async () => {
      User.findOne.mockResolvedValue(null);

      const res = await request(app)
        .post("/api/users")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          username: "another_admin",
          email: "admin2@cti.com",
          password: "SecurePassword123",
          role: "admin"
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain("Admins can create 'manager' and 'employee' accounts");
    });

    test("admin cannot create user with duplicate email (400)", async () => {
      User.findOne.mockResolvedValue({ _id: "existing_id", email: "dup@cti.com" });

      const res = await request(app)
        .post("/api/users")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          username: "duplicate",
          email: "dup@cti.com",
          password: "SecurePassword123",
          role: "employee"
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain("already exists");
    });

    test("admin cannot create user with password shorter than 8 chars (400)", async () => {
      const res = await request(app)
        .post("/api/users")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          username: "shortpw",
          email: "shortpw@cti.com",
          password: "short",
          role: "employee"
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain("Password must be at least 8 characters");
    });
  });

  // ==========================================================================
  // 3. MANAGER USER CREATION
  // ==========================================================================
  describe("Manager Capabilities & Restrictions", () => {
    test("manager can create an employee (auto-assigned to this manager)", async () => {
      User.findOne.mockResolvedValue(null);

      const res = await request(app)
        .post("/api/users")
        .set("Authorization", `Bearer ${manager1Token}`)
        .send({
          username: "team_emp",
          email: "team_emp@cti.com",
          password: "SecurePassword123"
        });

      expect(res.status).toBe(201);
      expect(res.body.user.role).toBe("employee");
      expect(res.body.user.managerId).toBe(manager1Id);
      expect(res.body.user.password).toBeUndefined();
    });

    test("manager CANNOT create a manager account (403)", async () => {
      const res = await request(app)
        .post("/api/users")
        .set("Authorization", `Bearer ${manager1Token}`)
        .send({
          username: "attempt_mgr",
          email: "attempt_mgr@cti.com",
          password: "SecurePassword123",
          role: "manager"
        });

      expect(res.status).toBe(403);
      expect(res.body.message).toContain("Managers are not authorized");
    });

    test("manager CANNOT create an admin account (403)", async () => {
      const res = await request(app)
        .post("/api/users")
        .set("Authorization", `Bearer ${manager1Token}`)
        .send({
          username: "attempt_admin",
          email: "attempt_admin@cti.com",
          password: "SecurePassword123",
          role: "admin"
        });

      expect(res.status).toBe(403);
    });
  });

  // ==========================================================================
  // 4. USER RETRIEVAL & HIERARCHY SCOPING
  // ==========================================================================
  describe("User Retrieval Scoping", () => {
    test("manager GET /api/users queries ONLY their assigned employees", async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue([
          { _id: "e1", username: "emp1", role: "employee", managerId: manager1Id }
        ])
      };
      User.find.mockReturnValue(mockQuery);

      const res = await request(app)
        .get("/api/users")
        .set("Authorization", `Bearer ${manager1Token}`);

      expect(res.status).toBe(200);
      expect(User.find).toHaveBeenCalledWith({
        managerId: manager1Id,
        role: "employee"
      });
      expect(res.body.count).toBe(1);
    });

    test("manager CANNOT view an employee belonging to another manager via GET /:id (403)", async () => {
      User.findById.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        populate: jest.fn().mockResolvedValue({
          _id: new mongoose.Types.ObjectId("665000000000000000000099"),
          username: "other_emp",
          role: "employee",
          managerId: { _id: new mongoose.Types.ObjectId(manager2Id) } // belongs to manager2
        })
      });

      const res = await request(app)
        .get("/api/users/665000000000000000000099")
        .set("Authorization", `Bearer ${manager1Token}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toContain("Access denied");
    });
  });

  // ==========================================================================
  // 5. USER UPDATE & PERMISSION INTEGRITY
  // ==========================================================================
  describe("User Updates & Restrictions", () => {
    test("manager CANNOT promote their employee to manager (403)", async () => {
      const empId = new mongoose.Types.ObjectId();
      User.findById.mockResolvedValue({
        _id: empId,
        username: "my_emp",
        role: "employee",
        managerId: new mongoose.Types.ObjectId(manager1Id),
        save: jest.fn()
      });

      const res = await request(app)
        .put(`/api/users/${empId}`)
        .set("Authorization", `Bearer ${manager1Token}`)
        .send({ role: "manager" });

      expect(res.status).toBe(403);
      expect(res.body.message).toContain("cannot change user roles");
    });

    test("manager CANNOT reassign their employee to another manager (403)", async () => {
      const empId = new mongoose.Types.ObjectId();
      User.findById.mockResolvedValue({
        _id: empId,
        username: "my_emp",
        role: "employee",
        managerId: new mongoose.Types.ObjectId(manager1Id),
        save: jest.fn()
      });

      const res = await request(app)
        .put(`/api/users/${empId}`)
        .set("Authorization", `Bearer ${manager1Token}`)
        .send({ managerId: manager2Id });

      expect(res.status).toBe(403);
      expect(res.body.message).toContain("cannot reassign employees");
    });

    test("admin can activate/deactivate a user and change manager assignment", async () => {
      const empId = new mongoose.Types.ObjectId();
      const mockSave = jest.fn().mockResolvedValue(true);
      User.findById.mockImplementation((id) => {
        if (id.toString() === manager2Id) {
          return Promise.resolve({ _id: manager2Id, role: "manager" });
        }
        return Promise.resolve({
          _id: empId,
          username: "target_emp",
          role: "employee",
          isActive: true,
          managerId: manager1Id,
          save: mockSave
        });
      });

      const res = await request(app)
        .put(`/api/users/${empId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          isActive: false,
          managerId: manager2Id
        });

      expect(res.status).toBe(200);
      expect(mockSave).toHaveBeenCalled();
      expect(res.body.message).toContain("updated successfully");
    });

    test("admin cannot deactivate their own account (400)", async () => {
      User.findById.mockResolvedValue({
        _id: new mongoose.Types.ObjectId(adminId),
        role: "admin",
        isActive: true,
        save: jest.fn()
      });

      const res = await request(app)
        .put(`/api/users/${adminId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ isActive: false });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain("Admins cannot deactivate their own account");
    });

    test("admin cannot demote their own role (400)", async () => {
      User.findById.mockResolvedValue({
        _id: new mongoose.Types.ObjectId(adminId),
        role: "admin",
        isActive: true,
        save: jest.fn()
      });

      const res = await request(app)
        .put(`/api/users/${adminId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ role: "employee" });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain("cannot change your own admin role");
    });
  });

});
