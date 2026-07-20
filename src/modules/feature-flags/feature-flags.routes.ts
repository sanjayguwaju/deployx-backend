import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/authorize.middleware";
import { listFeatureFlags, createFeatureFlag, updateFeatureFlag, deleteFeatureFlag, getSystemFeatureFlags, createSystemFeatureFlag } from "./feature-flags.controller";

const router = Router();

// Allow authenticated users to read flags (to configure the UI)
router.use(authenticate);

router.get("/system-flags", authorize("read", "FeatureFlag"), getSystemFeatureFlags);
router.post("/system-flags", authorize("create", "FeatureFlag"), createSystemFeatureFlag);
router.get("/", authorize("read", "FeatureFlag"), listFeatureFlags);
router.post("/", authorize("create", "FeatureFlag"), createFeatureFlag);
router.put("/:id", authorize("update", "FeatureFlag"), updateFeatureFlag);
router.delete("/:id", authorize("delete", "FeatureFlag"), deleteFeatureFlag);

export default router;
