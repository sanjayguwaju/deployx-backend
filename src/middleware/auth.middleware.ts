import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { User } from "../models/User";
import { Role } from "../models/Role";
import { Tenant } from "../models/Tenant";
import { getCachedPermissionsForRoles, getCachedUserSession } from "../modules/auth/auth.service";
import { buildAbility } from "../casl/ability.factory";
import { AuthRequest, AccessTokenPayload } from "../types";
import { sendError } from "../utils/response";
import { tenantContext } from "../utils/tenantContext";

/** Verify JWT and attach user + CASL ability to request */
export async function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const token =
      req.cookies?.accessToken ??
      req.headers.authorization?.replace("Bearer ", "");

    if (!token) return sendError(res, 401, "Not authenticated");

    const payload = jwt.verify(token, env.JWT_SECRET) as AccessTokenPayload;

    const user = await getCachedUserSession(payload.sub || (payload as any).id);
    if (!user || !user.isActive) return sendError(res, 401, "User not found or inactive");

    const tenant = await Tenant.findById(user.tenantId);
    if (tenant?.status === "suspended" && !(payload as any).impersonatedBy) {
      return sendError(res, 403, "Your agency account has been suspended. Please contact DeployX support.");
    }

    const permissions = await getCachedPermissionsForRoles(user.rolesSlugs);

    req.user = {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      tenantId: user.tenantId.toString(),
      officeId: user.officeId?.toString(),
      roles: user.rolesSlugs,
    };

    req.ability = buildAbility(req.user, permissions);
    
    return tenantContext.run({ tenantId: user.tenantId.toString() }, () => {
      next();
    });
  } catch (err) {
    return sendError(res, 401, "Invalid or expired token");
  }
}

/** Optional auth — attaches user if token present, continues regardless */
export async function optionalAuthenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.cookies?.accessToken ?? req.headers.authorization?.replace("Bearer ", "");
  if (!token) return next();
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as AccessTokenPayload;
    const user = await getCachedUserSession(payload.sub);
    if (user && user.isActive) {
      const permissions = await getCachedPermissionsForRoles(user.rolesSlugs);
      req.user = {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        tenantId: user.tenantId.toString(),
        officeId: user.officeId?.toString(),
        roles: user.rolesSlugs,
      };
      req.ability = buildAbility(req.user, permissions);
      return tenantContext.run({ tenantId: user.tenantId.toString() }, () => {
        next();
      });
    }
  } catch {}
  next();
}
