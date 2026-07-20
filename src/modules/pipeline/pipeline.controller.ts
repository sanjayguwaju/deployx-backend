import { Response } from "express";
import { body } from "express-validator";
import { AuthRequest } from "../../types";
import { Pipeline, PipelineStage } from "../../models/Pipeline";
import { AuditLog } from "../../models/AuditLog";
import { sendSuccess, sendError } from "../../utils/response";
import { getIO } from "../../config/socket";
import { Types } from "mongoose";

// Stub automation worker triggering
import { triggerWorkflowJob } from "../../workers/automation.worker";

export const addToPipelineValidation = [
  body("candidateId").isMongoId(),
];

export async function getDemandPipeline(req: AuthRequest, res: Response) {
  const pipelines = await Pipeline.find({
    demandId: req.params.id,
    tenantId: req.user!.tenantId,
    isDeleted: false
  }).populate("candidateId", "firstName lastName profession photoUrl")
    .populate("assignedTo", "name");

  // Group by stage for Kanban
  const grouped = pipelines.reduce((acc, curr) => {
    const stage = curr.stage;
    if (!acc[stage]) acc[stage] = [];
    acc[stage].push(curr);
    return acc;
  }, {} as Record<string, typeof pipelines>);

  return sendSuccess(res, grouped);
}

export async function addToPipeline(req: AuthRequest, res: Response) {
  const { candidateId } = req.body;
  const demandId = req.params.id;

  const existing = await Pipeline.findOne({ candidateId, demandId });
  if (existing) return sendError(res, 400, "Candidate is already in this demand's pipeline");

  const pipeline = await Pipeline.create({
    tenantId: req.user!.tenantId,
    candidateId,
    demandId,
    stage: "applied",
    stageHistory: [{ stage: "applied", enteredBy: req.user!.id }]
  });

  await AuditLog.create({
    tenantId: req.user!.tenantId,
    actorId: req.user!.id,
    module: "pipelines", action: "CREATE", entityType: "Pipeline",
    entityId: pipeline._id,
  });

  return sendSuccess(res, pipeline, "Candidate added to pipeline", 201);
}

export async function updatePipelineStage(req: AuthRequest, res: Response) {
  const { stage } = req.body;
  const pipeline = await Pipeline.findOne({ _id: req.params.id, tenantId: req.user!.tenantId, isDeleted: false });
  
  if (!pipeline) return sendError(res, 404, "Pipeline record not found");

  pipeline.stage = stage as PipelineStage;
  pipeline.stageHistory.push({
    stage: stage as PipelineStage,
    enteredAt: new Date(),
    enteredBy: req.user!.id as unknown as Types.ObjectId
  });

  await pipeline.save();

  // Socket broadcast for live Kanban updates
  try {
    const io = getIO();
    io.to(`demand:${pipeline.demandId}`).emit("pipelineStageUpdated", {
      pipelineId: pipeline._id,
      newStage: stage,
      updatedBy: req.user!.id
    });
  } catch (e) {
    // Socket not initialized or error, fail silently so request completes
  }

  // Trigger Phase 2 Automation
  triggerWorkflowJob(pipeline._id.toString(), stage, req.user!.tenantId);

  return sendSuccess(res, pipeline, "Stage updated successfully");
}

export async function assignPipeline(req: AuthRequest, res: Response) {
  const { assignedTo } = req.body;
  const pipeline = await Pipeline.findOneAndUpdate(
    { _id: req.params.id, tenantId: req.user!.tenantId, isDeleted: false },
    { assignedTo },
    { new: true }
  );

  if (!pipeline) return sendError(res, 404, "Pipeline record not found");

  return sendSuccess(res, pipeline, "Pipeline assigned");
}

export async function getPipelineHistory(req: AuthRequest, res: Response) {
  const pipeline = await Pipeline.findOne({ _id: req.params.id, tenantId: req.user!.tenantId, isDeleted: false })
    .select("stageHistory")
    .populate("stageHistory.enteredBy", "name email");

  if (!pipeline) return sendError(res, 404, "Pipeline record not found");

  return sendSuccess(res, pipeline.stageHistory);
}
