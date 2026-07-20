import { Response } from "express";
import { body } from "express-validator";
import { AuthRequest } from "../../types";
import { Complaint } from "../../models/Complaint";
import { AuditLog } from "../../models/AuditLog";
import { generateTrackingNumber } from "../../utils/tracking";
import { sendSuccess, sendError, sendPaginated } from "../../utils/response";

export const complaintValidation = [
  body("subject").notEmpty().trim(),
  body("description").notEmpty().trim(),
  body("isAnonymous").optional().isBoolean(),
  body("category").optional().isString(),
];

export async function listComplaints(req: AuthRequest, res: Response) {
  const page = parseInt(req.query.page as string ?? "1");
  const pageSize = parseInt(req.query.pageSize as string ?? "20");
  const { status, category } = req.query;
  const filter: Record<string, unknown> = { tenantId: req.user!.tenantId, isDeleted: false };
  if (status) filter.status = status;
  if (category) filter.category = category;
  const [data, total] = await Promise.all([
    Complaint.find(filter).skip((page - 1) * pageSize).limit(pageSize).sort("-createdAt"),
    Complaint.countDocuments(filter),
  ]);
  return sendPaginated(res, data, total, page, pageSize);
}

import { getIO } from "../../config/socket";

export async function createComplaint(req: AuthRequest, res: Response) {
  const trackingNumber = generateTrackingNumber("CP");
  const complaint = await Complaint.create({
    ...req.body,
    tenantId: req.user!.tenantId,
    trackingNumber,
  });

  try {
    const io = getIO();
    const message = `New complaint filed: ${complaint.subject}`;
    // Notify users with specific roles
    ["platform_admin", "tenant_admin", "ward_officer", "section_head"].forEach((role) => {
      io.to(`role:${role}`).emit("new_notification", {
        type: "complaint",
        message,
        id: complaint._id,
        trackingNumber,
      });
    });
  } catch (err) {
    // Ignore socket error if not initialized or fails
    console.error("Socket emit failed:", err);
  }

  return sendSuccess(res, { ...complaint.toObject(), trackingNumber }, "Complaint submitted", 201);
}

export async function getComplaint(req: AuthRequest, res: Response) {
  const c = await Complaint.findOne({ _id: req.params.id, tenantId: req.user!.tenantId });
  if (!c) return sendError(res, 404, "Complaint not found");
  return sendSuccess(res, c);
}

export async function resolveComplaint(req: AuthRequest, res: Response) {
  const { resolution, status } = req.body;
  const c = await Complaint.findByIdAndUpdate(
    req.params.id,
    { $set: { resolution, status: status ?? "resolved", resolvedAt: new Date() } },
    { new: true },
  );
  if (!c) return sendError(res, 404, "Complaint not found");
  await AuditLog.create({
    tenantId: req.user!.tenantId, actorId: req.user!.id,
    module: "complaints", action: "RESOLVE", entityType: "Complaint", entityId: c._id,
  });
  return sendSuccess(res, c, "Complaint resolved");
}

export async function updateComplaint(req: AuthRequest, res: Response) {
  const c = await Complaint.findOneAndUpdate(
    { _id: req.params.id, tenantId: req.user!.tenantId, isDeleted: false },
    { $set: req.body }, { new: true }
  );
  if (!c) return sendError(res, 404, "Complaint not found");
  await AuditLog.create({
    tenantId: req.user!.tenantId, actorId: req.user!.id,
    module: "complaints", action: "UPDATE", entityType: "Complaint",
    entityId: c._id, entityLabel: c.trackingNumber || "unknown",
  });
  return sendSuccess(res, c, "Complaint updated");
}

export async function deleteComplaint(req: AuthRequest, res: Response) {
  const c = await Complaint.findOneAndUpdate(
    { _id: req.params.id, tenantId: req.user!.tenantId, isDeleted: false },
    { isDeleted: true }, { new: true }
  );
  if (!c) return sendError(res, 404, "Complaint not found");
  await AuditLog.create({
    tenantId: req.user!.tenantId, actorId: req.user!.id,
    module: "complaints", action: "DELETE", entityType: "Complaint",
    entityId: c._id, entityLabel: c.trackingNumber || "unknown",
  });
  return sendSuccess(res, null, "Complaint deleted");
}
