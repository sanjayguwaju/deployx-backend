import { Router } from "express";
import * as whatsappController from "./whatsapp.controller";
import { authenticate } from "../../middleware/auth.middleware";

const router = Router();

// Tenant API
router.get("/status", authenticate, whatsappController.getStatus);
router.post("/connect", authenticate, whatsappController.createInstance);
router.post("/disconnect", authenticate, whatsappController.logoutInstance);

// Webhook (Public, Evolution API sends to this)
router.post("/webhook", whatsappController.webhook);

export default router;
