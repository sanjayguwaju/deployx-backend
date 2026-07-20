import { Response, NextFunction } from "express";
import { subject } from "@casl/ability";
import { AuthRequest, CaslSubject, PermissionAction } from "../types";
import { sendError } from "../utils/response";

/**
 * Gate a route by a CASL permission.
 * Usage: router.get("/", authenticate, authorize("read", "Candidate"), handler)
 */
export function authorize(action: PermissionAction, subjectType: CaslSubject) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.ability) return sendError(res, 401, "Not authenticated");
    if (req.ability.cannot(action, subjectType)) {
      return sendError(res, 403, `Forbidden: you cannot ${action} ${subjectType}`);
    }
    next();
  };
}

/**
 * Check permission against a specific resource object (field/condition rules).
 * The object must be tagged with tag() helper before passing.
 */
export function authorizeResource(
  action: PermissionAction,
  subjectType: CaslSubject,
  getResource: (req: AuthRequest) => Record<string, unknown> | null,
) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.ability) return sendError(res, 401, "Not authenticated");
    const resource = getResource(req);
    if (!resource) return next(); // let the handler 404
    if (req.ability.cannot(action, subject(subjectType, resource))) {
      return sendError(res, 403, `Forbidden: you cannot ${action} this ${subjectType}`);
    }
    next();
  };
}
