import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/authorize.middleware";
import { getDeploymentByPipeline, createOrUpdateDeployment } from "./deployment.controller";

const router = Router();
router.use(authenticate);

router.get("/pipeline/:pipelineId", authorize("read", "Deployment"), getDeploymentByPipeline);
router.post("/", authorize("create", "Deployment"), createOrUpdateDeployment);

export default router;
