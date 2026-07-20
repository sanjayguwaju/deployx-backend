import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { getTaxRules, createTaxRule, evaluateTax } from "./tax-engine.controller";
import { authorize } from "../../middleware/authorize.middleware";

const router = Router();
router.use(authenticate);

// Public (within tenant) evaluation endpoint
router.post("/evaluate", evaluateTax);

// Admin endpoints
router.get("/rules", authorize("read", "Finance"), getTaxRules);
router.post("/rules", authorize("manage", "Finance"), createTaxRule);

export default router;
