import { Response } from "express";
import { body } from "express-validator";
import { Types } from "mongoose";
import { AuthRequest } from "../../types";
import { ReliefApplication } from "../../models/ReliefApplication";
import { DisasterIncident } from "../../models/DisasterIncident";
import { AuditLog } from "../../models/AuditLog";
import { sendSuccess, sendError, sendPaginated } from "../../utils/response";
import { createApproval } from "../approvals/approval.service";
import { Role } from "../../models/Role";

export const reliefValidation = [
  body("incidentId").isMongoId(),
  body("applicantName").notEmpty().trim(),
  body("requestedAmountNpr").optional().isFloat({ min: 0 }),
];

async function getActorLevel(user: AuthRequest["user"]): Promise<number> {
  const roles = await Role.find({ slug: { $in: user!.roles } }).select("level");
  return roles.length ? Math.min(...roles.map((r) => r.level)) : 5;
}

export async function listReliefApplications(req: AuthRequest, res: Response) {
  const page = parseInt((req.query.page as string) ?? "1");
  const pageSize = Math.min(parseInt((req.query.pageSize as string) ?? "20"), 100);
  const filter: Record<string, unknown> = { isDeleted: false };
  if (req.query.incidentId) filter.incidentId = req.query.incidentId;
  if (req.query.status) filter.status = req.query.status;

  const [data, total] = await Promise.all([
    ReliefApplication.find(filter).populate("incidentId", "type severity").populate("approvalId").skip((page - 1) * pageSize).limit(pageSize).sort({ createdAt: -1 }),
    ReliefApplication.countDocuments(filter),
  ]);
  return sendPaginated(res, data, total, page, pageSize);
}

export async function createReliefApplication(req: AuthRequest, res: Response) {
  // Verify incident belongs to this tenant
  const incident = await DisasterIncident.findOne({ _id: req.body.incidentId, tenantId: req.user!.tenantId, isDeleted: false });
  if (!incident) return sendError(res, 404, "Incident not found");

  const application = await ReliefApplication.create(req.body);

  // Create approval workflow
  const actorLevel = await getActorLevel(req.user);
  const approval = await createApproval(req.user!.tenantId, "disaster_management", "ReliefApplication", application._id as Types.ObjectId, actorLevel);
  await ReliefApplication.findByIdAndUpdate(application._id, { approvalId: approval._id });

  await AuditLog.create({ tenantId: req.user!.tenantId, actorId: req.user!.id, actorEmail: req.user!.email, module: "relief_applications", action: "CREATE", entityType: "ReliefApplication", entityId: application._id, entityLabel: application.applicantName, after: application.toObject() });
  return sendSuccess(res, { ...application.toObject(), approvalId: approval._id }, "Application submitted", 201);
}

export async function getReliefApplication(req: AuthRequest, res: Response) {
  const application = await ReliefApplication.findOne({ _id: req.params.id, isDeleted: false }).populate("incidentId").populate("approvalId");
  if (!application) return sendError(res, 404, "Application not found");
  return sendSuccess(res, application);
}

export async function updateReliefApplication(req: AuthRequest, res: Response) {
  const before = await ReliefApplication.findOne({ _id: req.params.id, isDeleted: false });
  if (!before) return sendError(res, 404, "Application not found");
  const application = await ReliefApplication.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
  await AuditLog.create({ tenantId: req.user!.tenantId, actorId: req.user!.id, actorEmail: req.user!.email, module: "relief_applications", action: "UPDATE", entityType: "ReliefApplication", entityId: application!._id, entityLabel: application!.applicantName, before: before.toObject(), after: application!.toObject() });
  return sendSuccess(res, application, "Application updated");
}

export async function deleteReliefApplication(req: AuthRequest, res: Response) {
  const application = await ReliefApplication.findOneAndUpdate({ _id: req.params.id }, { isDeleted: true }, { new: true });
  if (!application) return sendError(res, 404, "Application not found");
  return sendSuccess(res, null, "Application deleted");
}
