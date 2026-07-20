import { Response } from "express";
import { body } from "express-validator";
import { AuthRequest } from "../../types";
import { Demand } from "../../models/Demand";
import { AuditLog } from "../../models/AuditLog";
import { generateTrackingNumber } from "../../utils/tracking";
import { sendSuccess, sendError, sendPaginated } from "../../utils/response";

export const demandValidation = [
  body("employerId").isMongoId(),
  body("country").notEmpty().trim(),
  body("profession").notEmpty().trim(),
  body("quantityRequired").isInt({ min: 1 }),
];

export async function listDemands(req: AuthRequest, res: Response) {
  const page = parseInt(req.query.page as string ?? "1");
  const pageSize = parseInt(req.query.pageSize as string ?? "20");
  const { status, officeId, employerId } = req.query;

  const filter: Record<string, unknown> = {
    tenantId: req.user!.tenantId,
    isDeleted: false,
  };
  if (status) filter.status = status;
  if (employerId) filter.employerId = employerId;
  
  if (req.user!.roles.includes("ward_officer") && req.user!.officeId) {
    filter.officeId = req.user!.officeId;
  } else if (officeId) {
    filter.officeId = officeId;
  }

  const [data, total] = await Promise.all([
    Demand.find(filter)
      .populate("employerId", "companyName country")
      .populate("approvedBy", "name email")
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .sort("-createdAt"),
    Demand.countDocuments(filter),
  ]);
  return sendPaginated(res, data, total, page, pageSize);
}

export async function createDemand(req: AuthRequest, res: Response) {
  const trackingNumber = generateTrackingNumber("DMD");
  const demand = await Demand.create({
    ...req.body,
    tenantId: req.user!.tenantId,
    officeId: req.user!.officeId,
    trackingNumber,
    createdBy: req.user!.id,
  });

  await AuditLog.create({
    tenantId: req.user!.tenantId,
    actorId: req.user!.id,
    module: "demands", action: "CREATE", entityType: "Demand",
    entityId: demand._id, entityLabel: `Demand: ${demand.profession}`,
  });
  return sendSuccess(res, demand, "Demand created", 201);
}

export async function getDemand(req: AuthRequest, res: Response) {
  const demand = await Demand.findOne({
    _id: req.params.id,
    tenantId: req.user!.tenantId,
    isDeleted: false,
  }).populate("employerId", "companyName country").populate("approvedBy", "name email");
  
  if (!demand) return sendError(res, 404, "Demand not found");
  return sendSuccess(res, demand);
}

export async function updateDemand(req: AuthRequest, res: Response) {
  const demand = await Demand.findOneAndUpdate(
    { _id: req.params.id, tenantId: req.user!.tenantId, isDeleted: false },
    { $set: req.body }, { new: true }
  );
  if (!demand) return sendError(res, 404, "Demand not found");
  
  await AuditLog.create({
    tenantId: req.user!.tenantId, actorId: req.user!.id,
    module: "demands", action: "UPDATE", entityType: "Demand",
    entityId: demand._id, entityLabel: demand.trackingNumber,
  });
  return sendSuccess(res, demand, "Demand updated");
}

export async function deleteDemand(req: AuthRequest, res: Response) {
  const demand = await Demand.findOneAndUpdate(
    { _id: req.params.id, tenantId: req.user!.tenantId, isDeleted: false },
    { isDeleted: true }, { new: true }
  );
  if (!demand) return sendError(res, 404, "Demand not found");
  
  await AuditLog.create({
    tenantId: req.user!.tenantId, actorId: req.user!.id,
    module: "demands", action: "DELETE", entityType: "Demand",
    entityId: demand._id, entityLabel: demand.trackingNumber,
  });
  return sendSuccess(res, null, "Demand deleted");
}

export async function approveDemand(req: AuthRequest, res: Response) {
  const demand = await Demand.findOneAndUpdate(
    { _id: req.params.id, tenantId: req.user!.tenantId, isDeleted: false },
    { 
      status: "approved",
      approvedBy: req.user!.id,
      approvedAt: new Date()
    }, 
    { new: true }
  );
  if (!demand) return sendError(res, 404, "Demand not found");

  await AuditLog.create({
    tenantId: req.user!.tenantId, actorId: req.user!.id,
    module: "demands", action: "APPROVE", entityType: "Demand",
    entityId: demand._id, entityLabel: demand.trackingNumber,
  });
  return sendSuccess(res, demand, "Demand approved");
}

export async function rejectDemand(req: AuthRequest, res: Response) {
  const demand = await Demand.findOneAndUpdate(
    { _id: req.params.id, tenantId: req.user!.tenantId, isDeleted: false },
    { status: "rejected" }, 
    { new: true }
  );
  if (!demand) return sendError(res, 404, "Demand not found");

  await AuditLog.create({
    tenantId: req.user!.tenantId, actorId: req.user!.id,
    module: "demands", action: "REJECT", entityType: "Demand",
    entityId: demand._id, entityLabel: demand.trackingNumber,
  });
  return sendSuccess(res, demand, "Demand rejected");
}
