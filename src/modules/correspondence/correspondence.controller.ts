import { Response } from "express";
import { body } from "express-validator";
import { AuthRequest } from "../../types";
import { Correspondence } from "../../models/Correspondence";
import { AuditLog } from "../../models/AuditLog";
import { sendSuccess, sendError, sendPaginated } from "../../utils/response";

export const corrValidation = [
  body("type").isIn(["letter","memo","notice","order","report"]),
  body("direction").isIn(["incoming","outgoing","internal"]),
  body("subject").notEmpty().trim(),
  body("dateBs").notEmpty(),
];

let seqCache: Record<string, number> = {};

async function nextSeq(tenantId: string, fiscalYear: string): Promise<number> {
  const key = `${tenantId}-${fiscalYear}`;
  if (!seqCache[key]) {
    const last = await Correspondence.findOne({ tenantId, fiscalYear }).sort("-sequenceNumber");
    seqCache[key] = (last?.sequenceNumber ?? 0) + 1;
  } else {
    seqCache[key]++;
  }
  return seqCache[key];
}

export async function listCorrespondence(req: AuthRequest, res: Response) {
  const page = parseInt(req.query.page as string ?? "1");
  const pageSize = parseInt(req.query.pageSize as string ?? "20");
  const { type, direction, status, fiscalYear } = req.query;
  const filter: Record<string, unknown> = { tenantId: req.user!.tenantId, isDeleted: false };
  if (type) filter.type = type;
  if (direction) filter.direction = direction;
  if (status) filter.status = status;
  if (fiscalYear) filter.fiscalYear = fiscalYear;
  const [data, total] = await Promise.all([
    Correspondence.find(filter).sort("-createdAt").skip((page - 1) * pageSize).limit(pageSize),
    Correspondence.countDocuments(filter),
  ]);
  return sendPaginated(res, data, total, page, pageSize);
}

export async function createCorrespondence(req: AuthRequest, res: Response) {
  const fiscalYear = req.body.fiscalYear ?? "2081/082";
  const seq = await nextSeq(req.user!.tenantId, fiscalYear);
  const referenceNumber = `PAL-${fiscalYear}-${String(seq).padStart(4, "0")}`;

  const corr = await Correspondence.create({
    ...req.body,
    tenantId: req.user!.tenantId,
    fiscalYear,
    sequenceNumber: seq,
    referenceNumber,
    fromUserId: req.user!.id,
  });

  await AuditLog.create({
    tenantId: req.user!.tenantId, actorId: req.user!.id,
    module: "correspondence", action: "CREATE", entityType: "Correspondence",
    entityId: corr._id, entityLabel: referenceNumber,
  });

  return sendSuccess(res, corr, "Correspondence created", 201);
}

export async function getCorrespondence(req: AuthRequest, res: Response) {
  const c = await Correspondence.findOne({ _id: req.params.id, tenantId: req.user!.tenantId });
  if (!c) return sendError(res, 404, "Correspondence not found");
  return sendSuccess(res, c);
}

export async function updateCorrespondence(req: AuthRequest, res: Response) {
  const c = await Correspondence.findOneAndUpdate(
    { _id: req.params.id, tenantId: req.user!.tenantId, isDeleted: false },
    { $set: req.body }, { new: true },
  );
  if (!c) return sendError(res, 404, "Correspondence not found");
  return sendSuccess(res, c, "Updated");
}

export async function deleteCorrespondence(req: AuthRequest, res: Response) {
  const c = await Correspondence.findOneAndUpdate(
    { _id: req.params.id, tenantId: req.user!.tenantId, isDeleted: false },
    { isDeleted: true }, { new: true },
  );
  if (!c) return sendError(res, 404, "Correspondence not found");
  await AuditLog.create({
    tenantId: req.user!.tenantId, actorId: req.user!.id,
    module: "correspondence", action: "DELETE", entityType: "Correspondence",
    entityId: c._id, entityLabel: c.referenceNumber || "unknown",
  });
  return sendSuccess(res, null, "Correspondence deleted");
}
