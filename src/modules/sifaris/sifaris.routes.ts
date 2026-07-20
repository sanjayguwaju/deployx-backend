import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { generateSifaris, verifyDocument } from "./sifaris.controller";

const router = Router();

// Public route for QR code verification
router.get("/verify/:hash", verifyDocument);

// Protected routes
router.use(authenticate);
router.post("/generate", generateSifaris);

export default router;
