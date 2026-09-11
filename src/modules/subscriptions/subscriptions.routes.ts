import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/authorize.middleware";
import { getAllSubscriptions } from "../superadmin/superadmin.controller";

const router = Router();
router.use(authenticate);

// GET /api/v1/subscriptions/all  — used by PlatformBilling page
router.get("/all", authorize("read", "Tenant"), getAllSubscriptions);

export default router;
