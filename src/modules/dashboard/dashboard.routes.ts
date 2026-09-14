import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/authorize.middleware";
import { 
  getDashboardOverview, 
  getPipelineDashboard, 
  getFinanceDashboard, 
  getComplianceDashboard, 
  getDashboardKpis 
} from "./dashboard.controller";

const router = Router();
router.use(authenticate);

router.get("/overview", authorize("read", "Dashboard"), getDashboardOverview);
router.get("/summary", authorize("read", "Dashboard"), getDashboardOverview);
router.get("/pipeline", authorize("read", "Dashboard"), getPipelineDashboard);
router.get("/finance", authorize("read", "Dashboard"), getFinanceDashboard);
router.get("/compliance", authorize("read", "Dashboard"), getComplianceDashboard);
router.get("/kpis", authorize("read", "Dashboard"), getDashboardKpis);

export default router;
