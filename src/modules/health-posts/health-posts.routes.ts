import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/authorize.middleware";
import { validate } from "../../middleware/validate.middleware";
import { listHealthPosts, createHealthPost, getHealthPost, updateHealthPost, deleteHealthPost, healthPostValidation } from "./health-posts.controller";

const router = Router();
router.use(authenticate);

router.get("/", authorize("read", "HealthPost"), listHealthPosts);
router.post("/", authorize("create", "HealthPost"), healthPostValidation, validate, createHealthPost);
router.get("/:id", authorize("read", "HealthPost"), getHealthPost);
router.put("/:id", authorize("update", "HealthPost"), updateHealthPost);
router.delete("/:id", authorize("delete", "HealthPost"), deleteHealthPost);

export default router;
