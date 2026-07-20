import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/authorize.middleware";
import { listReports, runReport, exportReport } from "./reports.controller";

const router = Router();
router.use(authenticate);

router.get("/", authorize("read", "ReportDefinition"), listReports);
router.post("/:id/run", authorize("read", "ReportDefinition"), runReport);
router.post("/:id/export", authorize("read", "ReportDefinition"), exportReport);

export default router;
