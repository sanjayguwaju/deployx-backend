import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/authorize.middleware";
import { getDashboardKpis } from "./dashboard.controller";

const router = Router();
router.use(authenticate);

router.get("/kpis", authorize("read", "Dashboard"), getDashboardKpis);

export default router;
