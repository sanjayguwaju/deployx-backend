import { Response } from "express";
import { AuthRequest } from "../../types";
import { License } from "../../models/License";
import { ComplianceCheck } from "../../models/ComplianceCheck";
import { sendSuccess, sendError, sendPaginated } from "../../utils/response";

export async function getLicenses(req: AuthRequest, res: Response) {
  const page = parseInt(req.query.page as string ?? "1");
  const pageSize = parseInt(req.query.pageSize as string ?? "20");

  const query: any = { tenantId: req.user!.tenantId };
  if (req.query.status) query.status = req.query.status;

  const [data, total] = await Promise.all([
    License.find(query).skip((page - 1) * pageSize).limit(pageSize).sort("expiryDate"),
    License.countDocuments(query),
  ]);

  return sendPaginated(res, data, total, page, pageSize);
}

export async function createLicense(req: AuthRequest, res: Response) {
  const license = await License.create({
    ...req.body,
    tenantId: req.user!.tenantId,
    status: "active"
  });

  return sendSuccess(res, license, "License added successfully", 201);
}

export async function getChecks(req: AuthRequest, res: Response) {
  const query: any = { tenantId: req.user!.tenantId };
  if (req.query.entityType) query.entityType = req.query.entityType;
  if (req.query.entityId) query.entityId = req.query.entityId;

  const checks = await ComplianceCheck.find(query).sort("-createdAt");
  return sendSuccess(res, checks);
}

export async function createCheck(req: AuthRequest, res: Response) {
  const check = await ComplianceCheck.create({
    ...req.body,
    tenantId: req.user!.tenantId,
    checkedBy: req.user!.id,
    checkedAt: new Date()
  });

  return sendSuccess(res, check, "Compliance check recorded successfully", 201);
}
