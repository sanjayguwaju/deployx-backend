import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { AccessTokenPayload, AuthUser } from "../types";

export function signAccessToken(user: AuthUser): string {
  const payload: Omit<AccessTokenPayload, "iat" | "exp"> = {
    sub: user.id,
    email: user.email,
    tenantId: user.tenantId,
    officeId: user.officeId,
    roles: user.roles,
  };
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN } as jwt.SignOptions);
}

export function signRefreshToken(userId: string): string {
  return jwt.sign({ sub: userId }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  } as jwt.SignOptions);
}

export function verifyRefreshToken(token: string): { sub: string } {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as { sub: string };
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.JWT_SECRET) as AccessTokenPayload;
}
