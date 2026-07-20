import { Response } from "express";
import { AuthRequest } from "../../types";
import { Visa } from "../../models/Visa";
import { AuditLog } from "../../models/AuditLog";
import { sendSuccess } from "../../utils/response";

export async function getVisaByPipeline(req: AuthRequest, res: Response) {
  const visa = await Visa.findOne({
    pipelineId: req.params.pipelineId,
    tenantId: req.user!.tenantId,
    isDeleted: false,
  });
  return sendSuccess(res, visa || null);
}

export async function createOrUpdateVisa(req: AuthRequest, res: Response) {
  const { pipelineId, candidateId } = req.body;
  let visa = await Visa.findOne({ pipelineId, tenantId: req.user!.tenantId, isDeleted: false });

  if (visa) {
    Object.assign(visa, req.body);
    await visa.save();

    await AuditLog.create({
      tenantId: req.user!.tenantId, actorId: req.user!.id,
      module: "visa", action: "UPDATE", entityType: "Visa",
      entityId: visa._id,
    });
  } else {
    visa = await Visa.create({
      ...req.body,
      tenantId: req.user!.tenantId,
    });

    await AuditLog.create({
      tenantId: req.user!.tenantId, actorId: req.user!.id,
      module: "visa", action: "CREATE", entityType: "Visa",
      entityId: visa._id,
    });
  }

  return sendSuccess(res, visa, "Visa record saved");
}
