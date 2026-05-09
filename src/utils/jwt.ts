import jwt, { JwtPayload, SignOptions } from "jsonwebtoken";

const ACCESS_TOKEN_EXPIRES_IN = "15m";
const REFRESH_TOKEN_EXPIRES_IN = "30d";

export type TokenPayload = {
  userId: string;
};

const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;

  if (secret) {
    return secret;
  }

  if (process.env.NODE_ENV === "test") {
    return "test-secret";
  }

  throw new Error("JWT_SECRET is not defined");
};

const signToken = (payload: TokenPayload, expiresIn: NonNullable<SignOptions["expiresIn"]>): string => {
  return jwt.sign(payload, getJwtSecret(), { expiresIn } as SignOptions);
};

export const createAccessToken = (payload: TokenPayload): string => {
  return signToken(payload, ACCESS_TOKEN_EXPIRES_IN);
};

export const createRefreshToken = (payload: TokenPayload): string => {
  return signToken(payload, REFRESH_TOKEN_EXPIRES_IN);
};

export const verifyToken = (token: string): TokenPayload => {
  const decoded = jwt.verify(token, getJwtSecret()) as JwtPayload;

  if (typeof decoded.userId !== "string") {
    throw new Error("Invalid token payload");
  }

  return {
    userId: decoded.userId,
  };
};