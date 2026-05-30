// Unit tests for the threat-scoring rules (no DB — LoginLog.find is mocked).
jest.mock("../models/LoginLog");
const LoginLog      = require("../models/LoginLog");
const { analyzeLogin } = require("../services/threatEngine");

function makeLog(overrides) {
  return {
    timestamp:   new Date(),
    ip:          "1.2.3.4",
    loginStatus: "success",
    ...overrides,
  };
}

beforeEach(() => jest.clearAllMocks());

describe("analyzeLogin — risk scoring", () => {
  test("fresh account with successful login from known IP scores Safe (0)", async () => {
    LoginLog.find.mockReturnValue({ sort: () => ({ limit: () => [] }) });

    const { riskScore, status } = await analyzeLogin(
      "user1", "1.2.3.4", new Date(), "success"
    );
    // No history → unknown IP (+15), success (−25) → clamped to 0
    expect(riskScore).toBe(0);
    expect(status).toBe("Safe");
  });

  test("repeated failed logins raise score to Dangerous", async () => {
    const now = new Date();
    const recentFails = Array.from({ length: 5 }, () =>
      makeLog({ loginStatus: "failed", timestamp: new Date(now - 5000) })
    );
    LoginLog.find.mockReturnValue({ sort: () => ({ limit: () => recentFails }) });

    const { riskScore, status } = await analyzeLogin(
      "user2", "9.9.9.9", now, "failed"
    );
    expect(riskScore).toBeGreaterThanOrEqual(60);
    expect(status).toBe("Dangerous");
  });

  test("score is clamped between 0 and 100", async () => {
    const now = new Date();
    const massiveFails = Array.from({ length: 20 }, () =>
      makeLog({ loginStatus: "failed", timestamp: new Date(now - 1000) })
    );
    LoginLog.find.mockReturnValue({ sort: () => ({ limit: () => massiveFails }) });

    const { riskScore } = await analyzeLogin("user3", "5.5.5.5", now, "failed");
    expect(riskScore).toBeGreaterThanOrEqual(0);
    expect(riskScore).toBeLessThanOrEqual(100);
  });

  test("known IP does not add unknown-IP penalty", async () => {
    const knownIp  = "10.20.30.40";
    const prevLogs = [makeLog({ ip: knownIp, loginStatus: "success" })];
    LoginLog.find.mockReturnValue({ sort: () => ({ limit: () => prevLogs }) });

    const { riskScore: scoreKnown } = await analyzeLogin(
      "user4", knownIp, new Date(), "success"
    );
    LoginLog.find.mockReturnValue({ sort: () => ({ limit: () => [] }) });
    const { riskScore: scoreUnknown } = await analyzeLogin(
      "user4", "99.99.99.99", new Date(), "success"
    );

    expect(scoreKnown).toBeLessThanOrEqual(scoreUnknown);
  });
});
