import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/authorize.middleware";
import { validate } from "../../middleware/validate.middleware";
import { listSchools, createSchool, getSchool, updateSchool, deleteSchool, listSchoolPerformance, createSchoolPerformance, schoolValidation, performanceValidation } from "./schools.controller";

const router = Router();
router.use(authenticate);

router.get("/", authorize("read", "School"), listSchools);
router.post("/", authorize("create", "School"), schoolValidation, validate, createSchool);
router.get("/:id", authorize("read", "School"), getSchool);
router.put("/:id", authorize("update", "School"), updateSchool);
router.delete("/:id", authorize("delete", "School"), deleteSchool);
router.get("/:id/performance", authorize("read", "SchoolPerformance"), listSchoolPerformance);
router.post("/:id/performance", authorize("create", "SchoolPerformance"), performanceValidation, validate, createSchoolPerformance);

export default router;
