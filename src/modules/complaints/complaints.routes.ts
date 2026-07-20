import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/authorize.middleware";
import { validate } from "../../middleware/validate.middleware";
import { listComplaints, createComplaint, complaintValidation, getComplaint, resolveComplaint, updateComplaint, deleteComplaint } from "./complaints.controller";

const router = Router();
router.use(authenticate);

router.get("/", authorize("read", "Complaint"), listComplaints);
router.post("/", authorize("create", "Complaint"), complaintValidation, validate, createComplaint);
router.get("/:id", authorize("read", "Complaint"), getComplaint);
router.put("/:id", authorize("update", "Complaint"), updateComplaint);
router.delete("/:id", authorize("delete", "Complaint"), deleteComplaint);
router.patch("/:id/resolve", authorize("approve", "Complaint"), resolveComplaint);

export default router;
