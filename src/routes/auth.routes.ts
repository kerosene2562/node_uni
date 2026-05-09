import { Router, Request, Response, NextFunction, CookieOptions } from "express";
import bcrypt from "bcryptjs";
import { MongoServerError } from "mongodb";

import { validate } from "../middleware/validate";
import { loginSchema, registerSchema } from "../schemas/auth.schema";
import { UserModel } from "../models/user.model";
import { createAccessToken, createRefreshToken, verifyToken } from "../utils/jwt";

const router = Router();

const FIFTEEN_MINUTES = 15 * 60 * 1000;
const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

const baseCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "strict",
  path: "/",
};

const setAuthCookies = (res: Response, userId: string): void => {
  const accessToken = createAccessToken({ userId });
  const refreshToken = createRefreshToken({ userId });

  res.cookie("access_token", accessToken, {
    ...baseCookieOptions,
    maxAge: FIFTEEN_MINUTES,
  });

  res.cookie("refresh_token", refreshToken, {
    ...baseCookieOptions,
    maxAge: THIRTY_DAYS,
  });
};

const clearAuthCookies = (res: Response): void => {
  res.clearCookie("access_token", baseCookieOptions);
  res.clearCookie("refresh_token", baseCookieOptions);
};

router.post(
  "/register",
  validate(registerSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body as { email: string; password: string };

      const existingUser = await UserModel.exists({ email });

      if (existingUser) {
        return res.status(409).json({ message: "User with this email already exists" });
      }

      const user = await UserModel.create({
        email,
        passwordHash: password,
      });

      return res.status(201).json({
        user: user.toJSON(),
      });
    } catch (error) {
      if (error instanceof MongoServerError && error.code === 11000) {
        return res.status(409).json({ message: "User with this email already exists" });
      }

      return next(error);
    }
  }
);

router.post("/login", validate(loginSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body as { email: string; password: string };

    const user = await UserModel.findOne({ email }).select("+passwordHash");

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    setAuthCookies(res, String(user._id));

    return res.status(200).json({
      user: user.toJSON(),
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/refresh", async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies?.refresh_token;

    if (!refreshToken) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const payload = verifyToken(refreshToken);
    setAuthCookies(res, payload.userId);

    return res.status(200).json({ message: "Tokens refreshed" });
  } catch {
    return res.status(401).json({ message: "Unauthorized" });
  }
});

router.post("/logout", (_req: Request, res: Response) => {
  clearAuthCookies(res);
  return res.status(200).json({ message: "Logged out" });
});

export default router;