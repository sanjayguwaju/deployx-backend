import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/authorize.middleware";
import { 
  getTemplates, 
  generateContract, 
  sendContract, 
  signContract, 
  getContractStatus,
  getPublicContract,
  signPublicContract,
  downloadContractPdf
} from "./contracts.controller";

const router = Router();

// Phase 13: Public Routes (No Auth Required)
router.get("/:id/public", getPublicContract);
router.post("/:id/public/sign", signPublicContract);
router.get("/:id/pdf", downloadContractPdf);

router.use(authenticate);

router.get("/templates", authorize("read", "ContractTemplate"), getTemplates);
router.post("/", authorize("create", "Contract"), generateContract);
router.post("/:id/send", authorize("update", "Contract"), sendContract);
router.post("/:id/sign", signContract); // This allows portal users to sign. Internal scoping inside controller.
router.get("/:id/status", authorize("read", "Contract"), getContractStatus);

export default router;
