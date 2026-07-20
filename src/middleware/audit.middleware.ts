import { Response, NextFunction } from "express";
import { AuthRequest } from "../types";
import { AuditLog } from "../models/AuditLog";

/** Lightweight write-operation audit. Fine-grained logging is done per service. */
export function auditLog(module: string, action: string, entityType: string) {
  return async (req: AuthRequest, _res: Response, next: NextFunction) => {
    // We log after the handler runs — attach a post-hook
    const originalJson = _res.json.bind(_res);
    _res.json = (body: unknown) => {
      const statusCode = _res.statusCode;
      if (statusCode >= 200 && statusCode < 300 && req.user) {
        AuditLog.create({
          tenantId: req.user.tenantId,
          actorId: req.user.id,
          actorEmail: req.user.email,
          module,
          action,
          entityType,
          ipAddress: req.ip,
          userAgent: req.headers["user-agent"],
          meta: { method: req.method, path: req.path },
        }).catch(() => {}); // non-blocking, never fail the request
      }
      return originalJson(body);
    };
    next();
  };
}
