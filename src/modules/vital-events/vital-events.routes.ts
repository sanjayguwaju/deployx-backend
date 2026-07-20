import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { registerEvent, getMyEvents, getAllEvents, approveEvent } from "./vital-events.controller";
import { authorize } from "../../middleware/authorize.middleware";

const router = Router();
router.use(authenticate);

router.post("/", registerEvent);
router.get("/my", getMyEvents);
router.get("/", authorize("read", "VitalEvent"), getAllEvents);
router.patch("/:id/approve", authorize("manage", "VitalEvent"), approveEvent);

export default router;
