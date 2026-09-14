import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/authorize.middleware";
import { validate } from "../../middleware/validate.middleware";
import { 
  getPipelines,
  getDemandPipeline, 
  addToPipeline, 
  updatePipelineStage, 
  assignPipeline, 
  getPipelineHistory,
  removeFromPipeline,
  addToPipelineValidation
} from "./pipeline.controller";

const router = Router();
router.use(authenticate);

// List/Query pipelines across demands or by query param
router.get("/", authorize("read", "Pipeline"), getPipelines);
router.post("/", authorize("create", "Pipeline"), addToPipelineValidation, validate, addToPipeline);

// Demand specific endpoints
router.get("/demand/:id", authorize("read", "Pipeline"), getDemandPipeline);
router.post("/demand/:id", authorize("create", "Pipeline"), addToPipelineValidation, validate, addToPipeline);

// Single record operations
router.patch("/:id/stage", authorize("update", "Pipeline"), updatePipelineStage);
router.patch("/:id/assign", authorize("update", "Pipeline"), assignPipeline);
router.get("/:id/history", authorize("read", "Pipeline"), getPipelineHistory);
router.delete("/:id", authorize("delete", "Pipeline"), removeFromPipeline);

export default router;
