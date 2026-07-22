import Queue from "bull";
import { env } from "../config/env";
import logger from "../config/logger";
import { Pipeline } from "../models/Pipeline";
import { Task } from "../models/Task";
import { User } from "../models/User";
import { Candidate } from "../models/Candidate";
import { Commission } from "../models/Commission";
import { ComplianceCheck } from "../models/ComplianceCheck";
import { WhatsappInstance } from "../models/WhatsappInstance";
import { WhatsappService } from "../utils/whatsapp.service";


const workflowQueue = new Queue("workflow-automation", {
  redis: env.REDIS_URL
    ? env.REDIS_URL
    : { host: env.REDIS_HOST, port: env.REDIS_PORT },
});

// Phase 3 Automation: 
// Trigger: medical_passed -> move to visa, task
// Trigger: medical_failed -> move to rejected
// Trigger: deployment_confirmed -> move to completed

workflowQueue.process(async (job) => {
  const { pipelineId, newStage, tenantId } = job.data;
  
  if (newStage === "medical_passed") {
    logger.info(`Processing automation for pipeline ${pipelineId}, trigger: medical_passed`);
    
    const pipeline = await Pipeline.findById(pipelineId);
    if (!pipeline) return;

    pipeline.stage = "visa";
    pipeline.stageHistory.push({
      stage: "visa",
      enteredAt: new Date(),
      enteredBy: pipeline.assignedTo || pipeline.candidateId, 
    });
    await pipeline.save();

    const visaOfficer = await User.findOne({ tenantId, roles: { $in: ["recruiter", "hr"] } });
    if (visaOfficer) {
      await Task.create({
        tenantId,
        title: "Visa Document Checklist Verification",
        pipelineId: pipeline._id,
        assignedTo: visaOfficer._id,
        category: "embassy"
      });
    }
    logger.info(`[Notification] Employer notified: Candidate for pipeline ${pipelineId} moved to Visa stage.`);

    // Send WhatsApp Alert
    const candidate = await Candidate.findById(pipeline.candidateId);
    if (candidate && candidate.phone) {
      await WhatsappService.sendTextMessage(
        tenantId, 
        candidate.phone, 
        `Hello ${candidate.firstName}, great news! Your Medical Report has been approved. We are now initiating your Visa processing.`
      );
    }
  }

  if (newStage === "medical_failed") {
    logger.info(`Processing automation for pipeline ${pipelineId}, trigger: medical_failed`);
    
    const pipeline = await Pipeline.findById(pipelineId);
    if (!pipeline) return;

    pipeline.stage = "rejected";
    pipeline.stageHistory.push({
      stage: "rejected",
      enteredAt: new Date(),
      enteredBy: pipeline.assignedTo || pipeline.candidateId, 
    });
    await pipeline.save();
    
    logger.info(`[Notification] HR notified: Candidate for pipeline ${pipelineId} rejected due to medical failure.`);

    // Send WhatsApp Alert
    const candidate = await Candidate.findById(pipeline.candidateId);
    if (candidate && candidate.phone) {
      await WhatsappService.sendTextMessage(
        tenantId, 
        candidate.phone, 
        `Hello ${candidate.firstName}, unfortunately your Medical Report did not pass the requirements. Please contact the agency for more details.`
      );
    }
  }

  if (newStage === "deployment_confirmed") {
    logger.info(`Processing automation for pipeline ${pipelineId}, trigger: deployment_confirmed`);
    
    const pipeline = await Pipeline.findById(pipelineId);
    if (!pipeline) return;

    // Phase 6: Compliance Gate
    const failedChecks = await ComplianceCheck.find({
      tenantId,
      entityType: "demand",
      entityId: pipeline.demandId,
      status: "failed"
    });

    if (failedChecks.length > 0) {
      logger.warn(`[Compliance Gate] Cannot move pipeline ${pipelineId} to completed. Failed compliance checks exist for demand ${pipeline.demandId}.`);
      return; // Block progression
    }

    pipeline.stage = "completed";
    pipeline.stageHistory.push({
      stage: "completed",
      enteredAt: new Date(),
      enteredBy: pipeline.assignedTo || pipeline.candidateId, 
    });
    await pipeline.save();

    // Phase 6: Commission Trigger
    const candidate = await Candidate.findById(pipeline.candidateId);
    if (candidate && candidate.referringAgentId) {
      await Commission.create({
        tenantId,
        agentId: candidate.referringAgentId,
        candidateId: candidate._id,
        demandId: pipeline.demandId,
        amount: 500, // Fixed stub for now, could be derived from config
        currency: "USD",
        status: "pending"
      });
      logger.info(`[Commission] Created pending commission for agent ${candidate.referringAgentId}`);
    }

    if (candidate && candidate.phone) {
      await WhatsappService.sendTextMessage(
        tenantId, 
        candidate.phone, 
        `Hello ${candidate.firstName}, congratulations! Your deployment has been confirmed. Have a safe flight!`
      );
    }
  }
});

workflowQueue.on("error", (error) => {
  logger.error("Workflow Queue Error:", error);
});

workflowQueue.on("completed", (job) => {
  logger.info(`Workflow Job ${job.id} completed successfully`);
});

export function triggerWorkflowJob(pipelineId: string, newStage: string, tenantId: string) {
  workflowQueue.add({ pipelineId, newStage, tenantId });
}

export default workflowQueue;
