import { Response } from "express";
import { AuthRequest } from "../../types";
import { Medical } from "../../models/Medical";
import { AuditLog } from "../../models/AuditLog";
import { sendSuccess, sendError } from "../../utils/response";
import { triggerWorkflowJob } from "../../workers/automation.worker";

export async function getMedicalByPipeline(req: AuthRequest, res: Response) {
  const medical = await Medical.findOne({
    pipelineId: req.params.pipelineId,
    tenantId: req.user!.tenantId,
    isDeleted: false,
  });
  return sendSuccess(res, medical || null);
}

export async function createOrUpdateMedical(req: AuthRequest, res: Response) {
  const { pipelineId, candidateId } = req.body;
  let medical = await Medical.findOne({ pipelineId, tenantId: req.user!.tenantId, isDeleted: false });

  if (medical) {
    const oldResult = medical.result;
    Object.assign(medical, req.body);
    await medical.save();

    await AuditLog.create({
      tenantId: req.user!.tenantId, actorId: req.user!.id,
      module: "medical", action: "UPDATE", entityType: "Medical",
      entityId: medical._id,
    });

    if (oldResult !== medical.result && (medical.result === "passed" || medical.result === "failed")) {
      triggerWorkflowJob(pipelineId, `medical_${medical.result}`, req.user!.tenantId);
    }
  } else {
    medical = await Medical.create({
      ...req.body,
      tenantId: req.user!.tenantId,
    });

    await AuditLog.create({
      tenantId: req.user!.tenantId, actorId: req.user!.id,
      module: "medical", action: "CREATE", entityType: "Medical",
      entityId: medical._id,
    });

    if (medical.result === "passed" || medical.result === "failed") {
      triggerWorkflowJob(pipelineId, `medical_${medical.result}`, req.user!.tenantId);
    }
  }

  return sendSuccess(res, medical, "Medical record saved");
}
