import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/authorize.middleware";
import { validate } from "../../middleware/validate.middleware";
import { listReliefApplications, createReliefApplication, getReliefApplication, updateReliefApplication, deleteReliefApplication, reliefValidation } from "./relief-applications.controller";

const router = Router();
router.use(authenticate);

router.get("/", authorize("read", "ReliefApplication"), listReliefApplications);
router.post("/", authorize("create", "ReliefApplication"), reliefValidation, validate, createReliefApplication);
router.get("/:id", authorize("read", "ReliefApplication"), getReliefApplication);
router.put("/:id", authorize("update", "ReliefApplication"), updateReliefApplication);
router.delete("/:id", authorize("delete", "ReliefApplication"), deleteReliefApplication);

export default router;
