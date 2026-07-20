import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/authorize.middleware";
import { listAuditLogs } from "./audit.controller";

const router = Router();
router.use(authenticate);
router.get("/", authorize("read", "AuditLog"), listAuditLogs);

export default router;
