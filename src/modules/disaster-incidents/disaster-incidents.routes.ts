import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/authorize.middleware";
import { validate } from "../../middleware/validate.middleware";
import { listIncidents, createIncident, getIncident, updateIncident, deleteIncident, listDamageAssessments, createDamageAssessment, incidentValidation, damageValidation } from "./disaster-incidents.controller";

const router = Router();
router.use(authenticate);

router.get("/", authorize("read", "DisasterIncident"), listIncidents);
router.post("/", authorize("create", "DisasterIncident"), incidentValidation, validate, createIncident);
router.get("/:id", authorize("read", "DisasterIncident"), getIncident);
router.put("/:id", authorize("update", "DisasterIncident"), updateIncident);
router.delete("/:id", authorize("delete", "DisasterIncident"), deleteIncident);
router.get("/:id/damage-assessments", authorize("read", "DamageAssessment"), listDamageAssessments);
router.post("/:id/damage-assessments", authorize("create", "DamageAssessment"), damageValidation, validate, createDamageAssessment);

export default router;
