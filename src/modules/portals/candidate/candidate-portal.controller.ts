import { Response } from "express";
import { AuthRequest } from "../../../types";
import { Candidate } from "../../../models/Candidate";
import { Pipeline } from "../../../models/Pipeline";
import { Medical } from "../../../models/Medical";
import { Visa } from "../../../models/Visa";
import { Ticket } from "../../../models/Ticket";
import { Deployment } from "../../../models/Deployment";
import { sendSuccess, sendError } from "../../../utils/response";

export async function getCandidateProfile(req: AuthRequest, res: Response) {
  if (!req.user!.candidateId) {
    return sendError(res, 403, "Candidate profile not linked to this user");
  }

  const candidate = await Candidate.findOne({
    _id: req.user!.candidateId,
    tenantId: req.user!.tenantId,
    isDeleted: false,
  }).select("-isDeleted -tenantId");

  if (!candidate) return sendError(res, 404, "Candidate not found");
  return sendSuccess(res, candidate);
}

export async function getCandidateStatus(req: AuthRequest, res: Response) {
  if (!req.user!.candidateId) return sendError(res, 403, "Candidate profile not linked");

  // Fetch the most active pipeline (sorting by stage or just getting the latest)
  const pipelines = await Pipeline.find({
    candidateId: req.user!.candidateId,
    tenantId: req.user!.tenantId,
    isDeleted: false
  }).sort("-createdAt").populate("demandId", "profession country");

  if (!pipelines.length) return sendSuccess(res, { message: "No active applications" });

  // For MVP, just return the most recent pipeline's high-level status
  const mainPipeline = pipelines[0];

  // Fetch read-only summaries of domains
  const [medical, visa, ticket, deployment] = await Promise.all([
    Medical.findOne({ pipelineId: mainPipeline._id }).select("result hospitalName bookedDate"),
    Visa.findOne({ pipelineId: mainPipeline._id }).select("status embassy"),
    Ticket.findOne({ pipelineId: mainPipeline._id }).select("departureDatetime flightNumber"),
    Deployment.findOne({ pipelineId: mainPipeline._id }).select("actualDeploymentDate arrivalConfirmation")
  ]);

  return sendSuccess(res, {
    pipeline: mainPipeline,
    domains: { medical, visa, ticket, deployment }
  });
}

export async function updateContactDetails(req: AuthRequest, res: Response) {
  if (!req.user!.candidateId) return sendError(res, 403, "Candidate profile not linked");

  const { phone, email, whatsapp, permanentAddress } = req.body;

  const candidate = await Candidate.findOne({ _id: req.user!.candidateId });
  if (!candidate) return sendError(res, 404, "Candidate not found");

  candidate.contactUpdatePending = {
    phone, email, whatsapp, permanentAddress,
    submittedAt: new Date()
  };

  await candidate.save();
  return sendSuccess(res, candidate.contactUpdatePending, "Contact update submitted for HR review");
}

export async function downloadDocument(req: AuthRequest, res: Response) {
  // Stub for document download. Normally would generate a signed S3 URL.
  return sendSuccess(res, { docId: req.params.docId, downloadUrl: "dummy-url" }, "Document download link generated");
}
