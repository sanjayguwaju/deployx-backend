import { Response } from "express";
import { body } from "express-validator";
import { Types } from "mongoose";
import { AuthRequest } from "../../types";
import { LivestockRecord } from "../../models/LivestockRecord";
import { AuditLog } from "../../models/AuditLog";
import { sendSuccess, sendError, sendPaginated } from "../../utils/response";

export const livestockValidation = [
  body("officeId").isMongoId(),
  body("farmerName").notEmpty().trim(),
  body("animalType").isIn(["goat", "sheep", "buffalo", "cow"]),
  body("count").isInt({ min: 0 }),
];

export async function listLivestockRecords(req: AuthRequest, res: Response) {
  const page = parseInt((req.query.page as string) ?? "1");
  const pageSize = Math.min(parseInt((req.query.pageSize as string) ?? "20"), 100);
  const filter: Record<string, unknown> = { tenantId: req.user!.tenantId, isDeleted: false };
  if (req.query.officeId) filter.officeId = req.query.officeId;
  if (req.query.animalType) filter.animalType = req.query.animalType;

  const [data, total] = await Promise.all([
    LivestockRecord.find(filter).populate("officeId", "officeNumber").skip((page - 1) * pageSize).limit(pageSize).sort({ farmerName: 1 }),
    LivestockRecord.countDocuments(filter),
  ]);
  return sendPaginated(res, data, total, page, pageSize);
}

export async function createLivestockRecord(req: AuthRequest, res: Response) {
  const record = await LivestockRecord.create({ ...req.body, tenantId: req.user!.tenantId });
  await AuditLog.create({ tenantId: req.user!.tenantId, actorId: req.user!.id, actorEmail: req.user!.email, module: "livestock", action: "CREATE", entityType: "LivestockRecord", entityId: record._id, entityLabel: `${record.farmerName} — ${record.animalType}`, after: record.toObject() });
  return sendSuccess(res, record, "Livestock record created", 201);
}

export async function getLivestockRecord(req: AuthRequest, res: Response) {
  const record = await LivestockRecord.findOne({ _id: req.params.id, tenantId: req.user!.tenantId, isDeleted: false }).populate("officeId", "officeNumber nameNp");
  if (!record) return sendError(res, 404, "Record not found");
  return sendSuccess(res, record);
}

export async function updateLivestockRecord(req: AuthRequest, res: Response) {
  const before = await LivestockRecord.findOne({ _id: req.params.id, tenantId: req.user!.tenantId, isDeleted: false });
  if (!before) return sendError(res, 404, "Record not found");
  const record = await LivestockRecord.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
  await AuditLog.create({ tenantId: req.user!.tenantId, actorId: req.user!.id, actorEmail: req.user!.email, module: "livestock", action: "UPDATE", entityType: "LivestockRecord", entityId: record!._id, entityLabel: `${record!.farmerName}`, before: before.toObject(), after: record!.toObject() });
  return sendSuccess(res, record, "Record updated");
}

export async function deleteLivestockRecord(req: AuthRequest, res: Response) {
  const record = await LivestockRecord.findOneAndUpdate({ _id: req.params.id, tenantId: req.user!.tenantId }, { isDeleted: true }, { new: true });
  if (!record) return sendError(res, 404, "Record not found");
  await AuditLog.create({ tenantId: req.user!.tenantId, actorId: req.user!.id, actorEmail: req.user!.email, module: "livestock", action: "DELETE", entityType: "LivestockRecord", entityId: record._id, entityLabel: record.farmerName });
  return sendSuccess(res, null, "Record deleted");
}
