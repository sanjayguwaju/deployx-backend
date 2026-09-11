import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/authorize.middleware";
import { getApprovals, updateApproval } from "./approvals.controller";

const router = Router();
router.use(authenticate);

router.get("/",      authorize("read",   "Dashboard"), getApprovals);
router.patch("/:id", authorize("update", "Dashboard"), updateApproval);

export default router;
