import { Router } from "express";
import { authenticate } from "../../../middleware/auth.middleware";
import { authorize } from "../../../middleware/authorize.middleware";
import { 
  getCandidateProfile, 
  getCandidateStatus, 
  updateContactDetails, 
  downloadDocument 
} from "./candidate-portal.controller";

const router = Router();
router.use(authenticate);
router.use(authorize("read", "CandidatePortal"));

router.get("/me", getCandidateProfile);
router.get("/me/status", getCandidateStatus);
router.patch("/me/contact", updateContactDetails);
router.get("/me/documents/:docId", downloadDocument);

export default router;
