import { Response } from "express";
import { body } from "express-validator";
import { AuthRequest } from "../../types";
import { HealthPost } from "../../models/HealthPost";
import { AuditLog } from "../../models/AuditLog";
import { sendSuccess, sendError, sendPaginated } from "../../utils/response";

export const healthPostValidation = [
  body("name").notEmpty().trim(),
  body("officeId").isMongoId(),
];

export async function listHealthPosts(req: AuthRequest, res: Response) {
  const page = parseInt((req.query.page as string) ?? "1");
  const pageSize = Math.min(parseInt((req.query.pageSize as string) ?? "20"), 100);
  const filter: Record<string, unknown> = { tenantId: req.user!.tenantId, isDeleted: false };
  if (req.query.officeId) filter.officeId = req.query.officeId;

  const [data, total] = await Promise.all([
    HealthPost.find(filter).populate("officeId", "officeNumber").skip((page - 1) * pageSize).limit(pageSize).sort({ name: 1 }),
    HealthPost.countDocuments(filter),
  ]);
  return sendPaginated(res, data, total, page, pageSize);
}

export async function createHealthPost(req: AuthRequest, res: Response) {
  const post = await HealthPost.create({ ...req.body, tenantId: req.user!.tenantId });
  await AuditLog.create({ tenantId: req.user!.tenantId, actorId: req.user!.id, actorEmail: req.user!.email, module: "health", action: "CREATE", entityType: "HealthPost", entityId: post._id, entityLabel: post.name, after: post.toObject() });
  return sendSuccess(res, post, "Health post created", 201);
}

export async function getHealthPost(req: AuthRequest, res: Response) {
  const post = await HealthPost.findOne({ _id: req.params.id, tenantId: req.user!.tenantId, isDeleted: false }).populate("officeId", "officeNumber nameNp");
  if (!post) return sendError(res, 404, "Health post not found");
  return sendSuccess(res, post);
}

export async function updateHealthPost(req: AuthRequest, res: Response) {
  const before = await HealthPost.findOne({ _id: req.params.id, tenantId: req.user!.tenantId, isDeleted: false });
  if (!before) return sendError(res, 404, "Health post not found");
  const post = await HealthPost.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
  await AuditLog.create({ tenantId: req.user!.tenantId, actorId: req.user!.id, actorEmail: req.user!.email, module: "health", action: "UPDATE", entityType: "HealthPost", entityId: post!._id, entityLabel: post!.name, before: before.toObject(), after: post!.toObject() });
  return sendSuccess(res, post, "Health post updated");
}

export async function deleteHealthPost(req: AuthRequest, res: Response) {
  const post = await HealthPost.findOneAndUpdate({ _id: req.params.id, tenantId: req.user!.tenantId }, { isDeleted: true }, { new: true });
  if (!post) return sendError(res, 404, "Health post not found");
  await AuditLog.create({ tenantId: req.user!.tenantId, actorId: req.user!.id, actorEmail: req.user!.email, module: "health", action: "DELETE", entityType: "HealthPost", entityId: post._id, entityLabel: post.name });
  return sendSuccess(res, null, "Health post deleted");
}
