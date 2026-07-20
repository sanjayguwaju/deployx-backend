import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/authorize.middleware";
import { getMedicalByPipeline, createOrUpdateMedical } from "./medical.controller";

const router = Router();
router.use(authenticate);

router.get("/pipeline/:pipelineId", authorize("read", "Medical"), getMedicalByPipeline);
router.post("/", authorize("create", "Medical"), createOrUpdateMedical);

export default router;
