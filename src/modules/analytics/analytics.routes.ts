import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/authorize.middleware";
import { getTrends } from "./analytics.controller";

const router = Router();
router.use(authenticate);

router.get("/trends", authorize("read", "Dashboard"), getTrends);

export default router;
