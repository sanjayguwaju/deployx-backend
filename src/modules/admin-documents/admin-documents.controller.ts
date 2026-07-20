import { createHash } from "crypto";
import { Response } from "express";
import { body } from "express-validator";
import { Types } from "mongoose";
import { AuthRequest } from "../../types";
import { AdminDocument } from "../../models/AdminDocument";
import { AdminSignature } from "../../models/AdminSignature";
import { AuditLog } from "../../models/AuditLog";
import { sendSuccess, sendError, sendPaginated } from "../../utils/response";
import { createApproval } from "../approvals/approval.service";
import { Role } from "../../models/Role";

export const docValidation = [
  body("title").notEmpty().trim(),
];

export const signValidation = [
  body("signedAtBs").notEmpty().isString(),
];

async function getActorLevel(user: AuthRequest["user"]): Promise<number> {
  const roles = await Role.find({ slug: { $in: user!.roles } }).select("level");
  return roles.length ? Math.min(...roles.map((r) => r.level)) : 5;
}

export async function listAdminDocuments(req: AuthRequest, res: Response) {
  const page = parseInt((req.query.page as string) ?? "1");
  const pageSize = Math.min(parseInt((req.query.pageSize as string) ?? "20"), 100);
  const filter: Record<string, unknown> = { tenantId: req.user!.tenantId, isDeleted: false };

  const [data, total] = await Promise.all([
    AdminDocument.find(filter).populate("createdBy", "name email").populate("approvalId").skip((page - 1) * pageSize).limit(pageSize).sort({ createdAt: -1 }),
    AdminDocument.countDocuments(filter),
  ]);
  return sendPaginated(res, data, total, page, pageSize);
}

export async function createAdminDocument(req: AuthRequest, res: Response) {
  const doc = await AdminDocument.create({
    ...req.body,
    tenantId: req.user!.tenantId,
    createdBy: req.user!.id,
  });

  // Create approval workflow
  const actorLevel = await getActorLevel(req.user);
  const approval = await createApproval(req.user!.tenantId, "administrative", "AdminDocument", doc._id as Types.ObjectId, actorLevel);
  await AdminDocument.findByIdAndUpdate(doc._id, { approvalId: approval._id });

  await AuditLog.create({ tenantId: req.user!.tenantId, actorId: req.user!.id, actorEmail: req.user!.email, module: "administrative", action: "CREATE", entityType: "AdminDocument", entityId: doc._id, entityLabel: doc.title, after: doc.toObject() });
  return sendSuccess(res, { ...doc.toObject(), approvalId: approval._id }, "Document created", 201);
}

export async function getAdminDocument(req: AuthRequest, res: Response) {
  const doc = await AdminDocument.findOne({ _id: req.params.id, tenantId: req.user!.tenantId, isDeleted: false }).populate("createdBy", "name").populate("approvalId");
  if (!doc) return sendError(res, 404, "Document not found");
  const signatures = await AdminSignature.find({ documentId: req.params.id }).populate("signerId", "name");
  return sendSuccess(res, { ...doc.toObject(), signatures });
}

export async function updateAdminDocument(req: AuthRequest, res: Response) {
  const before = await AdminDocument.findOne({ _id: req.params.id, tenantId: req.user!.tenantId, isDeleted: false });
  if (!before) return sendError(res, 404, "Document not found");
  const doc = await AdminDocument.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
  await AuditLog.create({ tenantId: req.user!.tenantId, actorId: req.user!.id, actorEmail: req.user!.email, module: "administrative", action: "UPDATE", entityType: "AdminDocument", entityId: doc!._id, entityLabel: doc!.title, before: before.toObject(), after: doc!.toObject() });
  return sendSuccess(res, doc, "Document updated");
}

export async function deleteAdminDocument(req: AuthRequest, res: Response) {
  const doc = await AdminDocument.findOneAndUpdate({ _id: req.params.id, tenantId: req.user!.tenantId }, { isDeleted: true }, { new: true });
  if (!doc) return sendError(res, 404, "Document not found");
  await AuditLog.create({ tenantId: req.user!.tenantId, actorId: req.user!.id, actorEmail: req.user!.email, module: "administrative", action: "DELETE", entityType: "AdminDocument", entityId: doc._id, entityLabel: doc.title });
  return sendSuccess(res, null, "Document deleted");
}

export async function signDocument(req: AuthRequest, res: Response) {
  const doc = await AdminDocument.findOne({ _id: req.params.id, tenantId: req.user!.tenantId, isDeleted: false });
  if (!doc) return sendError(res, 404, "Document not found");

  const timestamp = Date.now().toString();
  const signatureHash = createHash("sha256")
    .update(`${req.params.id}${req.user!.id}${timestamp}`)
    .digest("hex");

  const signature = await AdminSignature.create({
    documentId: req.params.id,
    signerId: req.user!.id,
    signedAtBs: req.body.signedAtBs,
    signatureHash,
  });

  await AuditLog.create({ tenantId: req.user!.tenantId, actorId: req.user!.id, actorEmail: req.user!.email, module: "admin_signatures", action: "SIGN", entityType: "AdminSignature", entityId: signature._id, entityLabel: doc.title });
  return sendSuccess(res, signature, "Document signed", 201);
}
