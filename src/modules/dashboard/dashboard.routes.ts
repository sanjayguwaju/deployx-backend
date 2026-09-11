import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/authorize.middleware";
import {
  getDashboardKpis,
  getDashboardOverview,
  getDashboardPipeline,
  getDashboardFinance,
  getDashboardCompliance,
} from "./dashboard.controller";

const router = Router();
router.use(authenticate);

router.get("/kpis",        authorize("read", "Dashboard"), getDashboardKpis);
router.get("/overview",    authorize("read", "Dashboard"), getDashboardOverview);
router.get("/pipeline",    authorize("read", "Dashboard"), getDashboardPipeline);
router.get("/finance",     authorize("read", "Dashboard"), getDashboardFinance);
router.get("/compliance",  authorize("read", "Dashboard"), getDashboardCompliance);

export default router;
