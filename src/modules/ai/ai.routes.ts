import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/authorize.middleware";
import {
  getCandidateMatches,
  getDemandMatches,
  extractDocumentData,
  confirmExtraction,
  getVerificationStatus,
  askAssistant
} from "./ai.controller";

const router = Router();
router.use(authenticate);

// We define a broad 'AI' subject in CASL. Authorized users can access AI tools.
// Matching
router.get("/candidates/:id/matches", authorize("read", "AI"), getCandidateMatches);
router.get("/demands/:id/matches", authorize("read", "AI"), getDemandMatches);

// OCR
router.post("/documents/:id/extract", authorize("read", "AI"), extractDocumentData);
router.post("/documents/:id/confirm-extraction", authorize("update", "Candidate"), confirmExtraction);

// Verification
router.get("/candidates/:id/verification-status", authorize("read", "AI"), getVerificationStatus);

// Assistant
router.post("/assistant/query", authorize("read", "AI"), askAssistant);

export default router;
