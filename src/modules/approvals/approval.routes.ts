import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/authorize.middleware";
import { validate } from "../../middleware/validate.middleware";
import { listPendingApprovals, actionApproval, actionValidation } from "./approval.controller";

const router = Router();
router.use(authenticate);

router.get("/", authorize("read", "ApprovableDocument"), listPendingApprovals);
router.post("/:id/action", authorize("approve", "ApprovableDocument"), actionValidation, validate, actionApproval);

export default router;
