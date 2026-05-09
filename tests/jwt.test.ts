import jwt from "jsonwebtoken";
import { createAccessToken, createRefreshToken, verifyToken } from "../src/utils/jwt";

describe("JWT utils", () => {
  const originalJwtSecret = process.env.JWT_SECRET;
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    if (originalJwtSecret === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = originalJwtSecret;
    }

    if (originalNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = originalNodeEnv;
    }
  });

  it("should create and verify access token", () => {
    process.env.JWT_SECRET = "jwt-test-secret";

    const token = createAccessToken({ userId: "user-1" });
    const payload = verifyToken(token);

    expect(payload).toEqual({ userId: "user-1" });
  });

  it("should create and verify refresh token", () => {
    process.env.JWT_SECRET = "jwt-test-secret";

    const token = createRefreshToken({ userId: "user-2" });
    const payload = verifyToken(token);

    expect(payload).toEqual({ userId: "user-2" });
  });

  it("should use test secret during tests when JWT_SECRET is missing", () => {
    delete process.env.JWT_SECRET;
    process.env.NODE_ENV = "test";

    const token = createAccessToken({ userId: "test-user" });
    const payload = verifyToken(token);

    expect(payload.userId).toBe("test-user");
  });

  it("should throw when JWT_SECRET is missing outside test environment", () => {
    delete process.env.JWT_SECRET;
    process.env.NODE_ENV = "production";

    expect(() => createAccessToken({ userId: "user-1" })).toThrow("JWT_SECRET is not defined");
  });

  it("should throw when token payload does not contain userId", () => {
    process.env.JWT_SECRET = "jwt-test-secret";
    const token = jwt.sign({ role: "user" }, "jwt-test-secret");

    expect(() => verifyToken(token)).toThrow("Invalid token payload");
  });
});
