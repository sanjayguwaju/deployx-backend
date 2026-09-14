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

export const KANBAN_STAGES: PipelineStage[] = [
  "applied",
  "shortlisted",
  "interview",
  "selected",
  "medical",
  "visa",
  "ticket",
  "deployment",
  "completed",
  "rejected"
];

export async function getPipelines(req: AuthRequest, res: Response) {
  const { demandId, stage } = req.query;
  const filter: Record<string, unknown> = {
    tenantId: req.user!.tenantId,
    isDeleted: false,
  };
  if (demandId) filter.demandId = demandId;
  if (stage) filter.stage = stage;

  const pipelines = await Pipeline.find(filter)
    .populate("candidateId", "firstName lastName profession photoUrl passportNumber phone email")
    .populate("demandId", "profession country quantityRequired employerId trackingNumber")
    .populate("assignedTo", "name email")
    .sort("-updatedAt");

  const grouped: Record<string, typeof pipelines> = {};
  KANBAN_STAGES.forEach(s => { grouped[s] = []; });

  pipelines.forEach(p => {
    const s = p.stage || "applied";
    if (!grouped[s]) grouped[s] = [];
    grouped[s].push(p);
  });

  return sendSuccess(res, { grouped, total: pipelines.length, pipelines });
}

export async function getDemandPipeline(req: AuthRequest, res: Response) {
  const pipelines = await Pipeline.find({
    demandId: req.params.id,
    tenantId: req.user!.tenantId,
    isDeleted: false
  }).populate("candidateId", "firstName lastName profession photoUrl passportNumber phone email")
    .populate("demandId", "profession country quantityRequired employerId trackingNumber")
    .populate("assignedTo", "name email");

  // Group by stage for Kanban
  const grouped: Record<string, typeof pipelines> = {};
  KANBAN_STAGES.forEach(s => { grouped[s] = []; });

  pipelines.forEach(p => {
    const s = p.stage || "applied";
    if (!grouped[s]) grouped[s] = [];
    grouped[s].push(p);
  });

  return sendSuccess(res, grouped);
}

export async function addToPipeline(req: AuthRequest, res: Response) {
  const { candidateId, stage = "applied", notes } = req.body;
  const demandId = req.params.id || req.body.demandId;

  if (!demandId) {
    return sendError(res, 400, "demandId is required");
  }

  const existing = await Pipeline.findOne({ candidateId, demandId, isDeleted: false });
  if (existing) return sendError(res, 400, "Candidate is already in this demand's pipeline");

  const pipeline = await Pipeline.create({
    tenantId: req.user!.tenantId,
    candidateId,
    demandId,
    stage: stage as PipelineStage,
    notes: notes ? (Array.isArray(notes) ? notes : [notes]) : [],
    stageHistory: [{ 
      stage: stage as PipelineStage, 
      enteredBy: req.user!.id as unknown as Types.ObjectId,
      enteredAt: new Date()
    }]
  });

  await AuditLog.create({
    tenantId: req.user!.tenantId,
    actorId: req.user!.id,
    module: "pipelines", action: "CREATE", entityType: "Pipeline",
    entityId: pipeline._id,
  });

  const populated = await Pipeline.findById(pipeline._id)
    .populate("candidateId", "firstName lastName profession photoUrl passportNumber phone email")
    .populate("demandId", "profession country quantityRequired employerId trackingNumber")
    .populate("assignedTo", "name email");

  return sendSuccess(res, populated, "Candidate added to pipeline", 201);
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

export async function removeFromPipeline(req: AuthRequest, res: Response) {
  const pipeline = await Pipeline.findOneAndUpdate(
    { _id: req.params.id, tenantId: req.user!.tenantId, isDeleted: false },
    { isDeleted: true },
    { new: true }
  );

  if (!pipeline) return sendError(res, 404, "Pipeline record not found");

  await AuditLog.create({
    tenantId: req.user!.tenantId,
    actorId: req.user!.id,
    module: "pipelines", action: "DELETE", entityType: "Pipeline",
    entityId: pipeline._id,
  });

  return sendSuccess(res, null, "Candidate removed from pipeline");
}
