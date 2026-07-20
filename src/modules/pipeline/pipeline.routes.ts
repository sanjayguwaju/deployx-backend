import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/authorize.middleware";
import { validate } from "../../middleware/validate.middleware";
import { 
  getDemandPipeline, 
  addToPipeline, 
  updatePipelineStage, 
  assignPipeline, 
  getPipelineHistory,
  addToPipelineValidation
} from "./pipeline.controller";

const router = Router();
router.use(authenticate);

// Note: Demands pipelines are structured logically under /demands/:id/pipeline
// We will mount this router under /api/v1/pipeline, but we also want the nested routes.
// We can use a pattern like /api/v1/pipeline/demand/:id to fetch by demand, or just mount
// it explicitly. 

router.get("/demand/:id", authorize("read", "Pipeline"), getDemandPipeline);
router.post("/demand/:id", authorize("create", "Pipeline"), addToPipelineValidation, validate, addToPipeline);

router.patch("/:id/stage", authorize("update", "Pipeline"), updatePipelineStage);
router.patch("/:id/assign", authorize("update", "Pipeline"), assignPipeline);
router.get("/:id/history", authorize("read", "Pipeline"), getPipelineHistory);

export default router;
