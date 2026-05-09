import request, { Response } from "supertest";
import bcrypt from "bcryptjs";
import { MongoServerError } from "mongodb";
import app from "../src/app";
import { connectTestDB, disconnectTestDB, clearTestDB } from "./setup";
import { UserModel } from "../src/models/user.model";

const getCookieHeader = (response: Response): string => {
  const rawCookies = response.headers["set-cookie"] as unknown as string[] | string | undefined;
  const cookies = Array.isArray(rawCookies) ? rawCookies : rawCookies ? [rawCookies] : [];

  return cookies.map((cookie) => cookie.split(";")[0]).join("; ");
};

const getSetCookies = (response: Response): string[] => {
  const rawCookies = response.headers["set-cookie"] as unknown as string[] | string | undefined;
  return Array.isArray(rawCookies) ? rawCookies : rawCookies ? [rawCookies] : [];
};

describe("Auth routes", () => {
  beforeAll(async () => {
    process.env.JWT_SECRET = "test-secret";
    await connectTestDB();
  });

  afterEach(async () => {
    jest.restoreAllMocks();
    await clearTestDB();
  });

  afterAll(async () => {
    await disconnectTestDB();
  });

  describe("POST /auth/register", () => {
    it("should register user and not return password hash", async () => {
      const response = await request(app).post("/auth/register").send({
        email: "TEST@example.com",
        password: "password123",
      });

      expect(response.status).toBe(201);
      expect(response.body.user.email).toBe("test@example.com");
      expect(response.body.user.passwordHash).toBeUndefined();
    });

    it("should hash password in pre-save hook", async () => {
      await request(app).post("/auth/register").send({
        email: "hash@example.com",
        password: "password123",
      });

      const user = await UserModel.findOne({ email: "hash@example.com" }).select("+passwordHash");

      expect(user).not.toBeNull();
      expect(user?.passwordHash).not.toBe("password123");
      await expect(bcrypt.compare("password123", user?.passwordHash ?? "")).resolves.toBe(true);
    });

    it("should not rehash password when passwordHash was not changed", async () => {
      await request(app).post("/auth/register").send({
        email: "no-rehash@example.com",
        password: "password123",
      });

      const user = await UserModel.findOne({ email: "no-rehash@example.com" }).select("+passwordHash");

      expect(user).not.toBeNull();

      const originalHash = user?.passwordHash;
      user!.email = "updated-no-rehash@example.com";
      await user!.save();

      expect(user?.passwordHash).toBe(originalHash);
      expect(user?.toObject()).not.toHaveProperty("passwordHash");
    });

    it("should return 409 for duplicate email", async () => {
      await request(app).post("/auth/register").send({
        email: "duplicate@example.com",
        password: "password123",
      });

      const response = await request(app).post("/auth/register").send({
        email: "duplicate@example.com",
        password: "password123",
      });

      expect(response.status).toBe(409);
    });

    it("should return 400 for invalid data", async () => {
      const response = await request(app).post("/auth/register").send({
        email: "bad-email",
        password: "123",
      });

      expect(response.status).toBe(400);
    });

    it("should return 409 when database rejects duplicate email", async () => {
      jest.spyOn(UserModel, "exists").mockResolvedValueOnce(null);

      const duplicateError = new MongoServerError({
        message: "E11000 duplicate key error",
      } as any);
      (duplicateError as any).code = 11000;

      jest.spyOn(UserModel, "create").mockRejectedValueOnce(duplicateError);

      const response = await request(app).post("/auth/register").send({
        email: "race@example.com",
        password: "password123",
      });

      expect(response.status).toBe(409);
    });

    it("should return 500 when registration throws unexpected error", async () => {
      jest.spyOn(UserModel, "exists").mockRejectedValueOnce(new Error("register boom"));

      const response = await request(app).post("/auth/register").send({
        email: "boom@example.com",
        password: "password123",
      });

      expect(response.status).toBe(500);
      expect(response.body.message).toBe("register boom");
    });
  });

  describe("POST /auth/login", () => {
    beforeEach(async () => {
      await request(app).post("/auth/register").send({
        email: "login@example.com",
        password: "password123",
      });
    });

    it("should login user and set httpOnly secure strict cookies", async () => {
      const response = await request(app).post("/auth/login").send({
        email: "login@example.com",
        password: "password123",
      });

      const cookies = getSetCookies(response);

      expect(response.status).toBe(200);
      expect(response.body.access_token).toBeUndefined();
      expect(response.body.refresh_token).toBeUndefined();
      expect(cookies.some((cookie) => cookie.startsWith("access_token="))).toBe(true);
      expect(cookies.some((cookie) => cookie.startsWith("refresh_token="))).toBe(true);
      expect(cookies.join("; ")).toContain("HttpOnly");
      expect(cookies.join("; ")).toContain("Secure");
      expect(cookies.join("; ")).toContain("SameSite=Strict");
    });

    it("should return 401 for wrong password", async () => {
      const response = await request(app).post("/auth/login").send({
        email: "login@example.com",
        password: "wrong-password",
      });

      expect(response.status).toBe(401);
    });

    it("should return 401 for missing user", async () => {
      const response = await request(app).post("/auth/login").send({
        email: "missing@example.com",
        password: "password123",
      });

      expect(response.status).toBe(401);
    });

    it("should return 400 for invalid login data", async () => {
      const response = await request(app).post("/auth/login").send({
        email: "bad-email",
        password: "123",
      });

      expect(response.status).toBe(400);
    });

    it("should return 500 when login throws unexpected error", async () => {
      jest.spyOn(UserModel, "findOne").mockImplementationOnce(() => {
        throw new Error("login boom");
      });

      const response = await request(app).post("/auth/login").send({
        email: "login@example.com",
        password: "password123",
      });

      expect(response.status).toBe(500);
      expect(response.body.message).toBe("login boom");
    });
  });

  describe("POST /auth/refresh", () => {
    it("should refresh access and refresh tokens", async () => {
      await request(app).post("/auth/register").send({
        email: "refresh@example.com",
        password: "password123",
      });

      const loginResponse = await request(app).post("/auth/login").send({
        email: "refresh@example.com",
        password: "password123",
      });

      const response = await request(app)
        .post("/auth/refresh")
        .set("Cookie", getCookieHeader(loginResponse));

      const cookies = getSetCookies(response);

      expect(response.status).toBe(200);
      expect(cookies.some((cookie) => cookie.startsWith("access_token="))).toBe(true);
      expect(cookies.some((cookie) => cookie.startsWith("refresh_token="))).toBe(true);
    });

    it("should return 401 without refresh token", async () => {
      const response = await request(app).post("/auth/refresh");

      expect(response.status).toBe(401);
    });

    it("should return 401 for invalid refresh token", async () => {
      const response = await request(app)
        .post("/auth/refresh")
        .set("Cookie", "refresh_token=invalid-token");

      expect(response.status).toBe(401);
    });
  });

  describe("POST /auth/logout", () => {
    it("should clear auth cookies", async () => {
      const response = await request(app).post("/auth/logout");
      const cookies = getSetCookies(response);

      expect(response.status).toBe(200);
      expect(cookies.some((cookie) => cookie.startsWith("access_token=;"))).toBe(true);
      expect(cookies.some((cookie) => cookie.startsWith("refresh_token=;"))).toBe(true);
    });
  });
});