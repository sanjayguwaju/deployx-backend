import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/authorize.middleware";
import { validate } from "../../middleware/validate.middleware";
import { listCorrespondence, createCorrespondence, corrValidation, getCorrespondence, updateCorrespondence, deleteCorrespondence } from "./correspondence.controller";

const router = Router();
router.use(authenticate);

router.get("/", authorize("read", "Correspondence"), listCorrespondence);
router.post("/", authorize("create", "Correspondence"), corrValidation, validate, createCorrespondence);
router.get("/:id", authorize("read", "Correspondence"), getCorrespondence);
router.put("/:id", authorize("update", "Correspondence"), updateCorrespondence);
router.delete("/:id", authorize("delete", "Correspondence"), deleteCorrespondence);

export default router;
