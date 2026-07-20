import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/authorize.middleware";
import { validate } from "../../middleware/validate.middleware";
import { listCandidates, createCandidate, candidateValidation, getCandidate, updateCandidate, deleteCandidate, approveCandidate, uploadCandidateDocument, deleteCandidateDocument } from "./candidates.controller";

const router = Router();
router.use(authenticate);

router.get("/", authorize("read", "Candidate"), listCandidates);
router.post("/", authorize("create", "Candidate"), candidateValidation, validate, createCandidate);
router.get("/:id", authorize("read", "Candidate"), getCandidate);
router.put("/:id", authorize("update", "Candidate"), updateCandidate);
router.delete("/:id", authorize("delete", "Candidate"), deleteCandidate);
router.patch("/:id/approve", authorize("approve", "Candidate"), approveCandidate);

router.post("/:id/documents", authorize("update", "Candidate"), uploadCandidateDocument);
router.delete("/:id/documents/:docId", authorize("update", "Candidate"), deleteCandidateDocument);

export default router;
