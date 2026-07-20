import { Response } from "express";
import { AuthRequest } from "../../../types";
import { Demand } from "../../../models/Demand";
import { Pipeline } from "../../../models/Pipeline";
import { Invoice } from "../../../models/Invoice";
import { sendSuccess, sendError, sendPaginated } from "../../../utils/response";

export async function getEmployerDemands(req: AuthRequest, res: Response) {
  if (!req.user!.employerId) {
    return sendError(res, 403, "Employer profile not linked to this user");
  }

  const page = parseInt(req.query.page as string ?? "1");
  const pageSize = parseInt(req.query.pageSize as string ?? "20");

  const filter = {
    tenantId: req.user!.tenantId,
    employerId: req.user!.employerId,
    isDeleted: false,
  };

  const [data, total] = await Promise.all([
    Demand.find(filter)
      .select("trackingNumber country profession quantityRequired salary status interviewDate")
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .sort("-createdAt"),
    Demand.countDocuments(filter),
  ]);

  return sendPaginated(res, data, total, page, pageSize);
}

export async function getEmployerPipeline(req: AuthRequest, res: Response) {
  if (!req.user!.employerId) {
    return sendError(res, 403, "Employer profile not linked to this user");
  }

  const demand = await Demand.findOne({
    _id: req.params.id,
    employerId: req.user!.employerId,
    tenantId: req.user!.tenantId,
    isDeleted: false,
  });

  if (!demand) return sendError(res, 404, "Demand not found or access denied");

  const pipelines = await Pipeline.find({
    demandId: demand._id,
    tenantId: req.user!.tenantId,
    isDeleted: false
  })
    .populate("candidateId", "firstName lastName profession") // Explicitly excluding sensitive PII
    .select("stage candidateId");

  return sendSuccess(res, pipelines);
}

export async function getEmployerInvoices(req: AuthRequest, res: Response) {
  if (!req.user!.employerId) {
    return sendError(res, 403, "Employer profile not linked to this user");
  }

  const invoices = await Invoice.find({
    tenantId: req.user!.tenantId,
    billedToType: "employer",
    billedToId: req.user!.employerId
  }).sort("-createdAt");

  return sendSuccess(res, invoices);
}

export async function counterSignAgreement(req: AuthRequest, res: Response) {
  // Stub for Phase 5 (E-sign) / File upload handling
  return sendSuccess(res, null, "Counter-signature placeholder logic");
}
