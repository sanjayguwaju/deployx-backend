import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/authorize.middleware";
import { validate } from "../../middleware/validate.middleware";
import { listEmployers, createEmployer, employerValidation, getEmployer, updateEmployer, deleteEmployer, uploadEmployerAgreement } from "./employers.controller";

const router = Router();
router.use(authenticate);

router.get("/", authorize("read", "Employer"), listEmployers);
router.post("/", authorize("create", "Employer"), employerValidation, validate, createEmployer);
router.get("/:id", authorize("read", "Employer"), getEmployer);
router.patch("/:id", authorize("update", "Employer"), updateEmployer);
router.delete("/:id", authorize("delete", "Employer"), deleteEmployer);
router.post("/:id/agreements", authorize("update", "Employer"), uploadEmployerAgreement);

export default router;
