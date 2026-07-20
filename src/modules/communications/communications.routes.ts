import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/authorize.middleware";
import { 
  dispatchNotification, 
  getTemplates, 
  bulkSend, 
  getTimeline 
} from "./communications.controller";

const router = Router();
router.use(authenticate);

router.post("/dispatch", authorize("create", "Notification"), dispatchNotification);
router.get("/templates", authorize("read", "CommunicationTemplate"), getTemplates);
router.post("/bulk-send", authorize("create", "Notification"), bulkSend);
router.get("/:entityType/:entityId/timeline", authorize("read", "Notification"), getTimeline);

export default router;
