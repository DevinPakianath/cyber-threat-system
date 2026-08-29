const jwt = require("jsonwebtoken");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

process.env.JWT_SECRET = "test-secret-key-12345678901234567890123456789012";

function mockReqRes(headers = {}, user = null) {
  const req = {
    headers: { ...headers },
    user: user ? { ...user } : undefined,
  };
  const res = {
    status(code) {
      this._status = code;
      return this;
    },
    json(data) {
      this._body = data;
      return this;
    },
    _status: 200,
    _body: null,
  };
  const next = jest.fn();
  return { req, res, next };
}

describe("authMiddleware - protect", () => {
  test("rejects request without Authorization header (401)", () => {
    const { req, res, next } = mockReqRes();
    protect(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res._status).toBe(401);
    expect(res._body.message).toContain("Not authorized");
  });

  test("rejects request with invalid Bearer format (401)", () => {
    const { req, res, next } = mockReqRes({ authorization: "Basic 12345" });
    protect(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res._status).toBe(401);
  });

  test("rejects invalid JWT signature (401)", () => {
    const { req, res, next } = mockReqRes({ authorization: "Bearer invalid.jwt.token" });
    protect(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res._status).toBe(401);
  });

  test("accepts valid JWT and injects user with role", () => {
    const token = jwt.sign(
      { id: "u123", email: "admin@cti.local", username: "admin", role: "admin" },
      process.env.JWT_SECRET
    );
    const { req, res, next } = mockReqRes({ authorization: `Bearer ${token}` });
    protect(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.user).toBeDefined();
    expect(req.user.id).toBe("u123");
    expect(req.user.role).toBe("admin");
  });

  test("falls back to employee role for legacy tokens lacking role", () => {
    const token = jwt.sign(
      { id: "u456", email: "legacy@cti.local", username: "legacy" },
      process.env.JWT_SECRET
    );
    const { req, res, next } = mockReqRes({ authorization: `Bearer ${token}` });
    protect(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.user.role).toBe("employee");
  });
});

describe("authMiddleware - authorizeRoles", () => {
  test("rejects if no req.user is attached (401)", () => {
    const { req, res, next } = mockReqRes();
    const middleware = authorizeRoles("admin");
    middleware(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res._status).toBe(401);
  });

  test("rejects employee trying to access admin route (403)", () => {
    const { req, res, next } = mockReqRes({}, { id: "u1", role: "employee" });
    const middleware = authorizeRoles("admin");
    middleware(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res._status).toBe(403);
    expect(res._body.message).toContain("Access denied");
  });

  test("rejects employee trying to access manager route (403)", () => {
    const { req, res, next } = mockReqRes({}, { id: "u1", role: "employee" });
    const middleware = authorizeRoles("admin", "manager");
    middleware(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res._status).toBe(403);
  });

  test("allows manager on manager-allowed route", () => {
    const { req, res, next } = mockReqRes({}, { id: "u2", role: "manager" });
    const middleware = authorizeRoles("admin", "manager");
    middleware(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  test("allows admin on admin-only route", () => {
    const { req, res, next } = mockReqRes({}, { id: "u3", role: "admin" });
    const middleware = authorizeRoles("admin");
    middleware(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});
