import { Response } from "express";
import { AuthRequest } from "../../types";
import { Deployment } from "../../models/Deployment";
import { AuditLog } from "../../models/AuditLog";
import { sendSuccess } from "../../utils/response";
import { triggerWorkflowJob } from "../../workers/automation.worker";

export async function getDeploymentByPipeline(req: AuthRequest, res: Response) {
  const deployment = await Deployment.findOne({
    pipelineId: req.params.pipelineId,
    tenantId: req.user!.tenantId,
    isDeleted: false,
  });
  return sendSuccess(res, deployment || null);
}

export async function createOrUpdateDeployment(req: AuthRequest, res: Response) {
  const { pipelineId, candidateId } = req.body;
  let deployment = await Deployment.findOne({ pipelineId, tenantId: req.user!.tenantId, isDeleted: false });

  if (deployment) {
    const wasConfirmed = deployment.arrivalConfirmation?.confirmed;
    Object.assign(deployment, req.body);
    
    // Auto-set confirmedAt and confirmedBy if just confirmed
    if (!wasConfirmed && deployment.arrivalConfirmation?.confirmed) {
      deployment.arrivalConfirmation.confirmedAt = new Date();
      deployment.arrivalConfirmation.confirmedBy = req.user!.id as any;
    }

    await deployment.save();

    await AuditLog.create({
      tenantId: req.user!.tenantId, actorId: req.user!.id,
      module: "deployment", action: "UPDATE", entityType: "Deployment",
      entityId: deployment._id,
    });

    if (!wasConfirmed && deployment.arrivalConfirmation?.confirmed) {
      triggerWorkflowJob(pipelineId, "deployment_confirmed", req.user!.tenantId);
    }
  } else {
    deployment = await Deployment.create({
      ...req.body,
      tenantId: req.user!.tenantId,
    });

    if (deployment.arrivalConfirmation?.confirmed) {
      deployment.arrivalConfirmation.confirmedAt = new Date();
      deployment.arrivalConfirmation.confirmedBy = req.user!.id as any;
      await deployment.save();
    }

    await AuditLog.create({
      tenantId: req.user!.tenantId, actorId: req.user!.id,
      module: "deployment", action: "CREATE", entityType: "Deployment",
      entityId: deployment._id,
    });

    if (deployment.arrivalConfirmation?.confirmed) {
      triggerWorkflowJob(pipelineId, "deployment_confirmed", req.user!.tenantId);
    }
  }

  return sendSuccess(res, deployment, "Deployment record saved");
}
