import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/authorize.middleware";
import { getCalendarEvents } from "./calendar.controller";

const router = Router();
router.use(authenticate);

router.get("/", authorize("read", "Calendar"), getCalendarEvents);

export default router;
