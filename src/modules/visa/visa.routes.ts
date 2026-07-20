import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/authorize.middleware";
import { getVisaByPipeline, createOrUpdateVisa } from "./visa.controller";

const router = Router();
router.use(authenticate);

router.get("/pipeline/:pipelineId", authorize("read", "Visa"), getVisaByPipeline);
router.post("/", authorize("create", "Visa"), createOrUpdateVisa);

export default router;
