import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/authorize.middleware";
import { validate } from "../../middleware/validate.middleware";
import { listProjects, createProject, getProject, updateProject, deleteProject, listMilestones, createMilestone, projectValidation, milestoneValidation } from "./infra-projects.controller";
import infraPaymentsRouter from "../infra-payments/infra-payments.routes";

const router = Router();
router.use(authenticate);

router.get("/", authorize("read", "InfraProject"), listProjects);
router.post("/", authorize("create", "InfraProject"), projectValidation, validate, createProject);
router.get("/:id", authorize("read", "InfraProject"), getProject);
router.put("/:id", authorize("update", "InfraProject"), updateProject);
router.delete("/:id", authorize("delete", "InfraProject"), deleteProject);
router.get("/:id/milestones", authorize("read", "InfraMilestone"), listMilestones);
router.post("/:id/milestones", authorize("create", "InfraMilestone"), milestoneValidation, validate, createMilestone);

router.use("/:projectId/payments", infraPaymentsRouter);

export default router;
