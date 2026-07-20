import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/authorize.middleware";
import { 
  getLicenses, 
  createLicense,
  getChecks,
  createCheck
} from "./compliance.controller";

const router = Router();
router.use(authenticate);

// Licenses
router.get("/licenses", authorize("read", "License"), getLicenses);
router.post("/licenses", authorize("create", "License"), createLicense);

// Compliance Checks
router.get("/checks", authorize("read", "ComplianceCheck"), getChecks);
router.post("/checks", authorize("create", "ComplianceCheck"), createCheck);

export default router;
