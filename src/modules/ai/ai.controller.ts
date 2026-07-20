import { Response } from "express";
import { AuthRequest } from "../../types";
import { AIService } from "./ai.service";
import { Candidate } from "../../models/Candidate";
import { sendSuccess, sendError } from "../../utils/response";

// --- Matching ---

export async function getCandidateMatches(req: AuthRequest, res: Response) {
  const matches = await AIService.getMatches(req.params.id, "candidate");
  return sendSuccess(res, matches);
}

export async function getDemandMatches(req: AuthRequest, res: Response) {
  const matches = await AIService.getMatches(req.params.id, "demand");
  return sendSuccess(res, matches);
}

// --- OCR ---

export async function extractDocumentData(req: AuthRequest, res: Response) {
  // In a real flow, we'd lookup the Document record to get the URL and type.
  const { documentUrl, type } = req.body;
  if (!documentUrl || !type) return sendError(res, 400, "Missing documentUrl or type");

  const extracted = await AIService.extractDocumentData(documentUrl, type);
  return sendSuccess(res, extracted, "Extraction complete. Awaiting user confirmation.");
}

export async function confirmExtraction(req: AuthRequest, res: Response) {
  const { candidateId, extractedData } = req.body;
  // User confirmed the data. We patch the candidate entity.
  const candidate = await Candidate.findByIdAndUpdate(
    candidateId,
    { $set: { "documentsParsedData": extractedData } }, // simplified
    { new: true }
  );
  if (!candidate) return sendError(res, 404, "Candidate not found");

  return sendSuccess(res, candidate, "Candidate updated with verified OCR data.");
}

// --- Verification ---

export async function getVerificationStatus(req: AuthRequest, res: Response) {
  const status = await AIService.runVerificationChecks(req.params.id);
  return sendSuccess(res, status);
}

// --- Assistant ---

export async function askAssistant(req: AuthRequest, res: Response) {
  const { query } = req.body;
  if (!query) return sendError(res, 400, "Query cannot be empty");

  const intentMapping = await AIService.parseAssistantIntent(query);

  if (intentMapping.requiresConfirmation) {
    return sendSuccess(res, {
      ...intentMapping,
      actionStatus: "pending_confirmation"
    });
  }

  // In reality, this would dynamically execute the safe backend service calls
  // based on the intent string (e.g. PipelineService.getCandidates(intentMapping.filters))
  const simulatedDataResult = { simulatedRowsCount: 42 }; 

  return sendSuccess(res, {
    summary: intentMapping.summary,
    intent: intentMapping.intent,
    data: simulatedDataResult
  });
}
