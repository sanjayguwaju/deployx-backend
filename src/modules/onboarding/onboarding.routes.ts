import { Router } from "express";
import { validate } from "../../middleware/validate.middleware";
import { registerTenant, registerTenantValidation } from "./onboarding.controller";

const router = Router();

router.post("/register", registerTenantValidation, validate, registerTenant);

export default router;
