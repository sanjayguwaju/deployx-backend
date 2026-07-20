import { Response } from "express";
import { AuthRequest } from "../../types";
import { AuditLog } from "../../models/AuditLog";
import { sendPaginated } from "../../utils/response";

export async function listAuditLogs(req: AuthRequest, res: Response) {
  const page = parseInt(req.query.page as string ?? "1");
  const pageSize = Math.min(parseInt(req.query.pageSize as string ?? "50"), 200);
  const { module, action, entityType, actorId, from, to } = req.query;

  const filter: Record<string, unknown> = { tenantId: req.user!.tenantId };
  if (module) filter.module = module;
  if (action) filter.action = action;
  if (entityType) filter.entityType = entityType;
  if (actorId) filter.actorId = actorId;
  if (from || to) {
    filter.createdAt = {};
    if (from) (filter.createdAt as any).$gte = new Date(from as string);
    if (to) (filter.createdAt as any).$lte = new Date(to as string);
  }

  const [data, total] = await Promise.all([
    AuditLog.find(filter).sort("-createdAt").skip((page - 1) * pageSize).limit(pageSize).populate("actorId", "name email"),
    AuditLog.countDocuments(filter),
  ]);

  return sendPaginated(res, data, total, page, pageSize);
}
