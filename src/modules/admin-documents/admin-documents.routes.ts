import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/authorize.middleware";
import { validate } from "../../middleware/validate.middleware";
import { listAdminDocuments, createAdminDocument, getAdminDocument, updateAdminDocument, deleteAdminDocument, signDocument, docValidation, signValidation } from "./admin-documents.controller";

const router = Router();
router.use(authenticate);

router.get("/", authorize("read", "AdminDocument"), listAdminDocuments);
router.post("/", authorize("create", "AdminDocument"), docValidation, validate, createAdminDocument);
router.get("/:id", authorize("read", "AdminDocument"), getAdminDocument);
router.put("/:id", authorize("update", "AdminDocument"), updateAdminDocument);
router.delete("/:id", authorize("delete", "AdminDocument"), deleteAdminDocument);
router.post("/:id/sign", authorize("update", "AdminDocument"), signValidation, validate, signDocument);

export default router;
