import { Response } from "express";
import { AuthRequest } from "../../types";
import { ApprovableDocument } from "../../models/ApprovableDocument";
import { sendSuccess, sendError } from "../../utils/response";

/** GET /api/v1/approvals — returns pending approvals scoped to the user's tenant */
export async function getApprovals(req: AuthRequest, res: Response) {
  try {
    const tenantId = req.user!.tenantId;
    const { status = "pending", page = 1, limit = 50 } = req.query;

    const filter: Record<string, any> = { municipalityId: tenantId };
    if (status && status !== "all") filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);

    const [approvals, total] = await Promise.all([
      ApprovableDocument.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .select("module recordType recordId currentLevelRequired status createdAt history"),
      ApprovableDocument.countDocuments(filter),
    ]);

    return sendSuccess(res, { approvals, total, page: Number(page), limit: Number(limit) });
  } catch (error: any) {
    return sendError(res, 500, "Failed to fetch approvals", [error.message]);
  }
}

/** PATCH /api/v1/approvals/:id — approve or reject a record */
export async function updateApproval(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { action, comment } = req.body as { action: "approve" | "reject"; comment?: string };
    const user = req.user!;

    if (!["approve", "reject"].includes(action)) {
      return sendError(res, 400, "Invalid action. Must be 'approve' or 'reject'.");
    }

    const approval = await ApprovableDocument.findOne({ _id: id, municipalityId: user.tenantId });
    if (!approval) return sendError(res, 404, "Approval record not found");
    if (approval.status !== "pending") return sendError(res, 400, "This approval has already been processed");

    approval.status = action === "approve" ? "approved" : "rejected";
    approval.history.push({
      actorId: user.id as any,
      level: 0,
      action,
      atBs: new Date().toISOString(),
      comment,
    });

    await approval.save();
    return sendSuccess(res, approval, `Record ${action}d successfully`);
  } catch (error: any) {
    return sendError(res, 500, "Failed to update approval", [error.message]);
  }
}
