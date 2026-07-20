import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/authorize.middleware";
import { searchDocuments, getDocumentById } from "./documents.controller";

const router = Router();
router.use(authenticate);

// Phase 5 unified search
router.get("/", authorize("read", "Document"), searchDocuments);
router.get("/:id", authorize("read", "Document"), getDocumentById);

export default router;
