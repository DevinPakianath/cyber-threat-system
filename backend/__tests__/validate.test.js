const { validateRegister, validateLogin } = require("../middleware/validate");

function mockReqRes(body) {
  const req = { body: { ...body } };
  const res = {
    status(code) { this._status = code; return this; },
    json(data)   { this._body   = data; return this; },
    _status: 200,
    _body:   null,
  };
  const next = jest.fn();
  return { req, res, next };
}

// ── validateRegister ──────────────────────────────────────────────────────────

describe("validateRegister", () => {
  const valid = { username: "alice", email: "alice@example.com", password: "securepass1" };

  test("passes valid input and normalises email/username", () => {
    const { req, res, next } = mockReqRes({ ...valid, username: "  Alice  ", email: "Alice@Example.COM" });
    validateRegister(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.body.username).toBe("Alice");
    expect(req.body.email).toBe("alice@example.com");
  });

  test("rejects missing username", () => {
    const { req, res, next } = mockReqRes({ ...valid, username: "" });
    validateRegister(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res._status).toBe(400);
  });

  test("rejects username shorter than 2 chars", () => {
    const { req, res, next } = mockReqRes({ ...valid, username: "a" });
    validateRegister(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res._status).toBe(400);
  });

  test("rejects username longer than 50 chars", () => {
    const { req, res, next } = mockReqRes({ ...valid, username: "a".repeat(51) });
    validateRegister(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res._status).toBe(400);
  });

  test("rejects invalid email", () => {
    const { req, res, next } = mockReqRes({ ...valid, email: "not-an-email" });
    validateRegister(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res._status).toBe(400);
  });

  test("rejects password shorter than 8 chars", () => {
    const { req, res, next } = mockReqRes({ ...valid, password: "short" });
    validateRegister(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res._status).toBe(400);
  });
});

// ── validateLogin ─────────────────────────────────────────────────────────────

describe("validateLogin", () => {
  const valid = { email: "bob@example.com", password: "mypassword" };

  test("passes valid credentials and lowercases email", () => {
    const { req, res, next } = mockReqRes({ ...valid, email: "BOB@EXAMPLE.COM" });
    validateLogin(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.body.email).toBe("bob@example.com");
  });

  test("rejects missing email", () => {
    const { req, res, next } = mockReqRes({ ...valid, email: "" });
    validateLogin(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res._status).toBe(400);
  });

  test("rejects invalid email format", () => {
    const { req, res, next } = mockReqRes({ ...valid, email: "notvalid" });
    validateLogin(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res._status).toBe(400);
  });

  test("rejects empty password", () => {
    const { req, res, next } = mockReqRes({ ...valid, password: "" });
    validateLogin(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res._status).toBe(400);
  });
});
