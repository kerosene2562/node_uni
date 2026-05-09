import { NextFunction, Request, Response } from "express";
import { verifyToken } from "../utils/jwt";

export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const token = req.cookies?.access_token;

    if (!token) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const payload = verifyToken(token);
    req.userId = payload.userId;

    next();
  } catch {
    res.status(401).json({ message: "Unauthorized" });
  }
};