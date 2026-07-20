import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { listMyNotifications, markRead } from "./notifications.controller";

const router = Router();
router.use(authenticate);
router.get("/", listMyNotifications);
router.post("/mark-read", markRead);

export default router;
