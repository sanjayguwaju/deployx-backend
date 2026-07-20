import { Response } from "express";
import { body } from "express-validator";
import { AuthRequest } from "../../types";
import { AuditLog } from "../../models/AuditLog";
import { sendSuccess, sendError } from "../../utils/response";
import { processAction, getPendingForUser } from "./approval.service";

export const actionValidation = [
  body("action").isIn(["approve", "reject"]),
  body("atBs").notEmpty().isString(),
  body("comment").optional().isString(),
];

export async function listPendingApprovals(req: AuthRequest, res: Response) {
  const approvals = await getPendingForUser(req.user!.tenantId, req.user!);
  return sendSuccess(res, approvals);
}

export async function actionApproval(req: AuthRequest, res: Response) {
  const { action, atBs, comment } = req.body;

  const approval = await processAction(
    req.params.id,
    req.user!,
    action as "approve" | "reject",
    atBs,
    comment,
  );

  if (!approval) {
    return sendError(res, 403, "Approval not found or you do not have sufficient authority to act on it");
  }

  await AuditLog.create({
    tenantId: req.user!.tenantId,
    actorId: req.user!.id,
    actorEmail: req.user!.email,
    module: "approvals",
    action: action.toUpperCase(),
    entityType: "ApprovableDocument",
    entityId: approval._id,
    entityLabel: `${approval.recordType} #${approval.recordId}`,
    after: approval.toObject(),
  });

  return sendSuccess(res, approval, `Document ${action}d`);
}
